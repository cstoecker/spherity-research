param(
    [string]$Python = 'python',
    [string]$Node = 'node',
    [string]$PdfToPpm = 'pdftoppm'
)
$ErrorActionPreference = 'Stop'
& $Node (Join-Path $PSScriptRoot 'generate-map.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Projection failed.' }
& $Python (Join-Path $PSScriptRoot 'build_figure.py')
if ($LASTEXITCODE -ne 0) { throw 'Figure creation failed.' }
& $PdfToPpm -png -r 300 -singlefile (Join-Path $PSScriptRoot 'dpp-world-map.pdf') (Join-Path $PSScriptRoot 'dpp-world-map-300dpi')
if ($LASTEXITCODE -ne 0) { throw 'Figure rendering failed.' }
& $PdfToPpm -png -r 150 -singlefile (Join-Path $PSScriptRoot 'dpp-world-map-a4-proof.pdf') (Join-Path $PSScriptRoot 'dpp-world-map-a4-proof')
if ($LASTEXITCODE -ne 0) { throw 'Proof rendering failed.' }
