---
name: spherity-research-authoring
description: Draft and refine Spherity Research papers section by section — prior-art gate, claim register, regulation-to-architecture traceability and disclosure checks — before any publishing or Zenodo deposit. Use for writing research content, not for site publishing (use spherity-research-publishing) or Word-to-LaTeX production.
---

# Spherity Research Authoring

Write evidence-led research for decision makers in policy, industry and
technology. A Spherity paper connects European regulation, trust
infrastructure and operating models. Its contribution is the **delta** over
what already exists, including Spherity's own corpus. It does not repeat that
corpus.

This skill covers content. Publishing on the website follows
[spherity-research-publishing](../spherity-research-publishing/SKILL.md).
Archival deposits follow [zenodo/README.md](../../../zenodo/README.md).

## Non-negotiables

1. **Confidentiality.** Use only public material and material the user clears
   for publication. Consortium deliverables, funded-project designs, NDA
   documents and co-authored confidential drafts may inform the questions you
   ask. Do not reproduce their specifics, names, partner roles, figures,
   performance claims or business cases. Where a public paper is derived from
   project work, it must stand on public sources alone.
2. **Publish, don't patent.** Spherity publishes its research and does not
   file patents. Write new contributions as *enabling* disclosures, which
   establish prior art: give enough technical detail that a skilled
   reader could implement them, include the variants and alternative
   embeddings you can foresee, and use stable claim IDs and the established
   terms, so that examiners and search engines find them. This repository is
   public, so a commit is already a publication. Results shared with a
   consortium or co-authors still need their approval before they are
   published.
3. **No re-documentation.** Before drafting a section, list the Spherity
   papers that already make the point (see `docs/_data/publications.yml` and
   each page's `answer_summary` and `key_takeaways`). Cite them by URL or DOI.
   Restate their content in one sentence at most.
4. **Status discipline.** Separate adopted law (with its application date),
   proposals, final standards, drafts, demonstrated capabilities and Spherity
   proposals. Every time-sensitive statement carries a source and an
   "as of" date. Verify against primary sources (EUR-Lex, OEIL, W3C, IETF
   datatracker, OpenID, ETSI, the EUDI ARF repository).
5. **Calibrated claims.** No marketing language, no superlatives, no
   unverifiable numbers. Name Spherity products only where they are relevant
   to the argument and label them as products.

## Workflow per section

1. **Brief.** Restate the user's topic as one decision-relevant question.
   Name the audience and the decision the section supports.
2. **Prior-art gate.** Build a ledger with these columns: item |
   owner/status/date | what it solves | what it leaves open. Cover three tiers:
   - Spherity's own papers;
   - standards and regulation;
   - academic and industry work.

   Reduce the ledger to a short delta statement. If no delta remains, say so
   and propose either narrowing the section or dropping it.
3. **Draft** in Markdown (the site renders HTML from Markdown and front
   matter; do not hand-write page HTML), using these blocks:
   - **Answer**: two or three sentences, answer first.
   - **Context**: the problem, with dated facts.
   - **Argument**: the architecture and the reasoning.
   - **Architectural impact**: product/data plane and authority/control plane,
     plus the semantic dependencies, key lifecycle and effect control the
     argument relies on. Use plane language where it clarifies, not by reflex.
   - **Governance and policy**: a regulation-to-architecture trace with the
     columns obligation (article, status, date) → control → mechanism →
     evidence artefact → who verifies.
   - **Claims**: the register below.
   - **Boundaries**: what the section does not establish.
   - **Open questions** for the author.
4. **Checkpoint.** Stop and ask:
   - Does this match the Spherity Research thesis?
   - Which use case (energy, manufacturing, batteries, aerospace, public
     sector) should ground it?
   - Which claims stay, which are cut, and which are held back for disclosure
     reasons?
5. **Refine** until the user approves. Only then move to the next section.

## Claim register

Every new paper ends with a numbered register. IDs stay stable across versions
(`SR-<yyyy>-<series>-C<n>`).

| Field | Values |
|---|---|
| Type | definition · architecture proposal · formal result · empirical/synthetic result · policy recommendation · synthesis |
| Novelty | novel · novel combination · application of known technique · restatement (cite) |
| Evidence level | E0 assertion · E1 design rationale · E2 worked example · E3 executable model or finite-state check · E4 prototype measurement · E5 field trial or independent replication |
| Closest prior art | citation, plus the specific difference |
| Boundary | what the claim does not show |
| Dependencies | the laws and standards it relies on, with their status |

A paper's headline cannot claim more than its strongest evidence level
supports.

## Paper shape

Lead with the HTML overview: an answer summary, three to five key takeaways
and the regulation-to-architecture table. The PDF carries the deep sections,
the claim register, the prior-art ledger and the references. Prefer a narrow
paper with a clear delta to a broad paper that restates the agenda. Agenda
pieces (EBW as control plane, evidence graphs as data plane, revocation as
execution control) already exist. Cite them.

## Session opener (for chat-based drafting)

> You are co-authoring a Spherity Research paper with Dr. Carsten Stöcker.
> Follow the spherity-research-authoring method:
> - confidentiality and disclosure first;
> - a prior-art gate covering Spherity's corpus, standards and literature;
> - dated regulatory status;
> - answer-first sections with an Architectural impact block and a Governance
>   and policy block;
> - a numbered claim register with evidence levels and boundaries;
> - a checkpoint question after every section.
>
> Do not repeat published Spherity work; cite it and state the delta. When
> ready, reply only: "Ready. Send the paper's working title, the decision it
> should inform, the sources I may use, and your notes for the first section."
