"""Add Info/XMP metadata without changing paper or figure content.

Run with --write to append metadata; default mode audits only. Requires PyMuPDF
and PyYAML. All 76 pages are rendered before/after at 150 dpi on an update.
"""
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
import yaml

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parent.parent
module = importlib.util.spec_from_file_location('pdf_metadata', root / 'scripts/update-dpp-pdf-metadata.py')
updater = importlib.util.module_from_spec(module)
module.loader.exec_module(updater)
page = yaml.safe_load((root / 'docs/europes-answer-to-palantir.md').read_text(encoding='utf-8').split('---', 2)[1])
common = dict(publisher=page['affiliation'], language=page['lang'], edition_date='2026-11-01',
              license=page['license'], rights='Copyright 2026 Dr. Carsten Stöcker, Spherity GmbH. CC BY 4.0 except where otherwise noted.',
              rights_source=page['canonical_url']+'#license-and-citation',
              usage_terms='CC BY 4.0. Referenced third-party material retains its own terms.',
              credit='Dr. Carsten Stöcker / Spherity GmbH')
specs = []
for work in page['research_works']:
    specs.append(dict(common, relative='docs'+work['pdf_url'], title=work['title'],
                      authors=page['authors'], subject=work['subtitle']+' (Version 1.0)',
                      xmp_description=work['description'].replace('\r', ''), keywords=page['keywords'],
                      canonical=work['url'], identifier=work['id']))
for figure in page['figure_objects']:
    specs.append(dict(common, relative='docs'+figure['downloads'][0]['url'], title=figure['name'],
                      authors=[figure['creator_name']], subject=figure['description'],
                      xmp_description=figure['caption'], keywords=figure['keywords'],
                      canonical=page['canonical_url'], identifier=page['canonical_url']+'#'+figure['id']+'-figure'))
manifest = {f['path']: f for f in json.loads((root/'scripts/data/palantir-release-integrity.json').read_text())}
write = '--write' in sys.argv
stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
results = []
for spec in specs:
    source = manifest[spec['relative'][4:]]
    original = (root/'research-assets/palantir/v1.0'/spec['relative'][5:]).read_bytes()
    if updater.digest(original) != source['sha256']:
        raise ValueError('Original archive changed')
    if not (root/spec['relative']).read_bytes().startswith(original):
        raise ValueError('PDF original prefix changed')
    report = updater.update_one(root, spec, stamp, 150, write)
    if write:
        with updater.fitz.open(stream=original, filetype='pdf') as original_doc, updater.fitz.open(root/spec['relative']) as published_doc:
            if updater.snapshot(original_doc, 150) != updater.snapshot(published_doc, 150):
                raise ValueError('Published PDF differs from original release content')
    report.update(source_bytes=source['bytes'], source_sha256=source['sha256'])
    results.append(report)
    print(report['status']+': '+spec['relative'], flush=True)
if write:
    (root/'scripts/data/palantir-pdf-metadata-provenance.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
elif any(r['status'] != 'passed' for r in results):
    raise SystemExit(1)
