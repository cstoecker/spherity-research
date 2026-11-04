#!/usr/bin/env python3
"""Complete published DPP PDF metadata with incremental, verified updates.

Requires PyMuPDF and PyYAML (offline publishing tools, not website dependencies).
From the repository root:
  python scripts/update-dpp-pdf-metadata.py --report ../tmp/pdf-metadata-audit.json --write

Without --write, validate the current Info/XMP fields without changing PDFs.
The supplied manuscript and frozen archive are not input/output targets. Each
update preserves the entire previous PDF as its byte prefix; pages, content
streams, geometry, links and bookmarks must also compare unchanged.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import pymupdf as fitz
import yaml

NS = {
    "x": "adobe:ns:meta/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "dc": "http://purl.org/dc/elements/1.1/",
    "pdf": "http://ns.adobe.com/pdf/1.3/",
    "xmp": "http://ns.adobe.com/xap/1.0/",
    "xmpRights": "http://ns.adobe.com/xap/1.0/rights/",
    "photoshop": "http://ns.adobe.com/photoshop/1.0/",
    "cc": "http://creativecommons.org/ns#",
}
INFO_KEYS = {"title", "author", "subject", "keywords", "creator", "producer",
             "creationDate", "modDate", "trapped"}


def q(name):
    prefix, local = name.split(":", 1)
    return f"{{{NS[prefix]}}}{local}"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def serial(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, default=str)


def source_specs(root):
    source = root / "docs/global-digital-product-passport-regulation.md"
    content = source.read_text(encoding="utf-8")
    page = yaml.safe_load(content.split("---", 2)[1])
    authors = [str(item) for item in page["authors"]]
    edition_date = str(page["date"])
    common = {
        "publisher": page["affiliation"], "language": page["lang"],
        "edition_date": edition_date, "canonical": page["canonical_url"],
        "usage_terms": page["license_scope"] + ". " + page["license_exclusions"],
    }
    # Retain the supplied manuscript's already-correct descriptive metadata.
    # Its web landing-page description serves a different purpose. Reading the
    # recorded original prefix keeps subsequent runs independent of our updates.
    main_relative = "docs" + page["pdf_url"]
    main_bytes = (root / main_relative).read_bytes()
    proof_path = root / "scripts/data/dpp-pdf-metadata-provenance.json"
    if proof_path.exists():
        proof = json.loads(proof_path.read_text(encoding="utf-8"))
        original = next(item for item in proof["files"] if item["file"] == main_relative)
        main_bytes = main_bytes[:original["source_bytes"]]
        if digest(main_bytes) != original["source_sha256"]:
            raise ValueError("Manuscript source prefix differs from provenance")
    with fitz.open(stream=main_bytes, filetype="pdf") as supplied:
        supplied_info = dict(supplied.metadata)
        _, supplied_xmp = parse_xmp(supplied.get_xml_metadata())
        supplied_keywords = property_values(supplied_xmp, "pdf:Keywords", None)
        supplied_subjects = property_values(supplied_xmp, "dc:subject", "Bag")
        supplied_description = property_values(supplied_xmp, "dc:description", "Alt")
    main = {
        **common, "relative": main_relative,
        "title": supplied_info.get("title") or page["title"], "authors": authors,
        "subject": supplied_info.get("subject") or page["subtitle"],
        "xmp_description": supplied_description[0] if supplied_description else page["subtitle"],
        "keywords": [supplied_keywords] if supplied_keywords else page["keywords"],
        "xmp_subjects": supplied_subjects or page["keywords"], "license": page["license"],
        "rights": f"Copyright {edition_date[:4]} {', '.join(authors)}, {page['affiliation']}. Except where otherwise noted, this work is licensed under CC BY 4.0.",
        "rights_source": page["canonical_url"] + "#license-and-citation",
        "identifier": page["canonical_url"],
        "credit": f"{', '.join(authors)} / {page['affiliation']}",
    }
    specs = [main]
    for figure in page["figure_objects"]:
        download = next(row for row in figure["downloads"] if row["name"] == "Original vector PDF")
        if not download["url"].startswith("/assets/dpp-global/whitepaper-v1/fig"):
            raise ValueError("Figure metadata target escapes the supplied figure edition")
        specs.append({
            **common, "relative": "docs" + download["url"],
            "title": figure["name"], "authors": [figure["creator_name"]],
            "subject": figure["description"], "keywords": figure["keywords"],
            "license": figure["license"], "rights": figure["copyright_notice"],
            "rights_source": figure["acquire_license_page"],
            "identifier": page["canonical_url"] + "#" + figure["id"],
            "credit": figure["credit_text"],
        })
    if len(specs) != 8 or len({item["relative"] for item in specs}) != 8:
        raise ValueError("Expected one manuscript and seven distinct figure PDFs")
    for spec in specs:
        target = (root / spec["relative"]).resolve()
        target.relative_to(root)
        if target.is_symlink() or not target.is_file():
            raise ValueError(f"Invalid PDF target: {target}")
    return specs


def parse_xmp(xml):
    if xml:
        for _, item in ET.iterparse(io.StringIO(xml), events=("start-ns",)):
            prefix, uri = item
            if prefix and not prefix.startswith("ns"):
                ET.register_namespace(prefix, uri)
        tree = ET.fromstring(xml)
        desc = tree.find("./rdf:RDF/rdf:Description", NS)
        if desc is None:
            raise ValueError("Existing XMP has no RDF description; refusing replacement")
    else:
        tree = ET.Element(q("x:xmpmeta"))
        rdf = ET.SubElement(tree, q("rdf:RDF"))
        desc = ET.SubElement(rdf, q("rdf:Description"), {q("rdf:about"): ""})
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)
    return tree, desc


def set_property(desc, name, values, kind=None):
    # Only owned properties are replaced. Extension schemas and unrelated XMP
    # properties remain in the original tree.
    tag = q(name)
    desc.attrib.pop(tag, None)
    for old in list(desc):
        if old.tag == tag:
            desc.remove(old)
    node = ET.SubElement(desc, tag)
    if kind:
        container = ET.SubElement(node, q("rdf:" + kind))
        for value in values:
            attrs = {"{http://www.w3.org/XML/1998/namespace}lang": "x-default"} if kind == "Alt" else {}
            ET.SubElement(container, q("rdf:li"), attrs).text = str(value)
    else:
        node.text = str(values)


def metadata_fields(spec):
    return {"title": spec["title"], "author": "; ".join(spec["authors"]),
            "subject": spec["subject"], "keywords": "; ".join(spec["keywords"])}


def custom_info(spec):
    return {"Copyright": spec["rights"], "License": spec["license"],
            "RightsSource": spec["rights_source"], "EditionDate": spec["edition_date"]}


def xmp_fields(spec):
    return {
        "dc:title": (spec["title"], "Alt"),
        "dc:description": (spec.get("xmp_description", spec["subject"]), "Alt"),
        "dc:creator": (spec["authors"], "Seq"),
        "dc:subject": (spec.get("xmp_subjects", spec["keywords"]), "Bag"),
        "dc:rights": (spec["rights"], "Alt"),
        "dc:publisher": ([spec["publisher"]], "Bag"),
        "dc:language": ([spec["language"]], "Bag"),
        "dc:identifier": (spec["identifier"], None),
        "dc:relation": ([spec["canonical"]], "Bag"),
        "dc:format": ("application/pdf", None),
        "pdf:Keywords": ("; ".join(spec["keywords"]), None),
        "xmpRights:Marked": ("True", None),
        "xmpRights:WebStatement": (spec["license"], None),
        "xmpRights:UsageTerms": (spec["usage_terms"], "Alt"),
        "photoshop:Credit": (spec["credit"], None),
        "cc:attributionURL": (spec["canonical"], None),
        "cc:license": (spec["license"], None),
    }


def property_values(desc, name, kind):
    node = desc.find(q(name))
    if node is None:
        return None
    if kind:
        return [item.text or "" for item in node.findall(f"./rdf:{kind}/rdf:li", NS)]
    return node.text or ""


def validation_errors(doc, spec):
    errors = []
    for key, value in metadata_fields(spec).items():
        if doc.metadata.get(key) != value:
            errors.append("Info:" + key)
    info_ref = doc.xref_get_key(-1, "Info")
    info_xref = int(info_ref[1].split()[0]) if info_ref[0] == "xref" else None
    for key, value in custom_info(spec).items():
        if info_xref is None or doc.xref_get_key(info_xref, key)[1] != value:
            errors.append("Info:" + key)
    xml = doc.get_xml_metadata()
    if not xml:
        return errors + ["XMP:absent"]
    _, desc = parse_xmp(xml)
    for name, (value, kind) in xmp_fields(spec).items():
        expected = value if isinstance(value, list) or not kind else [value]
        if property_values(desc, name, kind) != expected:
            errors.append("XMP:" + name)
    if not property_values(desc, "xmp:MetadataDate", None):
        errors.append("XMP:MetadataDate")
    if doc.metadata.get("creationDate", "").startswith("D:20000101000000"):
        errors.append("Info:placeholder-creation-date")
    return errors


def snapshot(doc, dpi):
    pages = []
    for page in doc:
        pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csRGB, alpha=False)
        pages.append({
            "number": page.number + 1, "pixel_size": [pix.width, pix.height],
            "pixel_sha256": digest(pix.samples),
            "geometry": {"media": list(page.mediabox), "crop": list(page.cropbox),
                         "rotation": page.rotation, "rect": list(page.rect)},
            "contents": [digest(doc.xref_stream(xref)) for xref in page.get_contents()],
            "text_sha256": digest(page.get_text().encode()),
            "links": serial(page.get_links()),
            "annotations": [doc.xref_object(annot.xref) for annot in (page.annots() or [])],
        })
    return {"pages": pages, "bookmarks": serial(doc.get_toc(simple=False)),
            "bookmark_count": len(doc.get_toc()), "page_count": doc.page_count,
            "named_destinations": serial(doc.resolve_names())}


def update_one(root, spec, stamp, dpi, write):
    target = root / spec["relative"]
    original = target.read_bytes()
    with fitz.open(target) as doc:
        before_info = dict(doc.metadata)
        errors = validation_errors(doc, spec)
        result = {"file": spec["relative"], "original_bytes": len(original),
                  "original_sha256": digest(original), "before_info": before_info,
                  "required_updates": errors}
        if not write:
            result["status"] = "passed" if not errors else "needs_update"
            return result
        if not doc.can_save_incrementally() or doc.is_encrypted:
            raise ValueError(f"Incremental update unavailable: {target}")
        before = snapshot(doc, dpi)
        old_xml = doc.get_xml_metadata()
        if errors:
            tree, desc = parse_xmp(old_xml)
            managed_tags = {q(name) for name in xmp_fields(spec)}
            managed_tags.update({q("xmp:ModifyDate"), q("xmp:MetadataDate")})
            # Preserve all pre-existing rich XMP outside the explicitly managed
            # fields, including PDF extension schemas, IDs and creation history.
            untouched = [(child.tag, ET.tostring(child)) for child in desc
                         if child.tag not in managed_tags]
            for name, (value, kind) in xmp_fields(spec).items():
                set_property(desc, name, value if isinstance(value, list) or not kind else [value], kind)
            set_property(desc, "xmp:ModifyDate", stamp)
            set_property(desc, "xmp:MetadataDate", stamp)
            if desc.find(q("dc:date")) is None:
                set_property(desc, "dc:date", [spec["edition_date"]], "Seq")
            if desc.find(q("xmp:CreatorTool")) is None and before_info.get("creator") not in ("", "anonymous"):
                set_property(desc, "xmp:CreatorTool", before_info["creator"])
            if desc.find(q("pdf:Producer")) is None and before_info.get("producer"):
                set_property(desc, "pdf:Producer", before_info["producer"])
            for tag, value in untouched:
                if ET.tostring(desc.find(tag)) != value:
                    raise ValueError(f"Unrelated XMP property changed: {tag}")
            xml = '<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>\n'
            xml += ET.tostring(tree, encoding="unicode") + '\n<?xpacket end="w"?>'
            info = {key: value for key, value in doc.metadata.items() if key in INFO_KEYS}
            info.update(metadata_fields(spec))
            info["modDate"] = "D:" + stamp.replace("-", "").replace(":", "").replace("T", "").replace("Z", "+00'00'")
            if info.get("creationDate", "").startswith("D:20000101000000"):
                # ReportLab's invariant timestamp is not a sourced creation date.
                # Leave creation unknown; EditionDate/DC date identify the verified
                # manuscript edition, while ModDate records this metadata change.
                info["creationDate"] = ""
            doc.set_metadata(info)
            info_xref = int(doc.xref_get_key(-1, "Info")[1].split()[0])
            for key, value in custom_info(spec).items():
                doc.xref_set_key(info_xref, key, fitz.get_pdf_str(value))
            doc.set_xml_metadata(xml)
            doc.saveIncr()
    published = target.read_bytes()
    if not published.startswith(original):
        raise ValueError(f"Original PDF bytes not preserved: {target}")
    with fitz.open(target) as doc:
        after = snapshot(doc, dpi)
        if before != after:
            raise ValueError(f"Page content, geometry, links or bookmarks changed: {target}")
        remaining = validation_errors(doc, spec)
        if remaining:
            raise ValueError(f"Metadata verification failed: {target}: {remaining}")
        result.update({
            "status": "updated" if errors else "already_complete",
            "published_bytes": len(published), "published_sha256": digest(published),
            "source_prefix_preserved": True, "render_dpi": dpi,
            "all_page_pixels_identical": True, "content_streams_identical": True,
            "geometry_links_bookmarks_identical": True,
            "page_count": doc.page_count, "bookmark_count": after["bookmark_count"],
            "after_info": dict(doc.metadata), "xmp_present": True,
            "page_pixel_checks": [{"page": item["number"], "size": item["pixel_size"],
                                   "sha256": item["pixel_sha256"]} for item in after["pages"]],
        })
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--provenance", type=Path,
                        help="Published source-prefix/render proof manifest (defaults to scripts/data/dpp-pdf-metadata-provenance.json)")
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--dpi", type=int, default=150)
    args = parser.parse_args()
    if not 72 <= args.dpi <= 600:
        parser.error("DPI must be between 72 and 600")
    root = args.root.resolve()
    provenance_path = args.provenance or root / "scripts/data/dpp-pdf-metadata-provenance.json"
    previous = json.loads(provenance_path.read_text(encoding="utf-8")) if provenance_path.exists() else {}
    previous_files = {item["file"]: item for item in previous.get("files", [])}
    stamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    results = []
    for spec in source_specs(root):
        result = update_one(root, spec, stamp, args.dpi, args.write)
        results.append(result)
        print(f"{result['status']}: {spec['relative']}", flush=True)
    report = {"metadata_updated_at": stamp, "mode": "write" if args.write else "check",
              "pymupdf_version": fitz.VersionBind,
              "metadata_source": "docs/global-digital-product-passport-regulation.md",
              "timestamp_note": "Existing sourced creation dates preserved. ReportLab's year-2000 placeholder removed; EditionDate identifies the supplied 2026-10-25 manuscript edition, not an invented original creation time.",
              "files": results}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.write:
        entries = []
        specs = {item["relative"]: item for item in source_specs(root)}
        for result in results:
            old = previous_files.get(result["file"], {})
            source_bytes = old.get("source_bytes", result["original_bytes"])
            source_sha256 = old.get("source_sha256", result["original_sha256"])
            if digest((root / result["file"]).read_bytes()[:source_bytes]) != source_sha256:
                raise ValueError("Historical source prefix changed: " + result["file"])
            spec = specs[result["file"]]
            entries.append({
                "file": result["file"], "source_bytes": source_bytes,
                "source_sha256": source_sha256, "output_bytes": result["published_bytes"],
                "output_sha256": result["published_sha256"], "pages": result["page_count"],
                "info": metadata_fields(spec), "rights": custom_info(spec),
                "verification": {
                    "source_prefix_preserved": True, "render_dpi": args.dpi,
                    "all_page_pixels_identical": True, "content_streams_identical": True,
                    "geometry_links_bookmarks_identical": True,
                    "bookmark_count": result["bookmark_count"], "xmp_present": True,
                },
            })
        proof = {"version": 1, "metadata_source": report["metadata_source"],
                 "metadata_updated_at": stamp if any(item["status"] == "updated" for item in results) else previous.get("metadata_updated_at", stamp),
                 "tool": "PyMuPDF " + fitz.VersionBind, "files": entries,
                 "timestamp_note": report["timestamp_note"]}
        provenance_path.parent.mkdir(parents=True, exist_ok=True)
        provenance_path.write_text(json.dumps(proof, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if any(row["status"] == "needs_update" for row in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
