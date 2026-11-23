import argparse
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen
from xml.etree import ElementTree


FEEDS = (
    "https://congbao.chinhphu.vn/cac-van-ban-moi-ban-hanh.rss",
    "https://baochinhphu.vn/home.rss",
    "https://xaydungchinhsach.chinhphu.vn/home.rss",
)
HOLIDAY_TERMS = re.compile(
    r"\b(lich nghi (?:le|tet|quoc khanh)|nghi (?:le|tet)\b|nghi (?:lam viec va huong|co huong|huong) "
    r"(?:nguyen )?luong|nghi bu|lam bu|hoan doi ngay lam viec)"
)
PUBLICATION_TERMS = re.compile(
    r"\b(thong bao|thong qua|dong y|cong bo|phe duyet|chot|chinh thuc|ban hanh|quyet dinh|quy dinh|"
    r"nghi quyet|xac lap|ghi nhan|lich nghi)\b"
)
PROPOSAL_TERMS = re.compile(r"\b(du thao|de xuat|kien nghi|lay y kien)\b")


def plain_text(text):
    return " ".join(re.sub(r"<[^>]+>", " ", html.unescape(text)).split())


def without_accents(text):
    decomposed = unicodedata.normalize("NFD", text.casefold().replace("đ", "d"))
    return "".join(character for character in decomposed if not unicodedata.combining(character))


def find_notices(xml):
    channel = ElementTree.fromstring(xml).find("channel")
    if channel is None or not channel.findall("item"):
        raise ValueError("Expected RSS items")

    for item in channel.findall("item"):
        title = plain_text(item.findtext("title", ""))
        summary = plain_text(item.findtext("description", ""))
        link = item.findtext("link", "").strip()
        url = urlsplit(link)
        hostname = url.hostname or ""
        official_host = any(hostname == site or hostname.endswith(f".{site}") for site in ("chinhphu.vn", "baochinhphu.vn"))
        if url.scheme not in {"http", "https"} or not official_host:
            continue

        normalized_title = without_accents(title)
        normalized_summary = without_accents(summary)
        if PROPOSAL_TERMS.search(normalized_title):
            continue
        if PUBLICATION_TERMS.search(normalized_title) and HOLIDAY_TERMS.search(
            f"{normalized_title} {normalized_summary}"
        ):
            yield title, url._replace(scheme="https", fragment="").geturl()


def publish_notice(title, link):
    repo = os.environ["GITHUB_REPOSITORY"]
    marker = "holidaynotice" + hashlib.sha256(link.encode()).hexdigest()[:16]
    existing = subprocess.check_output(
        ["gh", "issue", "list", "--repo", repo, "--state", "all", "--limit", "1", "--json", "number",
         "--search", f'"{marker}" in:body'],
        text=True,
    )
    if not json.loads(existing):
        body = (
            f"{link}\n\n"
            "Kiểm tra văn bản, các ngày được chốt và đối tượng áp dụng trước khi cập nhật lịch.\n\n"
            f"<!-- {marker} -->"
        )
        subprocess.run(
            ["gh", "issue", "create", "--repo", repo, "--title", f"Lịch nghỉ: {title[:180]}", "--body", body],
            check=True,
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--publish", action="store_true", help="Open GitHub issues for new notices")
    args = parser.parse_args()
    data = Path(__file__).resolve().parents[1] / "app/data"
    known_links = {
        entry["source"]
        for filename in ("public-sector-schedules.json", "public-holiday-notices.json")
        for entry in json.loads((data / filename).read_text(encoding="utf-8"))
    }
    failed = False
    for feed in FEEDS:
        try:
            with urlopen(feed, timeout=20) as response:
                notices = list(find_notices(response.read()))
        except (OSError, ValueError, ElementTree.ParseError) as error:
            print(f"Could not read {feed}: {error}", file=sys.stderr)
            failed = True
            continue
        for title, link in notices:
            if link in known_links:
                continue
            known_links.add(link)
            print(f"{title}\n{link}")
            if args.publish:
                publish_notice(title, link)
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
