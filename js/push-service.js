/* =========================================================================
   WEB PUSH & DAILY REMINDER SERVICE (Opt-in by default · Easy 1-tap opt-out)
   - End-to-End ECDH P-256 + AES-256-GCM sealing of browser PushSubscription
   - Service Worker native notification + local tea-time fallback
   - Strict ES2019 compatibility & $0.00 Firebase Spark quota safety
   ========================================================================= */

import { syncPushReminderDoc } from './firebase-service.js';
import { getTodayDateStr, saveState } from './storage.js';

export const VAPID_PUBLIC_KEY =
  'BEgGdd3LZ3TCMcPJda-2H33mUB4pKMJU-0-ZFTIlPLOcn5PfayDRwP2AIK0rUjkp0sS6m-cAyNiNtHEEZLFT7K4';

const PUSH_BOX_PUBLIC_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'Y258jfMijFefTaEsvA_P63M3zsiZA3vxU7PCDmCKdho',
  y: 'NubLDTsEYFVrL_ecy9bOxizMWE6q6h2vScvSlEn7xoI'
};

const LOCAL_NOTIF_SENT_KEY = 'daily_mindsum_last_local_notif_date_v1';

function b64urlToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToB64url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

export function isIosNeedsHomeScreenForPush() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    Boolean(window.navigator.standalone) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  return isIos && !isStandalone && !('Notification' in window);
}

export function getNotificationPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function computeUtcReminderHour(localHour) {
  const cleanLocal = typeof localHour === 'number' ? localHour : 9;
  const offsetHours = Math.round(new Date().getTimezoneOffset() / 60);
  return ((cleanLocal + offsetHours) % 24 + 24) % 24;
}

/**
 * Encrypts { e: endpoint, p: p256dh, a: auth } in the browser using ephemeral ECDH P-256 + AES-256-GCM
 * so Firestore never stores plaintext push endpoints.
 */
export async function sealSubscriptionForCloud(subJson) {
  if (!window.crypto || !window.crypto.subtle) return '';
  const endpoint = subJson && subJson.endpoint ? String(subJson.endpoint) : '';
  const keys = (subJson && subJson.keys) || {};
  if (!endpoint || !keys.p256dh || !keys.auth) return '';

  const subtle = window.crypto.subtle;
  const recipientPubKey = await subtle.importKey(
    'jwk',
    PUSH_BOX_PUBLIC_JWK,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const ephemeralPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const epkRawBuf = await subtle.exportKey('raw', ephemeralPair.publicKey);
  const epkBytes = new Uint8Array(epkRawBuf);

  const sharedBits = await subtle.deriveBits(
    { name: 'ECDH', public: recipientPubKey },
    ephemeralPair.privateKey,
    256
  );
  const sharedBytes = new Uint8Array(sharedBits);

  const hashInput = new Uint8Array(sharedBytes.length + epkBytes.length);
  hashInput.set(sharedBytes, 0);
  hashInput.set(epkBytes, sharedBytes.length);

  const aesKeyBuf = await subtle.digest('SHA-256', hashInput);
  const aesKey = await subtle.importKey('raw', aesKeyBuf, { name: 'AES-GCM' }, false, ['encrypt']);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plainText = JSON.stringify({
    e: endpoint,
    p: String(keys.p256dh),
    a: String(keys.auth)
  });
  const encodedPlain = new TextEncoder().encode(plainText);

  const cipherBuf = await subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, aesKey, encodedPlain);
  const cipherBytes = new Uint8Array(cipherBuf);

  const combined = new Uint8Array(epkBytes.length + iv.length + cipherBytes.length);
  combined.set(epkBytes, 0);
  combined.set(iv, epkBytes.length);
  combined.set(cipherBytes, epkBytes.length + iv.length);

  return uint8ArrayToB64url(combined);
}

/**
 * Requests permission (when called from a user gesture) or silently refreshes an already-granted
 * Web Push subscription, then syncs the encrypted subscription to Firestore.
 */
export async function ensureWebPushSubscribed(state, allowPrompt) {
  if (!state || !state.prefs || state.prefs.dailyReminder === false) {
    return { ok: false, reason: 'opted_out' };
  }
  if (!isPushNotificationSupported()) {
    return { ok: false, reason: 'unsupported' };
  }

  let perm = Notification.permission;
  if (perm === 'default' && allowPrompt) {
    try {
      perm = await Notification.requestPermission();
    } catch (e) {
      perm = Notification.permission;
    }
  }
  if (perm !== 'granted') {
    return { ok: false, reason: perm };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = null;
    if (reg.pushManager) {
      sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64urlToUint8Array(VAPID_PUBLIC_KEY)
        });
      }
    }

    let sealed = '';
    if (sub && typeof sub.toJSON === 'function') {
      sealed = await sealSubscriptionForCloud(sub.toJSON());
    }

    if (sealed) {
      const doneToday =
        state.daily &&
        state.daily.date === getTodayDateStr() &&
        Object.keys(state.daily.stamps || {}).length >= 4
          ? getTodayDateStr()
          : '';
      await syncPushReminderDoc(state, {
        enabled: true,
        sealedSub: sealed,
        utcHour: computeUtcReminderHour(state.prefs.reminderHour),
        lastDoneDate: doneToday
      });
    }

    return { ok: true, hasWebPush: Boolean(sealed) };
  } catch (err) {
    console.warn('Web Push subscription note:', err);
    return { ok: true, hasWebPush: false, note: (err && err.message) || '' };
  }
}

/**
 * Easy 1-tap opt-out: disables local preference, unsubscribes browser PushManager,
 * and marks cloud pushReminders doc disabled with empty sealedSub.
 */
export async function optOutDailyReminder(state) {
  if (state && state.prefs) {
    state.prefs.dailyReminder = false;
    state.prefs.reminderBannerDismissed = true;
    saveState(state);
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('./sw.js');
      if (reg && reg.pushManager) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
    } catch (e) {
      // ignore unsubscribe error
    }
  }

  try {
    await syncPushReminderDoc(state, {
      enabled: false,
      sealedSub: '',
      utcHour: computeUtcReminderHour(state && state.prefs ? state.prefs.reminderHour : 9),
      lastDoneDate: ''
    });
  } catch (e) {
    // ignore offline/unauth
  }
}

/**
 * Updates lastDoneDate in cloud when today's dishes are played so we never nag a player who already played!
 */
export async function markPushPlayedToday(state) {
  if (!state || !state.prefs || state.prefs.dailyReminder === false) return;
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const sealed = await sealSubscriptionForCloud(sub.toJSON());
    if (!sealed) return;
    await syncPushReminderDoc(state, {
      enabled: true,
      sealedSub: sealed,
      utcHour: computeUtcReminderHour(state.prefs.reminderHour),
      lastDoneDate: getTodayDateStr()
    });
  } catch (e) {
    // ignore
  }
}

/**
 * Sends an instant test notification through the Service Worker so players can verify reminders work!
 */
export async function sendTestReminderNotification(lang) {
  if (!isPushNotificationSupported()) return false;
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') return false;

  const zh = lang !== 'en';
  const title = zh ? '🫖 每日腦點心 · 提醒測試成功！' : '🫖 Daily MindSum · Reminder Active!';
  const body = zh
    ? '喵～！阿喵每日會準時溫馨提醒你嘆早茶動腦筋（隨時可一鍵關閉）🐾'
    : 'Meow~! Mochi will gently remind you for daily Brain Dim Sum (easy 1-tap opt-out anytime) 🐾';

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, {
        body: body,
        icon: './assets/icon-192.png',
        badge: './assets/favicon-64.png',
        tag: 'daily-mindsum-test'
      });
      return true;
    }
  } catch (e) {
    // fallback to window Notification
  }
  try {
    new Notification(title, { body: body, icon: './assets/icon-192.png' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Local active-browser fallback: if the browser/PWA is open at or after the user's chosen local reminderHour
 * and they haven't played any dish yet today, fire at most 1 gentle local notification per day.
 */
export async function checkLocalReminderIfDue(state) {
  if (!state || !state.prefs || state.prefs.dailyReminder === false) return;
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') return;

  const today = getTodayDateStr();
  const stampsCount =
    state.daily && state.daily.date === today ? Object.keys(state.daily.stamps || {}).length : 0;
  if (stampsCount > 0 || (state.stats && state.stats.todayDate === today && state.stats.todayPoints > 0)) {
    return;
  }

  const nowHour = new Date().getHours();
  const targetHour = typeof state.prefs.reminderHour === 'number' ? state.prefs.reminderHour : 9;
  if (nowHour < targetHour) return;

  try {
    if (localStorage.getItem(LOCAL_NOTIF_SENT_KEY) === today) return;
    localStorage.setItem(LOCAL_NOTIF_SENT_KEY, today);
  } catch (e) {
    return;
  }

  const zh = state.lang !== 'en';
  const title = zh ? '🫖 每日腦點心 · 嘆早茶動腦筋時間！' : '🫖 Daily MindSum · Tea & Brain Time!';
  const body = zh
    ? '喵～今日嘅「時事必玩」同 3 籠腦點心已經準備好，入嚟輕鬆玩兩局啦！'
    : "Meow~! Today's Daily News + 3 Brain Dim Sum dishes are ready whenever you are!";

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, {
        body: body,
        icon: './assets/icon-192.png',
        badge: './assets/favicon-64.png',
        tag: 'daily-mindsum-reminder',
        actions: [{ action: 'optout', title: zh ? '🔕 關閉提醒' : '🔕 Turn Off' }]
      });
    }
  } catch (e) {
    // ignore
  }
}
