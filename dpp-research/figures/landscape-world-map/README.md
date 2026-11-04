# Figure 1 - global DPP evidence coverage

Publication assets derived from frozen release 0.1.0; no source release bytes are changed.

| File | Purpose |
|---|---|
| `dpp-world-map.pdf` | Vector manuscript figure, 770 x 480 PDF points; no baked-in figure number or external caption |
| `dpp-world-map.svg` | Editable, self-contained vector figure with embedded Bitstream Vera fonts |
| `dpp-world-map-300dpi.png` | 300 dpi raster derivative for preview or fallback, not the preferred manuscript input |
| `dpp-world-map-a4-proof.pdf` | A4 landscape print proof, native-size figure and shortened Figure 1 caption |
| `dpp-world-map-a4-proof.png` | 150 dpi proof rendering for visual inspection |
| `caption.md` | Full caption, interpretation and source attribution |
| `figure-1.tex` | `pdflscape` manuscript integration fragment |
| `coverage-table.md` / `.json` | Accessible geographic table, all 52 country, regional, territorial and global rows |
| `provenance.json` | Input hashes, source records, dimensions, embedded-font and vector checks |
| `build.ps1`, `generate-map.mjs`, `build_figure.py` | Reproducible build; vendored D3, ReportLab and Poppler |
| `FONT-LICENSE.txt` | Bitstream Vera redistribution and embedding terms |

The main projection is Equal Earth. Colour encodes research coverage categories, not legal readiness or country rankings. Global and European scope is shown separately. Small states and territorial scopes remain in the accessible table. All source evidence awaits qualified human review.

## Rebuild

Run `build.ps1` from PowerShell. Its defaults resolve `node`, `python` and `pdftoppm` from PATH; supply `-Node`, `-Python` and `-PdfToPpm` to use other commands or executable paths. Python needs ReportLab and pypdf. The original frozen release and the vendored D3/Natural Earth files must remain at the existing relative paths. The script does not fetch live data or write into the release.

All text in the figure is at least 9 pt at its native 770 pt width (271.64 mm). The A4 proof preserves that size. Do not reduce the image to fit a standard portrait or narrow landscape text block; re-layout the source if the journal requires a smaller area. Use the vector PDF in LaTeX and retain the complete accessible table and methodological caption as supporting material.

The public-domain map geometry does not settle rights in the research dataset. The frozen dataset's rights statement requires release licensing to be resolved before public publication. Font redistribution terms are included.
