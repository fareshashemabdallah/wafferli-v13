#!/usr/bin/env python3
"""Fetch PUBLIC category-level Google News RSS headlines for Dabberna's static site.

No family names, ages, dates, spending or device data are sent. Headlines represent
recent published reading, NOT proof that an item is a popular trend or available in Jordan.
Google News RSS is an unofficial interface; if it fails, we publish an empty, transparent feed.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
import json
import re
import xml.etree.ElementTree as ET

TOPICS = {
    "kids-birthday": "2026 children's birthday gifts creative play experience ideas when:90d",
    "adult-birthday": "2026 thoughtful birthday gift ideas adult experience gifts when:90d",
    "anniversary": "2026 wedding anniversary gifts romantic experiences ideas when:90d",
    "family-occasion": "2026 family activity experiences Jordan Amman children openings when:90d",
}
OUT = Path(__file__).resolve().parent.parent / "public" / "occasion-trends.json"


def fetch_one(key, query):
    url = "https://news.google.com/rss/search?" + urlencode(
        {"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}
    )
    response = urlopen(Request(url, headers={
        "User-Agent": "DabbernaOccasionInspiration/1.0 (public RSS reading)",
        "Accept": "application/rss+xml, application/xml, text/xml",
    }), timeout=9)
    with response:
        if int(response.headers.get("Content-Length", "0") or 0) > 1_500_000:
            raise ValueError("Feed exceeds size limit")
        raw = response.read(1_500_001)
    if len(raw) > 1_500_000:
        raise ValueError("Feed exceeds size limit")
    root = ET.fromstring(raw)
    recent = datetime.now(timezone.utc) - timedelta(days=100)
    out, seen = [], set()
    for item in root.findall("./channel/item"):
        title = re.sub(r"\s+", " ", item.findtext("title", "")).strip()
        link = item.findtext("link", "").strip()
        published = item.findtext("pubDate", "").strip()
        if not (15 <= len(title) <= 220 and len(link) <= 900 and published):
            continue
        host = urlparse(link)
        if host.scheme != "https" or host.hostname != "news.google.com":
            continue
        try:
            dt = parsedate_to_datetime(published).astimezone(timezone.utc)
        except (ValueError, TypeError, OverflowError):
            continue
        if dt < recent or dt > datetime.now(timezone.utc) + timedelta(days=1):
            continue
        if title.lower() in seen:
            continue
        seen.add(title.lower())
        source = item.find("source")
        out.append({
            "title": title, "url": link,
            "publisher": source.text.strip()[:100] if source is not None and source.text else "Google News",
            "published": dt.date().isoformat(),
        })
        if len(out) >= 4:
            break
    return key, out


def main():
    topics = {key: [] for key in TOPICS}
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_map = {executor.submit(fetch_one, key, q): key for key, q in TOPICS.items()}
        for future in as_completed(future_map):
            key = future_map[future]
            try:
                _, articles = future.result()
                topics[key] = articles
                print(f"{key}: {len(articles)} public headlines")
            except Exception as exc:
                print(f"{key}: temporarily unavailable ({type(exc).__name__})")
    data = {
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "note": "Public Google News RSS headlines, not independently verified trends, offers, availability or endorsements.",
        "topics": topics,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
