import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { graphData, layerOf, STRUCTURAL } from '../src/model.js';
import { GRAPH_LANES, layoutGraph } from '../src/graph-layout.js';
import { semanticBadges } from '../src/semantic-profiles.js';

const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
const records = dataset.entities.filter(node => !STRUCTURAL.has(node.type));
const graph = graphData({ dataset }, records);
const ids = values => values.map(value => value.id).sort();
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};

test('full release retains all 128 visible records and 87 qualified directed edges', () => {
  const layout = layoutGraph(graph.nodes, graph.edges);
  assert.equal(layout.nodes.length, 128);
  assert.equal(layout.edges.length, 87);
  assert.deepEqual(ids(layout.nodes), ids(graph.nodes));
  assert.deepEqual(ids(layout.edges), ids(graph.edges));
  for (const edge of layout.edges) {
    const original = graph.edges.find(candidate => candidate.id === edge.id);
    assert.deepEqual(edge, original);
    assert.notEqual(edge, original);
    assert.equal(typeof edge.source, 'string');
    assert.equal(typeof edge.target, 'string');
  }
  assert.equal(layout.nodes.filter(node => node.degree > 0).length, 90);
  assert.equal(layout.nodes.filter(node => node.isolated).length, 38);
});

test('taxonomy columns keep every card contained, with no overlaps or fit-to-height scaling', () => {
  const layout = layoutGraph(graph.nodes, graph.edges, { width: 390 });
  assert.equal(layout.width, 1080);
  assert.deepEqual(layout.lanes.map(lane => lane.id), ['legal', 'standards', 'ecosystems']);
  assert.deepEqual(layout.lanes.map(lane => lane.count), [40, 43, 45]);
  for (const lane of layout.lanes) {
    const members = layout.nodes.filter(node => node.layer === lane.id);
    let priorBottom = 0;
    let reachedIsolates = false;
    for (const node of members) {
      assert.equal(node.layer, layerOf(node));
      assert.equal(node.x, lane.x + lane.width / 2);
      assert.equal(node.width, 260);
      assert.ok(node.x - node.width / 2 >= lane.x);
      assert.ok(node.x + node.width / 2 <= lane.x + lane.width);
      assert.ok(node.y - node.height / 2 >= priorBottom + 24);
      assert.ok(node.y + node.height / 2 <= layout.height);
      assert.ok(node.height >= 72);
      priorBottom = node.y + node.height / 2;
      if (node.isolated) reachedIsolates = true;
      else assert.equal(reachedIsolates, false, 'isolates follow connected records in each lane');
    }
  }
  assert.ok(layout.height > 4000, 'full graph scrolls vertically instead of shrinking labels');
  const wider = layoutGraph(graph.nodes, graph.edges, { width: 1440 });
  assert.equal(wider.width, 1440);
  assert.equal(wider.height, layout.height, 'a wider viewport does not shrink card typography');
});

test('layout and indexes are deterministic across repeated calls and input permutations', () => {
  const expected = layoutGraph(graph.nodes, graph.edges);
  assert.deepEqual(layoutGraph(graph.nodes, graph.edges), expected);
  assert.deepEqual(layoutGraph([...graph.nodes].reverse(), [...graph.edges].reverse()), expected);
});

test('layout does not mutate frozen node, edge, assertion or status input objects', () => {
  const input = freeze(structuredClone(graph));
  const before = JSON.stringify(input);
  const result = layoutGraph(input.nodes, input.edges);
  assert.equal(JSON.stringify(input), before);
  for (const node of result.nodes) {
    const original = input.nodes.find(candidate => candidate.id === node.id);
    assert.notEqual(node, original);
    assert.equal(node.label, original.label);
    assert.deepEqual(node.status, original.status);
    assert.equal(Object.hasOwn(original, 'x'), false);
  }
});

test('neighbour and incident indexes contain exactly actual visible endpoints and edge IDs', () => {
  const layout = layoutGraph(graph.nodes, graph.edges);
  for (const node of graph.nodes) {
    const touching = graph.edges.filter(edge => edge.source === node.id || edge.target === node.id);
    const neighbours = new Set(touching.map(edge => edge.source === node.id ? edge.target : edge.source));
    assert.deepEqual([...layout.adjacency.get(node.id)].sort(), [...neighbours].sort());
    assert.deepEqual([...layout.incident.get(node.id)].sort(), touching.map(edge => edge.id).sort());
    assert.equal(layout.nodes.find(candidate => candidate.id === node.id).degree, touching.length);
  }
});

test('parallel and incoming assertions contribute to degree without inventing directed relationships', () => {
  const nodes = [{ id: 'a', label: 'Alpha', type: 'Standard' }, { id: 'b', label: 'Beta', type: 'Pilot' }, { id: 'c', label: 'Gamma', type: 'Policy' }];
  const edges = [{ id: 'ab1', source: 'a', target: 'b' }, { id: 'ab2', source: 'a', target: 'b' }, { id: 'ca', source: 'c', target: 'a' }];
  const result = layoutGraph(nodes, edges);
  assert.equal(result.nodes.find(node => node.id === 'a').degree, 3);
  assert.deepEqual([...result.adjacency.get('a')].sort(), ['b', 'c']);
  assert.deepEqual(result.edges.map(edge => [edge.id, edge.source, edge.target]), edges.map(edge => [edge.id, edge.source, edge.target]));
  assert.equal(result.edges.some(edge => edge.source === 'b'), false);
});

test('busy cards reserve twelve-unit connector spacing while ordinary cards keep their content height', () => {
  const hub = { id: 'hub', label: 'Hub', type: 'Standard' };
  const leaves = Array.from({ length: 10 }, (_, index) => ({ id: `leaf-${index}`, label: `Leaf ${index}`, type: 'Standard' }));
  const edges = leaves.map(node => ({ id: `link-${node.id}`, source: node.id, target: hub.id }));
  const result = layoutGraph([hub, ...leaves], edges);
  assert.equal(result.nodes.find(node => node.id === hub.id).height, 32 + 9 * 12);
  assert.ok(result.nodes.filter(node => node.id !== hub.id).every(node => node.height === 72));
  const selfEdges = Array.from({ length: 4 }, (_, index) => ({ id: `self-${index}`, source: hub.id, target: hub.id }));
  const self = layoutGraph([hub], selfEdges).nodes[0];
  assert.equal(self.degree, 4, 'self relationships do not inflate evidence degree');
  assert.equal(self.height, 32 + 7 * 12, 'each self relationship still needs two visible ports');
});

test('filtered isolated records remain selectable in their normal family lane', () => {
  const originallyConnected = layoutGraph(graph.nodes, graph.edges).nodes.find(node => node.degree > 0);
  const subset = graphData({ dataset }, [records.find(node => node.id === originallyConnected.id)]);
  const result = layoutGraph(subset.nodes, subset.edges);
  assert.equal(result.nodes.length, 1);
  assert.equal(result.edges.length, 0);
  assert.equal(result.nodes[0].id, originallyConnected.id);
  assert.equal(result.nodes[0].layer, originallyConnected.layer);
  assert.equal(result.nodes[0].degree, 0);
  assert.equal(result.nodes[0].isolated, true);
  assert.match(result.nodes[0].linkStatus, /No visible links in this view/);
  assert.equal(result.adjacency.get(originallyConnected.id).size, 0);
  assert.equal(result.incident.get(originallyConnected.id).size, 0);
});

test('long labels have readable wrapped lines and retain the full original title', () => {
  const label = 'A substantially longer Digital Product Passport specification name with aSupercalifragilisticexpialidociousIdentifier and additional version information';
  const result = layoutGraph([{ id: 'long', label, type: 'Specification' }], []);
  const node = result.nodes[0];
  assert.equal(node.label, label);
  assert.equal(node.labelLines.length, 3);
  assert.ok(node.labelLines.every(line => [...line].length <= 28));
  assert.equal(node.labelTruncated, true);
  assert.ok(node.labelLines.at(-1).endsWith('…'));
  const short = layoutGraph([{ id: 'short', label: 'GS1', type: 'Standard' }], []).nodes[0];
  assert.deepEqual(short.labelLines, ['GS1']);
  assert.equal(short.labelTruncated, false);
  assert.ok(node.height > short.height);
});

test('empty and one-node graphs keep all three labelled lanes and finite geometry', () => {
  const empty = layoutGraph([], []);
  assert.deepEqual(empty.nodes, []);
  assert.deepEqual(empty.edges, []);
  assert.equal(empty.adjacency.size, 0);
  assert.equal(empty.incident.size, 0);
  assert.equal(empty.width, 1080);
  assert.ok(Number.isFinite(empty.height) && empty.height > 0);
  assert.deepEqual(empty.lanes.map(lane => lane.count), [0, 0, 0]);
  assert.deepEqual(empty.lanes.map(({ id, label, description }) => ({ id, label, description })), GRAPH_LANES);
  const single = layoutGraph([{ id: 'only', label: 'One initiative', type: 'Initiative' }], []);
  assert.ok(single.nodes[0].y - single.nodes[0].height / 2 >= 24);
  assert.equal(single.lanes[2].count, 1);
});

test('malformed graph endpoints and duplicate IDs fail explicitly instead of losing records', () => {
  const nodes = [{ id: 'a', label: 'Alpha', type: 'Standard' }];
  assert.throws(() => layoutGraph(nodes, [{ id: 'bad', source: 'a', target: 'missing' }]), /outside the visible nodes/);
  assert.throws(() => layoutGraph([...nodes, ...nodes], []), /unique nonempty node IDs/);
  assert.throws(() => layoutGraph(nodes, [{ id: 'x', source: 'a', target: 'a' }, { id: 'x', source: 'a', target: 'a' }]), /unique nonempty edge IDs/);
});

test('unassessed records preserve their original card height and have no inferred semantic badges', () => {
  const node = { id: 'unassessed-example', label: 'Unassessed vocabulary', type: 'Specification' };
  const original = structuredClone(node);
  const layout = layoutGraph([node], []);
  const card = layout.nodes[0];
  assert.deepEqual(card.semanticBadges, []);
  assert.equal(card.semanticFooterHeight, 0);
  assert.equal(card.height, Math.max(72, 48 + card.labelLines.length * 20));
  assert.deepEqual(node, original);
  assert.deepEqual(semanticBadges(node.id), []);
});

test('researched semantic badges have their own footer without colliding with titles or other cards', () => {
  const annotated = records.filter(node => semanticBadges(node.id).length);
  assert.ok(annotated.some(node => node.id === 'std-eclass'), 'the requested ECLASS example is assessed');
  const layout = layoutGraph(graph.nodes, graph.edges);
  for (const source of annotated) {
    const card = layout.nodes.find(node => node.id === source.id);
    const baselineCard = layoutGraph([{ ...source, id: 'unassessed-layout-baseline' }], []).nodes[0];
    assert.deepEqual(card.semanticBadges, semanticBadges(source.id));
    assert.ok(card.semanticBadges.length <= 2, 'the footer fits at most two badges');
    assert.equal(card.semanticFooterHeight, 30);
    assert.equal(card.height, baselineCard.height + 30);
    assert.deepEqual(card.labelLines, baselineCard.labelLines, 'badges never shorten the record label');
    const labelBottom = card.y - card.height / 2 + 42 + (card.labelLines.length - 1) * 20 + 5;
    const footerTop = card.y + card.height / 2 - 30;
    assert.ok(footerTop >= labelBottom + 8, 'footer clears the last label baseline and descenders');
    assert.ok(footerTop + 22 <= card.y + card.height / 2 - 8, 'footer retains bottom padding');
    card.semanticBadges.forEach((badge, index) => {
      const left = card.x - 114 + index * 118;
      assert.ok(left >= card.x - card.width / 2 + 16);
      assert.ok(left + 110 <= card.x + card.width / 2 - 16, 'chips remain inside card padding');
      assert.ok(badge.symbol && badge.label && badge.description, 'symbols are accompanied by text and explanations');
    });
  }
});
