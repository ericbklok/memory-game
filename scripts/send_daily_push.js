#!/usr/bin/env node
/**
 * Zero-Dependency RFC 8291 (aes128gcm) + RFC 8292 (VAPID ES256) Web Push Dispatcher
 * Runs on free GitHub Actions schedule; decrypts end-to-end sealed PushSubscriptions
 * using WEB_PUSH_SECRET and sends gentle daily reminders only to opted-in players
 * who have not yet played today. Costs $0.00 forever.
 */

'use strict';

const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');

const PROJECT_ID = 'memory-game-f80b6';
const APP_URL = 'https://ericbklok.github.io/memory-game/';

const ALLOWED_PUSH_HOST_SUFFIXES = [
  '.googleapis.com',
  '.google.com',
  '.push.apple.com',
  '.mozilla.com',
  '.mozaws.net',
  '.windows.com'
];

function b64urlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlDecode(str) {
  const clean = String(str || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = clean.length % 4 === 0 ? '' : '='.repeat(4 - (clean.length % 4));
  return Buffer.from(clean + pad, 'base64');
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function hkdfExtract(salt, ikm) {
  const actualSalt = salt && salt.length ? salt : Buffer.alloc(32, 0);
  return hmacSha256(actualSalt, ikm);
}

function hkdfExpand(prk, info, length) {
  let prev = Buffer.alloc(0);
  const chunks = [];
  let total = 0;
  let counter = 1;
  while (total < length) {
    const h = crypto.createHmac('sha256', prk);
    h.update(prev);
    h.update(info);
    h.update(Buffer.from([counter]));
    prev = h.digest();
    chunks.push(prev);
    total += prev.length;
    counter += 1;
  }
  return Buffer.concat(chunks).slice(0, length);
}

/**
 * Converts ASN.1 DER ECDSA signature to raw 64-byte IEEE P1363 (r || s) for ES256 JWT.
 */
function derToJoseEs256(derSig) {
  let offset = 0;
  if (derSig[offset++] !== 0x30) throw new Error('Invalid DER sequence');
  let seqLen = derSig[offset++];
  if (seqLen & 0x80) {
    const nBytes = seqLen & 0x7f;
    offset += nBytes;
  }
  if (derSig[offset++] !== 0x02) throw new Error('Invalid DER r marker');
  const rLen = derSig[offset++];
  let r = derSig.slice(offset, offset + rLen);
  offset += rLen;

  if (derSig[offset++] !== 0x02) throw new Error('Invalid DER s marker');
  const sLen = derSig[offset++];
  let s = derSig.slice(offset, offset + sLen);

  while (r.length > 32 && r[0] === 0x00) r = r.slice(1);
  while (s.length > 32 && s[0] === 0x00) s = s.slice(1);
  if (r.length > 32 || s.length > 32) throw new Error('Invalid ES256 coordinate length');

  const out = Buffer.alloc(64, 0);
  r.copy(out, 32 - r.length);
  s.copy(out, 64 - s.length);
  return out;
}

function createVapidAuthHeader(endpointUrl, vapidSubject, vapidPublicKey, vapidPrivatePem) {
  const parsed = new URL(endpointUrl);
  const aud = parsed.origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const headerB64 = b64urlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payloadB64 = b64urlEncode(JSON.stringify({ aud: aud, exp: exp, sub: vapidSubject }));
  const signingInput = headerB64 + '.' + payloadB64;

  const signer = crypto.createSign('SHA256');
  signer.update(signingInput);
  const derSig = signer.sign(vapidPrivatePem);
  const joseSig = derToJoseEs256(derSig);
  const jwt = signingInput + '.' + b64urlEncode(joseSig);

  return 'vapid t=' + jwt + ', k=' + vapidPublicKey;
}

/**
 * Decrypts client-sealed PushSubscription (epk65 || iv12 || ciphertext || tag16).
 */
function unsealPushSubscription(sealedB64, boxPrivateKeyB64) {
  const raw = b64urlDecode(sealedB64);
  if (raw.length < 65 + 12 + 16 + 10) {
    throw new Error('Sealed payload too short');
  }
  const epk65 = raw.slice(0, 65);
  const iv12 = raw.slice(65, 77);
  const ct = raw.slice(77, raw.length - 16);
  const tag16 = raw.slice(raw.length - 16);

  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(b64urlDecode(boxPrivateKeyB64));
  const sharedSecret = ecdh.computeSecret(epk65);

  const aesKey = crypto
    .createHash('sha256')
    .update(Buffer.concat([sharedSecret, epk65]))
    .digest();

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv12);
  decipher.setAuthTag(tag16);
  const plainBuf = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(plainBuf.toString('utf8'));
}

/**
 * Encrypts UTF-8 notification JSON per RFC 8291 (aes128gcm Web Push Encryption).
 */
function encryptWebPushAes128Gcm(payloadUtf8, p256dhB64, authB64) {
  const uaPublic = b64urlDecode(p256dhB64);
  const authSecret = b64urlDecode(authB64);
  if (uaPublic.length !== 65 || authSecret.length !== 16) {
    throw new Error('Invalid subscriber p256dh/auth key length');
  }

  const senderEcdh = crypto.createECDH('prime256v1');
  senderEcdh.generateKeys();
  const asPublic = senderEcdh.getPublicKey(); // 65 bytes uncompressed
  const ecdhSecret = senderEcdh.computeSecret(uaPublic);

  const salt = crypto.randomBytes(16);

  // RFC 8291 Section 3.3 & 3.4 key derivation
  const prkKey = hkdfExtract(authSecret, ecdhSecret);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\x00', 'ascii'), uaPublic, asPublic]);
  const ikm = hkdfExpand(prkKey, keyInfo, 32);

  const prk = hkdfExtract(salt, ikm);
  const cek = hkdfExpand(prk, Buffer.from('Content-Encoding: aes128gcm\x00', 'ascii'), 16);
  const nonce = hkdfExpand(prk, Buffer.from('Content-Encoding: nonce\x00', 'ascii'), 12);

  // Single final record padded with 0x02 delimiter per RFC 8188
  const plainRecord = Buffer.concat([Buffer.from(payloadUtf8, 'utf8'), Buffer.from([0x02])]);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plainRecord), cipher.final(), cipher.getAuthTag()]);

  // 86-byte aes128gcm content-coding header: salt(16) || rs(4, 4096) || idlen(1, 65) || keyid(65)
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header.writeUInt8(asPublic.length, 20);

  return Buffer.concat([header, asPublic, encrypted]);
}

function isAllowedPushEndpoint(endpointStr) {
  try {
    const u = new URL(endpointStr);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_PUSH_HOST_SUFFIXES.some(function (sfx) {
      return host.endsWith(sfx);
    });
  } catch (e) {
    return false;
  }
}

function httpsRequest(urlStr, options, bodyBuf) {
  return new Promise(function (resolve, reject) {
    const u = new URL(urlStr);
    const reqOpts = Object.assign(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        timeout: 12000
      },
      options || {}
    );
    const req = https.request(reqOpts, function (res) {
      const chunks = [];
      res.on('data', function (c) {
        chunks.push(c);
      });
      res.on('end', function () {
        resolve({
          status: res.statusCode || 0,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', function () {
      req.destroy(new Error('Request timeout'));
    });
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function parseFirestoreFields(fieldsObj) {
  const out = {};
  const f = fieldsObj || {};
  Object.keys(f).forEach(function (k) {
    const v = f[k];
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('booleanValue' in v) out[k] = Boolean(v.booleanValue);
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('timestampValue' in v) out[k] = v.timestampValue;
  });
  return out;
}

async function fetchEnabledPushSubscribers() {
  const queryUrl =
    'https://firestore.googleapis.com/v1/projects/' +
    PROJECT_ID +
    '/databases/(default)/documents:runQuery';

  const body = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'pushReminders' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'enabled' },
          op: 'EQUAL',
          value: { booleanValue: true }
        }
      },
      limit: 200
    }
  });

  const res = await httpsRequest(
    queryUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    },
    Buffer.from(body)
  );

  if (res.status !== 200) {
    throw new Error('Firestore query HTTP ' + res.status + ': ' + res.body.slice(0, 240));
  }

  const arr = JSON.parse(res.body);
  const subs = [];
  if (Array.isArray(arr)) {
    arr.forEach(function (entry) {
      if (entry && entry.document && entry.document.fields) {
        subs.push(parseFirestoreFields(entry.document.fields));
      }
    });
  }
  return subs;
}

function getDateStrInOffsetHours(offsetHours) {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function buildReminderMessage(lang) {
  if (lang === 'en') {
    return {
      title: '🫖 Daily MindSum · Tea & Brain Time!',
      body: "Meow~! Mochi has today's Daily News + 3 fresh Brain Dim Sum dishes ready for you!",
      url: APP_URL,
      tag: 'daily-mindsum-reminder'
    };
  }
  return {
    title: '🫖 每日腦點心 · 嘆早茶動腦筋時間！',
    body: '喵～阿喵已經準備好今日「時事必玩」同 3 籠新鮮腦點心，入嚟輕鬆蓋印仔啦！',
    url: APP_URL,
    tag: 'daily-mindsum-reminder'
  };
}

async function runMain() {
  const secretRaw = (process.env.WEB_PUSH_SECRET || '').trim();
  if (!secretRaw) {
    console.log('Notice: WEB_PUSH_SECRET is not set in GitHub Actions Secrets yet. Skipping push dispatch cleanly.');
    return;
  }

  let secretCfg;
  try {
    const decoded = secretRaw.startsWith('{')
      ? secretRaw
      : Buffer.from(secretRaw, 'base64').toString('utf8');
    secretCfg = JSON.parse(decoded);
  } catch (err) {
    throw new Error('Failed to parse WEB_PUSH_SECRET JSON: ' + err.message);
  }

  const forceSend = String(process.env.FORCE_SEND || '').toLowerCase() === 'true';
  const nowUtcHour = new Date().getUTCHours();
  const hkToday = getDateStrInOffsetHours(8);
  const yvrToday = getDateStrInOffsetHours(-8);

  const subscribers = await fetchEnabledPushSubscribers();
  console.log('Loaded ' + subscribers.length + ' enabled push subscriber(s). Current UTC hour: ' + nowUtcHour);

  let sentCount = 0;
  let skippedPlayed = 0;
  let skippedHour = 0;

  for (let i = 0; i < subscribers.length; i++) {
    const sub = subscribers[i];
    if (!sub || !sub.enabled || !sub.sealedSub) continue;

    // Match user's preferred UTC reminder hour (allow +-0 hour match, unless manual FORCE_SEND=true)
    const targetUtcHour = typeof sub.reminderHour === 'number' ? sub.reminderHour : 1;
    if (!forceSend && targetUtcHour !== nowUtcHour) {
      skippedHour += 1;
      continue;
    }

    // Skip if player already completed a game today in their region's calendar date
    const expectedToday = sub.region === 'yvr' ? yvrToday : hkToday;
    if (!forceSend && sub.lastDoneDate && (sub.lastDoneDate === expectedToday || sub.lastDoneDate === hkToday || sub.lastDoneDate === yvrToday)) {
      skippedPlayed += 1;
      continue;
    }

    let pushTarget;
    try {
      pushTarget = unsealPushSubscription(sub.sealedSub, secretCfg.boxPrivateKey);
    } catch (e) {
      console.warn('Skipping unreadable sealed subscription for uid=' + (sub.uid || '?'));
      continue;
    }

    if (!pushTarget || !isAllowedPushEndpoint(pushTarget.e)) {
      console.warn('Skipping disallowed push endpoint host');
      continue;
    }

    const msgObj = buildReminderMessage(sub.lang);
    const bodyBuf = encryptWebPushAes128Gcm(JSON.stringify(msgObj), pushTarget.p, pushTarget.a);
    const vapidAuth = createVapidAuthHeader(
      pushTarget.e,
      secretCfg.vapidSubject || 'mailto:noreply@ericbklok.github.io',
      secretCfg.vapidPublicKey,
      secretCfg.vapidPrivatePem
    );

    try {
      const pushRes = await httpsRequest(
        pushTarget.e,
        {
          method: 'POST',
          headers: {
            Authorization: vapidAuth,
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Content-Length': bodyBuf.length,
            TTL: '43200',
            Urgency: 'normal'
          }
        },
        bodyBuf
      );
      if (pushRes.status >= 200 && pushRes.status < 300) {
        sentCount += 1;
      } else {
        console.warn('Push endpoint returned HTTP ' + pushRes.status);
      }
    } catch (netErr) {
      console.warn('Push delivery error: ' + netErr.message);
    }
  }

  console.log(
    'Web Push dispatch complete -> sent: ' +
      sentCount +
      ', skipped (other hour): ' +
      skippedHour +
      ', skipped (already played today): ' +
      skippedPlayed
  );
}

if (require.main === module) {
  runMain().catch(function (err) {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  b64urlEncode,
  b64urlDecode,
  unsealPushSubscription,
  encryptWebPushAes128Gcm,
  createVapidAuthHeader,
  isAllowedPushEndpoint
};
