#!/usr/bin/env python3
"""
Fetches fresh HK (RTHK), Vancouver/BC (CBC), and World/Health RSS headlines
to prepend interactive 'Read & Recall' quiz cards into data/daily-news.json,
keeping our curated bilingual HK × Vancouver stories as reliable evergreen companions.
"""
import datetime
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
    r"(murder|killed|shooting|fatal|homicide|suicide|assault|死亡|謀殺|墮樓|命案|斬傷)",
    re.IGNORECASE,
)


def strip_html(raw: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", raw or "")
    cleaned = html.unescape(cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def fetch_rss_items(url: str, max_items: int = 3):
    req = urllib.request.Request(url, headers={"User-Agent": "DailyMindSumBot/1.0"})
    cafile = "/etc/ssl/cert.pem" if pathlib.Path("/etc/ssl/cert.pem").exists() else None
    ctx = ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
        xml_bytes = resp.read()
    root = ET.fromstring(xml_bytes)
    items = []
    for item in root.findall(".//item"):
        title = strip_html(item.findtext("title") or "")
        desc = strip_html(item.findtext("description") or "")
        if not title or len(desc) < 25:
            continue
        if SKIP_WORDS.search(title) or SKIP_WORDS.search(desc):
            continue
        items.append((title, desc[:220]))
        if len(items) >= max_items:
            break
    return items


def build_live_cards():
    cards = []
    distractors_zh = [
        "南極企鵝保育中心宣佈免費派發雪糕",
        "火星探測器喺月球開設第一間港式茶餐廳",
    ]
    distractors_en = [
        "Antarctic penguin sanctuary opens a free ice-cream tram",
        "Mars rover opens the first dim sum tea house on the Moon",
    ]

    for idx, feed in enumerate(FEEDS):
        try:
            fetched = fetch_rss_items(feed["url"], max_items=1)
        except Exception as exc:
            print(f"[warn] Could not fetch {feed['url']}: {exc}")
            continue

        for j, (title, desc) in enumerate(fetched):
            if feed["lang"] == "zh":
                cards.append(
                    {
                        "id": f"live-{feed['region']}-{idx}-{j}",
                        "region": feed["region"],
                        "tag": feed["tag"],
                        "headline": {"zh": title, "en": f"[HK News] {title}"},
                        "summary": {"zh": desc, "en": desc},
                        "question": {
                            "zh": "根據剛才讀到嘅香港新聞重點，以下邊一項係報道提及嘅主題？",
                            "en": "Which topic was featured in the Hong Kong news brief you just read?",
                        },
                        "choices": [
                            {"zh": title[:38], "en": title[:60]},
                            {"zh": distractors_zh[0], "en": distractors_en[0]},
                            {"zh": distractors_zh[1], "en": distractors_en[1]},
                        ],
                        "answerIndex": 0,
                    }
                )
            else:
                cards.append(
                    {
                        "id": f"live-{feed['region']}-{idx}-{j}",
                        "region": feed["region"],
                        "tag": feed["tag"],
                        "headline": {"zh": f"【溫哥華快訊】{title}", "en": title},
                        "summary": {"zh": desc, "en": desc},
                        "question": {
                            "zh": "根據剛才嘅大溫哥華新聞快訊，報道標題提到邊一件事？",
                            "en": "Which headline did you just read in the Vancouver & BC news brief?",
                        },
                        "choices": [
                            {"zh": title[:60], "en": title[:65]},
                            {"zh": distractors_en[0], "en": distractors_en[0]},
                            {"zh": distractors_en[1], "en": distractors_en[1]},
                        ],
                        "answerIndex": 0,
                    }
                )
    return cards


def main():
    existing = json.loads(NEWS_PATH.read_text(encoding="utf-8"))
    curated = [
        s for s in existing.get("stories", []) if not str(s.get("id", "")).startswith("live-")
    ]
    live_cards = build_live_cards()
    today_str = datetime.date.today().isoformat()

    merged = {
        "updatedAt": today_str,
        "stories": live_cards + curated,
    }
    NEWS_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {NEWS_PATH} ({len(live_cards)} live + {len(curated)} curated stories).")


if __name__ == "__main__":
    main()
