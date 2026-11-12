# Independent timestamps: semantic supply chain harness v0.2.0

`../harness-v0.2/SHA256SUMS` lists the SHA-256 digest of every file in the release (published in commit `359c9df8574a87cccd653357cabac8339dfba19e`).

| Item | Value |
|---|---|
| Manifest SHA-256 | `dfe350db19b2e8a5483512cefa308f863187694f2009ec6ea042144fbc59d7f5` |
| RFC 3161 time-stamp authority | FreeTSA (freetsa.org) |
| Time stamp | **12 November 2026, 12:03:59 GMT** |
| Files | `SHA256SUMS.tsq` (request), `SHA256SUMS.tsr` (signed response), `freetsa-cacert.pem`, `freetsa-tsa.crt` |

Verify (OpenSSL):

```bash
openssl ts -verify -in SHA256SUMS.tsr -data ../harness-v0.2/SHA256SUMS -CAfile freetsa-cacert.pem -untrusted freetsa-tsa.crt
```

Then check every file against the manifest:

```bash
cd ../harness-v0.2 && sha256sum -c SHA256SUMS
```

Only the manifest's hash was sent to the time-stamp authority, never the content. The Zenodo record for this release, when deposited, provides a second, archival timestamp and a DOI.
