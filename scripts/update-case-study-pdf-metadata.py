"""Audit carousel Info/XMP; --write appends metadata and verifies unchanged pages."""
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parent.parent
module = importlib.util.spec_from_file_location('pdf_metadata', root / 'scripts/update-dpp-pdf-metadata.py')
updater = importlib.util.module_from_spec(module)
module.loader.exec_module(updater)
canonical = 'https://spherity.github.io/spherity-research/case-studies/verifiable-ai-lab-results.html'
spec = dict(
    relative='docs/Spherity-Verifiable-AI-Lab-Analysis-Carousel-v12.pdf',
    title='Verifiable AI Lab Analysis: Measured. Signed. Trusted?',
    authors=['Dr. Carsten Stöcker'], publisher='Spherity GmbH', language='en',
    subject='19-slide conceptual case-study carousel: calibration, materials, AI service validation, evidence graphs and Spherity products.',
    keywords=['verifiable AI lab analysis', 'AI Service Passport', 'TEVV', 'calibration', 'certified reference materials', 'evidence graph', 'business wallet', 'Spherity'],
    canonical=canonical, identifier=canonical + '#carousel-pdf', edition_date='2026-11-14',
    license='https://creativecommons.org/licenses/by/4.0/',
    rights='Copyright 2026 Dr. Carsten Stöcker, Spherity GmbH. CC BY 4.0 except logos and third-party material.',
    rights_source=canonical + '#license-and-citation',
    usage_terms='CC BY 4.0. Spherity logos and referenced third-party material retain their own terms.',
    credit='Dr. Carsten Stöcker / Spherity GmbH')
write = '--write' in sys.argv
report = updater.update_one(root, spec, datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 100, write)
if write:
    (root / 'scripts/data/case-study-pdf-metadata-provenance.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(report['status'], spec['relative'])
if not write and report['status'] != 'passed':
    raise SystemExit(1)
