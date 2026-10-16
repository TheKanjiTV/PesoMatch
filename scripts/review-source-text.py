"""Print public catalogue facts for review. No authenticated requests or imports."""
import html
import re
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

folder = Path(__file__).resolve().parent.parent / ".local/source-review"
def clean(value):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())

for path in sorted(folder.glob("*.html")):
    print("SOURCE:", path.name)
    source = path.read_text(encoding="utf-8")
    if path.name.startswith("tesda"):
        for url, title in re.findall(r'<a[^>]*href="([^"]*course/view[^"]*)"[^>]*>(.*?)</a>', source, re.S):
            print(url, "|", clean(title))
    elif path.name.startswith("job-14882"):
        source = re.sub(r"<(script|style)\b.*?</\1>", "", source, flags=re.S)
        text = clean(source)
        start = text.find("Job Description")
        print(text[max(0, start - 500):start + 1600])
