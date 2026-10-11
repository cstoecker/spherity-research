# Spherity Research contributor guidance

For adding, revising or reviewing research publication pages, series, homepage
cards, figures, metadata or PDF sharing, read and use
[Spherity Research Publishing](.agents/skills/spherity-research-publishing/SKILL.md).
It routes to the existing template, editorial guidance and validation tools;
do not duplicate those implementations.

Keep manuscript production and Word-to-LaTeX conversion separate from website
publishing. Preserve the user's requested scope and approved content. Publishing
preparation alone does not authorize a push, merge or deployment.

The website source is `docs/`; `_site/` is generated. Read `README.md` and
`package.json` for the applicable build/check commands. A passing Node preview
is not proof of a passing production Jekyll build. Match validation to the change
and report anything that could not be verified.
