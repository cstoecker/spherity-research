Complete credential examples — public verification package
Prepared 9 November 2026

WHAT IS INCLUDED
plain-vc.json is a complete W3C VCDM 2.0 credential with an actual
eddsa-rdfc-2022 DataIntegrityProof. It states that an illustrative battery has
a recycled cobalt share of 16 percentage points. The example vocabulary and
issuer use reserved example domains; no real laboratory, government, company
or qualified trust provider is impersonated.

nested.sd-jwt is the complete ASCII combined-format SD-JWT. It encloses the
same signed credential as a single selectively disclosable "credential" claim.
The outer signature is ES256, with typ dc+sd-jwt. The example application
profile requires the credential to be disclosed, the inner and outer issuers
to match the locally trusted issuer, and both signatures to verify. There is
no holder-binding JWT. This is a dual-proof example, distinct from a design
that carries unsigned JSON-LD inside an envelope and verifies only that envelope.

HOW TO REPEAT THE PUBLIC-KEY CHECKS
Use Node.js 24 (tested with 24.21.0). From this folder run:

  npm ci --ignore-scripts --no-audit --no-fund
  node verify.mjs
  node audit-spec.mjs

The installation downloads the pinned dependencies. Verification itself is
offline: a fixed document loader accepts only the supplied context, key and
controller documents. No private signing key is required or supplied. Fixture
generation used fresh dedicated demonstration keys held only in memory.

verify.mjs uses maintained Digital Bazaar credential/Data Integrity libraries
and jose. Its report records 4 expected accepts and 13 expected rejects.
The additional audit independently calls Node/OpenSSL for Ed25519 and ES256
signature verification over reconstructed inputs. It uses shared JSON-LD/RDF
canonicalization dependencies, so this is not an independent implementation
of every normalization algorithm. Read both reports for exact test scope.

READING THE FILES
- plain-vc.json / plain-vc.compact.json: same complete credential, respectively
  pretty-printed and compact. The compact serialization is 797 UTF-8 bytes.
- controller.json: full public Multikey embedded in assertionMethod, and the
  issuer/controller identifier. verification-method.json is the same method
  available under its fragment URL to the pinned document loader.
- outer-public-jwk.json and issuer-metadata.json: the outer ES256 public key
  and locally pinned issuer-to-key metadata. No live discovery is claimed.
- outer-protected-header.json / outer-signed-payload.json: decoded issuer JWT.
- issuer.jwt: exact issuer-signed compact JWT, 416 ASCII bytes.
- disclosure.txt: exact base64url disclosure, 1116 ASCII bytes. SHA-256 hashes
  these encoded ASCII bytes, not a re-serialized decoded JSON array.
- disclosure-decoded.json: readable [salt, "credential", signedCredential].
- nested.sd-jwt: issuer.jwt + "~" + disclosure.txt + "~", 1534 ASCII bytes.
  The file has no line terminator. Do not add PDF display wraps to this input.
- reconstructed-outer-claims.json: claims after verifying and applying the
  disclosure; its embedded credential is identical to plain-vc.json as JSON.
- canonical-document.nq / canonical-proof-configuration.nq: canonical RDF
  inputs. The unsigned credential has 7 quads. signing-input.hex is the
  concatenation SHA-256(proof configuration) || SHA-256(document).
- negative-fixtures/: deliberately invalid fixtures. One has a valid outer
  signature but an invalid inner proof; another commits to a colliding claim.
- fixtures-manifest.json: exact fixture byte sizes and SHA-256 hashes.
- profile.json: the explicit local acceptance policy and fixed test time.
- verification-results.json / audit-spec-results.json: executed results.

INTERPRETATION
The plain path checks one Ed25519 signature and canonicalizes/hashes the
document and proof configuration. This nested example adds one ES256 signature,
one disclosure digest check, and outer decoding/reconstruction; it still needs
the inner Data Integrity checks. These are algorithmic counts for this fixture,
not timing measurements or a claim that all nesting has identical costs.

The whole signed credential is disclosed. Its inner eddsa-rdfc-2022 proof does
not enable selective disclosure of individual attributes. Withholding the
whole credential leaves the outer signature cryptographically valid but fails
this application profile. Passing the outer signature alone is insufficient:
the saved outer-valid/inner-invalid fixture demonstrates that distinction.

Verification time is fixed at 2026-11-09T12:00:00Z. The credential validFrom,
proof creation time and issuer JWT iat are 2026-11-09T00:00:00Z. No expiry,
credentialStatus, holder binding, live issuer discovery or QTSP trust-list
lookup is included. The examples demonstrate cryptographic verification, not
QEAA eligibility, factual correctness, a production conformance certification
or reproduction of the paper's performance benchmark. No private keys occur
in this public package.

CONTEXTS AND LICENCES
The official W3C VCDM v2 context was downloaded from its normative URL and
compared with the copy in @digitalbazaar/credentials-context 3.2.0: exact JSON
content match. The Multikey context was downloaded through w3id.org, resolving
to the W3C-hosted 2025 context. Security v1/v2 contexts come from the pinned
Digital Bazaar security-context package. contexts/manifest.json records URLs,
provenance and file hashes. See THIRD-PARTY-NOTICES.txt and licenses/.

The paper's CC BY 4.0 notice does not relicense software dependencies or these
third-party contexts. Retain their supplied notices. The paper licence is not
automatically applied as a software licence to the verification scripts.
