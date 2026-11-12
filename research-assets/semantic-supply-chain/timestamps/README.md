# Independent timestamps: semantic supply chain harness

| Release | Commit | Manifest SHA-256 | RFC 3161 time stamp (FreeTSA) | Files |
|---|---|---|---|---|
| v0.2.0 | `359c9df8574a87cccd653357cabac8339dfba19e` | `dfe350db19b2e8a5483512cefa308f863187694f2009ec6ea042144fbc59d7f5` | **12 Nov 2026, 12:03:59 GMT** | `SHA256SUMS.tsq`, `SHA256SUMS.tsr` |
| v0.3.0 (adds WE-3) | `257d1c79114532e454736255d127f53e5161f639` | `4758835ad30c86f8823a867758a6d1e7fc59e2f3e9ff6b1e3e95b9963c766f6e` | **12 Nov 2026, 12:12:09 GMT** | `harness-v0.3-SHA256SUMS.tsq`, `harness-v0.3-SHA256SUMS.tsr` |

Each `SHA256SUMS` lists the SHA-256 digest of every file in its release folder. The TSA certificates are `freetsa-cacert.pem` and `freetsa-tsa.crt`.

## v0.2.0 details

| Item | Value |
|---|---|
| Manifest SHA-256 | `dfe350db19b2e8a5483512cefa308f863187694f2009ec6ea042144fbc59d7f5` |
| RFC 3161 time-stamp authority | FreeTSA (freetsa.org) |
| Time stamp | **12 November 2026, 12:03:59 GMT** |
| Files | `SHA256SUMS.tsq` (request), `SHA256SUMS.tsr` (signed response), `freetsa-cacert.pem`, `freetsa-tsa.crt` |

Verify v0.2.0 (OpenSSL):

```bash
openssl ts -verify -in SHA256SUMS.tsr -data ../harness-v0.2/SHA256SUMS -CAfile freetsa-cacert.pem -untrusted freetsa-tsa.crt
```

Then check every file against the manifest:

```bash
cd ../harness-v0.2 && sha256sum -c SHA256SUMS
```

Only the manifest's hash was sent to the time-stamp authority, never the content. The Zenodo record for this release, when deposited, provides a second, archival timestamp and a DOI.

## v0.3.0

| Item | Value |
|---|---|
| GitHub release | [ssc-harness-v0.3.0](https://github.com/cstoecker/spherity-research/releases/tag/ssc-harness-v0.3.0), published **12 November 2026, 14:45:14 UTC** |
| Tag | `ssc-harness-v0.3.0` → `ddf09f17693fcb1db81c33e290a28b88622d75d5` (adds this timestamp evidence to 257d1c7; the harness files are byte-identical) |
| Release asset | `ssc-harness-v0.3.0.zip`, SHA-256 `ca79751494f80dfada60e1a8ab9e3892efef595a8312e3a36550b3efa6f3ee76` (content identical to `research-assets/semantic-supply-chain/harness-v0.3/` at 257d1c7) |
| Web archive | pending |

The timestamp (12:12:09 GMT) predates the release (14:45:14 UTC). It proves that the manifest, and so every file it lists, existed by that time.

```bash
openssl ts -verify -in harness-v0.3-SHA256SUMS.tsr -data ../harness-v0.3/SHA256SUMS -CAfile freetsa-cacert.pem -untrusted freetsa-tsa.crt
cd ../harness-v0.3 && sha256sum -c SHA256SUMS
```
