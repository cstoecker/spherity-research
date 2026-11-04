"""Correct EBW PDF metadata using the existing lossless incremental updater.

Run from the repository root with Python, PyMuPDF and PyYAML installed.
The original supplied PDF remains the exact byte prefix; every page is rendered
before and after the metadata update and must be pixel-identical.
"""
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
import yaml

root = Path(__file__).resolve().parent.parent
module_spec = importlib.util.spec_from_file_location("pdf_metadata", root / "scripts/update-dpp-pdf-metadata.py")
updater = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(updater)
page = yaml.safe_load((root / "docs/ebw-roadmap.md").read_text(encoding="utf-8").split("---", 2)[1])
relative = "docs" + page["pdf_url"]
source_bytes = 163923
source_sha256 = "d4c3304853555dba15ebdedcac366752d4d01749c0bb17b6dd5ab35340d96b6e"
if updater.digest((root / relative).read_bytes()[:source_bytes]) != source_sha256:
    raise ValueError("Supplied EBW manuscript prefix does not match its recorded SHA-256")
spec = {
    "relative": relative, "title": page["citation_title"], "authors": page["authors"],
    "subject": "European Business Wallets: conditional legal clocks, transaction readiness, cyber-resilience and accountable automation",
    "keywords": ["European Business Wallet", "EBW", "eIDAS", "Single Market", "transaction readiness", "cyber-resilience", "post-quantum cryptography", "AI-agent governance", "business interoperability", "implementation guidance"],
    "publisher": page["affiliation"], "language": page["lang"], "edition_date": page["citation_publication_date"],
    "canonical": page["canonical_url"], "identifier": page["canonical_url"], "license": page["license"],
    "rights": "Copyright 2026 Dr. Carsten Stöcker, Spherity GmbH. Except where otherwise noted, this work is licensed under CC BY 4.0.",
    "rights_source": page["canonical_url"] + "#license-and-citation",
    "usage_terms": "CC BY 4.0. Third-party sources, logos and trademarks retain their own rights.",
    "credit": "Dr. Carsten Stöcker / Spherity GmbH"
}
stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
report = updater.update_one(root, spec, stamp, 150, True)
report.update({"source_bytes": source_bytes, "source_sha256": source_sha256})
proof = root / "scripts/data/ebw-pdf-metadata-provenance.json"
if report["status"] == "updated" or not proof.exists():
    proof.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: report[key] for key in ["status", "page_count", "all_page_pixels_identical", "source_prefix_preserved", "published_sha256"]}))
