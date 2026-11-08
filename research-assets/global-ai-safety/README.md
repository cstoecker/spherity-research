# Global AI Safety figure sources

The five figures are faithful vector reconstructions of the approved edition 2.6
raster artwork. They preserve labels, counts, legends, activity badges, captions'
meaning and diagram paths. The Atlas uses the repository's Natural Earth geometry
with a Robinson projection; coastline projection and font metrics can differ
slightly from the original raster. The Spherity Atlas row has a subtle highlight
without a dark stripe.

Figure 3 citation labels are derived from the source keys in `body.tex`, mapped
through the **bibliography order** in `references.tex`, and checked against page 8
of the published PDF. Source keys are not printed citation numbers.

`reference/` archives the three LaTeX files and original raster figures without
modification. The unchanged 24-page publication is
`../../docs/top-10-global-ai-safety-companies-2026.pdf`; its SHA-256 is recorded in
`provenance.json`. SVGs have outlined lettering, PDFs retain embedded fonts and
selectable text, and PNGs correspond to these vector exports.

## Requirements and audit

Use Python 3.11 or newer with `reportlab`, `Pillow` and `PyMuPDF` installed:

```sh
python -m pip install reportlab Pillow PyMuPDF
python -B research-assets/global-ai-safety/validate_figures.py
```

The audit uses archived sources and the published PDF by default, writes
`qa-report.json`, and does not change artwork. To compare a separately supplied
publication package byte for byte, add `--source-dir /path/to/verified-package`.
`AI_SAFETY_SOURCE_DIR` provides the same override.

## Regeneration

```sh
python -B research-assets/global-ai-safety/build_figures.py \
  --font-regular /path/to/segoeui.ttf \
  --font-bold /path/to/segoeuib.ttf
```

The default fonts on Windows are Segoe UI and Segoe UI Bold. Elsewhere pass font
paths or set `AI_SAFETY_FONT_REGULAR` and `AI_SAFETY_FONT_BOLD`. Use appropriately
licensed fonts; substitutes can change line metrics and require visual review.
No fonts are redistributed in this source folder. For the original source package,
add `--source-dir /path/to/verified-package`; archived references suffice otherwise.

Regeneration overwrites the figure exports, cover and manifests in
`docs/assets/global-ai-safety/`. Run the audit and visually inspect every export
against `reference/` before publication. Final raster dimensions are measured from
the exported files, not inferred from scale factors. The publication itself is
copied byte for byte and never modified.
