#!/usr/bin/env python3
"""
Fetches fresh HK (RTHK) and Vancouver/BC (Global BC) RSS headlines
to prepend uniquely dated 'Read & Recall' quiz cards into data/daily-news.json,
retaining rolling live archives alongside all 435+ curated bilingual HK × Vancouver × Wellness stories.
"""
import datetime
import hashlib
import html
import json
import pathlib
import re
import ssl
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
NEWS_PATH = ROOT / "data" / "daily-news.json"

FEEDS = [
    {
        "region": "hk",
        "lang": "zh",
        "tag": {"zh": "🇭🇰 香港即時新聞", "en": "🇭🇰 HK Today"},
        "url": "https://rthk9.rthk.hk/rthk/news/rss/c_expressnews_clocal.xml",
    },
    {
        "region": "yvr",
        "lang": "en",
        "tag": {"zh": "🇨🇦 大溫哥華新聞", "en": "🇨🇦 Vancouver & BC"},
        "url": "https://globalnews.ca/bc/feed/",
    },
]

SKIP_WORDS = re.compile(
    r"(murder|killed|shooting|fatal|homicide|suicide|assault|stabbing|死亡|謀殺|墮樓|命案|斬傷|身亡)",
    re.IGNORECASE,
)

DISTRACTOR_POOL = [
    {"zh": "全港郵政局宣佈逢星期日免費派發紀念郵票冊", "en": "Post offices announce free Sunday commemorative stamp albums"},
    {"zh": "天星小輪推出雙層帆船造型海上圖書館專線", "en": "Star Ferry unveils a two-deck tall-ship floating library route"},
    {"zh": "溫哥華架空列車增設車廂手沖茗茶體驗專區", "en": "SkyTrain launches an onboard pour-over oolong tea tasting car"},
    {"zh": "山頂纜車宣布改用太陽能熱氣球接載遊客上山", "en": "Peak Tramway announces solar hot-air balloon transfers to Victoria Peak"},
    {"zh": "史丹利公園海堤舉辦千人古典豎琴日出音樂會", "en": "Stanley Park Seawall hosts a 1,000-harpist sunrise symphony"},
    {"zh": "大嶼山昂坪增設全港首座室內冰雪溫室花園", "en": "Ngong Ping opens Hong Kong's first indoor alpine snow conservatory"},
    {"zh": "列治文漁人碼頭展出百年巨型木製蒸汽潛水艇", "en": "Steveston Wharf unveils a century-old wooden steam submarine"},
    {"zh": "維多利亞公園舉辦國際紫砂茶壺飛行模型大賽", "en": "Victoria Park hosts an international flying-teapot model derby"},
    {"zh": "北溫海上巴士推出透明玻璃船底觀賞珊瑚航線", "en": "North Shore SeaBus debuts glass-bottom coral viewing hulls"},
    {"zh": "沙田城門河畔新設三公里長室內恆溫溜冰步道", "en": "Shing Mun River opens a 3-km indoor climate-controlled skating promenade"},
    {"zh": "本拿比山公園宣布全年開放夜間螢火蟲纜車", "en": "Burnaby Mountain launches year-round firefly night gondolas"},
    {"zh": "西貢離島開辦週末水上太陽能粵曲歌劇院", "en": "Sai Kung islands launch a floating solar Cantonese opera amphitheatre"},
]


def strip_html(raw: str) -> str:
    # Unescape HTML entities BEFORE stripping tags so encoded tags (&lt;script&gt;) cannot survive
    cleaned = html.unescape(html.unescape(raw or ""))
    cleaned = re.sub(r"<[^>]*>", " ", cleaned)
    cleaned = cleaned.replace("<", "").replace(">", "")
    return re.sub(r"\s+", " ", cleaned).strip()


def fetch_rss_items(url: str, max_items: int = 3):
    req = urllib.request.Request(url, headers={"User-Agent": "DailyMindSumBot/2.0"})
    cafile = "/etc/ssl/cert.pem" if pathlib.Path("/etc/ssl/cert.pem").exists() else None
    ctx = ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
        # Bound response read to 1 MiB max and reject XML entity declarations (XXE / Billion Laughs protection)
        xml_bytes = resp.read(1_048_576)
    if b"<!ENTITY" in xml_bytes.upper():
        raise ValueError("Rejected XML feed containing ENTITY declarations")
    root = ET.fromstring(xml_bytes)
    items = []
    for item in root.findall(".//item"):
        title = strip_html(item.findtext("title") or "")
        desc = strip_html(item.findtext("description") or "")
        if not title or len(desc) < 25:
            continue
        if SKIP_WORDS.search(title) or SKIP_WORDS.search(desc):
            continue
        items.append((title, desc[:240]))
        if len(items) >= max_items:
            break
    return items


def build_live_cards(today_compact: str):
    cards = []
    for feed in FEEDS:
        try:
            fetched = fetch_rss_items(feed["url"], max_items=3)
        except Exception as exc:
            print(f"[warn] Could not fetch {feed['url']}: {exc}")
            continue

        for title, desc in fetched:
            digest = hashlib.sha1(title.encode("utf-8")).hexdigest()[:8]
            card_id = f"live-{feed['region']}-{today_compact}-{digest}"
            d_idx = int(digest[:4], 16) % len(DISTRACTOR_POOL)
            d1 = DISTRACTOR_POOL[d_idx]
            d2 = DISTRACTOR_POOL[(d_idx + 5) % len(DISTRACTOR_POOL)]

            if feed["lang"] == "zh":
                cards.append(
                    {
                        "id": card_id,
                        "region": feed["region"],
                        "tag": feed["tag"],
                        "headline": {"zh": title, "en": f"[HK News] {title}"},
                        "summary": {"zh": desc, "en": desc},
                        "question": {
                            "zh": "根據剛才讀到嘅香港新聞重點，以下邊一項係報道提及嘅主題？",
                            "en": "Which topic was featured in the Hong Kong news brief you just read?",
                        },
                        "choices": [
                            {"zh": title[:42], "en": title[:65]},
                            d1,
                            d2,
                        ],
                        "answerIndex": 0,
                    }
                )
            else:
                cards.append(
                    {
                        "id": card_id,
                        "region": feed["region"],
                        "tag": feed["tag"],
                        "headline": {"zh": f"【溫哥華快訊】{title}", "en": title},
                        "summary": {"zh": desc, "en": desc},
                        "question": {
                            "zh": "根據剛才嘅大溫哥華新聞快訊，報道標題提到邊一件事？",
                            "en": "Which headline did you just read in the Vancouver & BC news brief?",
                        },
                        "choices": [
                            {"zh": title[:65], "en": title[:70]},
                            d1,
                            d2,
                        ],
                        "answerIndex": 0,
                    }
                )
    return cards


def main():
    existing = json.loads(NEWS_PATH.read_text(encoding="utf-8"))
    all_existing = existing.get("stories", [])
    curated = [s for s in all_existing if not str(s.get("id", "")).startswith("live-")]
    prior_live = [s for s in all_existing if str(s.get("id", "")).startswith("live-")]

    today = datetime.date.today()
    today_str = today.isoformat()
    today_compact = today.strftime("%Y%m%d")

    fresh_live = build_live_cards(today_compact)
    seen_ids = set()
    merged_live = []
    for card in fresh_live + prior_live:
        cid = card.get("id")
        if cid and cid not in seen_ids:
            seen_ids.add(cid)
            merged_live.append(card)

    # Keep up to 120 dated live stories + all 435+ curated stories
    merged = {
        "updatedAt": today_str,
        "stories": merged_live[:120] + curated,
    }
    NEWS_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {NEWS_PATH} ({len(merged_live[:120])} live + {len(curated)} curated stories).")


if __name__ == "__main__":
    main()
