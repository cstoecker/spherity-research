// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import { canonicalGraph } from '../src/compliance.mjs';
import { complianceScenarios } from '../src/compliance-scenarios.mjs';
import { newParty, signObject } from '../src/signed.mjs';
const {NQuads} = createRequire(import.meta.url)('rdf-canonize');
const p = newParty('source');
const ev = (key, body) => ({declaration:signObject(p,{type:'Declaration'}),statements:new Map([[key,signObject(p,body)]])});
test('evidence graph refuses IRI injection before canonicalization',async()=>{
 await assert.rejects(canonicalGraph(ev('urn:s> <urn:injected> _:b0 .\n<urn:s',{type:'Extra',value:'ok'}),null),/invalid evidence IRI/);
 await assert.rejects(canonicalGraph(ev('urn:s',{'p> <urn:x> _:b .\n<urn:q':'x'}),null),/invalid evidence IRI/);
});
test('evidence graph preserves valid newline literals without blank nodes',async()=>{
 const graph=await canonicalGraph(ev('urn:s',{value:'one\ntwo'}),null);
 const quads=NQuads.parse(graph);
 assert.ok(quads.some(q=>q.object.value==='one\ntwo'));
 assert.ok(quads.every(q=>[q.subject,q.predicate,q.object,q.graph].every(t=>t.termType!=='BlankNode')));
});
test('B10 isolates timestamp binding with a valid certifier signature',async()=>{
 const rows=await complianceScenarios();const row=rows.find(r=>r.id==='B10');
 assert.equal(row.actual,'rejected');
 assert.match(row.detail,/trusted time missing or not over this certificate core/);
});
