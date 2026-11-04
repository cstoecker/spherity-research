import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyEvidenceUpdates, applyEvidenceMapUpdates, applyEvidenceTaxonomyUpdates } from '../src/evidence-updates.js';
import { graphData, STRUCTURAL, createModel, filterRecords, emptyState } from '../src/model.js';
import { layoutGraph } from '../src/graph-layout.js';
import { routeGraphEdges } from '../src/graph-connectors.js';
import { layoutNetwork, routeNetworkEdges } from '../src/network-layout.js';
import { loadCandidate } from '../scripts/candidate-release.mjs';

const frozen = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
const updates = JSON.parse(await readFile(new URL('../src/data/evidence-updates.json', import.meta.url), 'utf8'));
const dataset = applyEvidenceUpdates(frozen, updates);
const records = dataset.entities.filter(node => !STRUCTURAL.has(node.type));
const graph = graphData({ dataset }, records);
const structured = layoutGraph(graph.nodes, graph.edges);
const network = layoutNetwork(graph.nodes, graph.edges);
const ids = items => items.map(item => item.id).sort();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const contains = (outer, inner) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const pointWithin = (point, rect) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
const cardRect = node => ({ x: node.x - node.width / 2, y: node.y - node.height / 2, width: node.width, height: node.height });
const dotRect = node => ({ x: node.x - node.radius, y: node.y - node.radius, width: node.radius * 2, height: node.radius * 2 });
const candidate = await loadCandidate();
const candidateRecords = candidate.dataset.entities.filter(node => !STRUCTURAL.has(node.type));
const candidateGraph = graphData({dataset:candidate.dataset},candidateRecords);

test('candidate structured graph retains all 192 records and 205 active connectors without card or arrow collisions',()=>{
  assert.equal(candidateGraph.nodes.length,192);assert.equal(candidateGraph.edges.length,205);
  const scene=layoutGraph(candidateGraph.nodes,candidateGraph.edges);
  assert.deepEqual(ids(scene.nodes),ids(candidateGraph.nodes));
  assert.deepEqual(ids(scene.edges),ids(candidateGraph.edges));
  assertStructuredGeometry(scene);
});

test('candidate network keeps all records and active edges, readable labels and true component connections',()=>{
  const scene=layoutNetwork(candidateGraph.nodes,candidateGraph.edges);
  assert.deepEqual(ids(scene.nodes),ids(candidateGraph.nodes));
  assert.deepEqual(ids(scene.edges),ids(candidateGraph.edges));
  assertNetworkGeometry(scene);
});

function segments(path) {
  assert.ok(!/NaN|Infinity/.test(path), 'SVG coordinates must be finite');
  let current;
  const result = [];
  for (const command of path.match(/[MLCQ][^MLCQ]*/g)) {
    const values = command.slice(1).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
    assert.ok(values.every(Number.isFinite));
    const points = Array.from({ length: values.length / 2 }, (_, index) => ({ x: values[index * 2], y: values[index * 2 + 1] }));
    if (command[0] !== 'M') result.push({ kind: command[0], points: [current, ...points] });
    current = points.at(-1);
  }
  return result;
}

function samplePath(path, steps = 32) {
  const result = [];
  for (const segment of segments(path)) {
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      let points = segment.points;
      while (points.length > 1) points = points.slice(0, -1).map((point, index) => ({
        x: point.x * (1 - t) + points[index + 1].x * t,
        y: point.y * (1 - t) + points[index + 1].y * t,
      }));
      result.push(points[0]);
    }
  }
  return result;
}

function assertStructuredGeometry(scene) {
  const byId = new Map(scene.nodes.map(node => [node.id, node])), canvas = { x: 0, y: 0, width: scene.width, height: scene.height };
  const routes = routeGraphEdges(scene), ports = new Map();
  assert.equal(routes.size, scene.edges.length);
  for (let index = 0; index < scene.nodes.length; index++) {
    const node = scene.nodes[index], rect = cardRect(node);
    assert.ok(contains(canvas, rect), `${node.id}: card stays within canvas`);
    for (const other of scene.nodes.slice(index + 1)) assert.ok(!overlaps(rect, cardRect(other)), `${node.id}/${other.id}: cards do not overlap`);
  }
  for (const edge of scene.edges) {
    const route = routes.get(edge.id), source = byId.get(edge.source), target = byId.get(edge.target);
    assert.ok(Math.abs(Math.abs(route.start.x - source.x) - source.width / 2 - 2) < 1e-8, `${edge.id}: source clearance`);
    assert.ok(Math.abs(Math.abs(route.end.x - target.x) - target.width / 2 - 5) < 1e-8, `${edge.id}: arrow-tip clearance`);
    const last = segments(route.path).at(-1);
    assert.equal(last.kind, 'L', `${edge.id}: straight arrow stem`);
    assert.equal(last.points[0].y, last.points[1].y);
    assert.ok(distance(...last.points) >= 18 - 1e-8, `${edge.id}: arrow has room behind its tip`);
    for (const [nodeId, side, point] of [[edge.source, route.sourceSide, route.start], [edge.target, route.targetSide, route.end]]) {
      const key = `${nodeId}:${side}`;
      if (!ports.has(key)) ports.set(key, []);
      ports.get(key).push(point.y);
    }
    for (const point of samplePath(route.path)) {
      assert.ok(pointWithin(point, canvas), `${edge.id}: connector stays within canvas`);
      for (const node of scene.nodes) assert.ok(Math.abs(point.x - node.x) >= node.width / 2 || Math.abs(point.y - node.y) >= node.height / 2, `${edge.id}: connector avoids ${node.id}`);
    }
  }
  for (const [key, values] of ports) {
    values.sort((a, b) => a - b);
    for (let index = 1; index < values.length; index++) assert.ok(values[index] - values[index - 1] >= 12 - 1e-8, `${key}: separate arrowheads, including at 75% zoom`);
  }
}

function assertNetworkGeometry(scene) {
  const groups = new Map(scene.groups.map(group => [group.id, group])), byId = new Map(scene.nodes.map(node => [node.id, node]));
  const canvas = { x: 0, y: 0, width: scene.width, height: scene.height };
  for (let index = 0; index < scene.groups.length; index++) {
    const group = scene.groups[index];
    assert.ok(contains(canvas, group), `${group.id}: group stays within canvas`);
    for (const other of scene.groups.slice(index + 1)) assert.ok(!overlaps(group, other), `${group.id}/${other.id}: separate panels`);
  }
  for (let index = 0; index < scene.nodes.length; index++) {
    const node = scene.nodes[index], group = groups.get(node.groupId);
    assert.ok(contains(group, node.labelBox) && contains(group, dotRect(node)), `${node.id}: dot and label stay inside their panel`);
    assert.ok(node.labelLines.length >= 1 && node.labelLines.length <= 3);
    for (const other of scene.nodes.slice(index + 1)) {
      assert.ok(!overlaps(node.labelBox, other.labelBox), `${node.id}/${other.id}: readable labels`);
      assert.ok(!overlaps(dotRect(node), other.labelBox) && !overlaps(dotRect(other), node.labelBox), `${node.id}/${other.id}: dots do not cover labels`);
      assert.ok(distance(node, other) > node.radius + other.radius, `${node.id}/${other.id}: separate dots`);
    }
  }
  const routes = routeNetworkEdges(scene);
  assert.equal(routes.size, scene.edges.length);
  for (const edge of scene.edges) {
    const route = routes.get(edge.id), source = byId.get(edge.source), target = byId.get(edge.target), group = groups.get(source.groupId);
    assert.equal(source.groupId, target.groupId, `${edge.id}: endpoints share their true component`);
    assert.ok(Math.abs(distance(source, route.start) - source.radius - 2) < 1e-8);
    assert.ok(Math.abs(distance(target, route.end) - target.radius - 5) < 1e-8);
    for (const point of samplePath(route.path, 200)) {
      assert.ok(pointWithin(point, group) && point.y >= group.y + 40, `${edge.id}: curve stays in its panel and below its title`);
      for (const node of scene.nodes) if (node.id !== edge.source && node.id !== edge.target) assert.ok(distance(point, node) >= node.radius + 3, `${edge.id}: no false connection through ${node.id}`);
    }
  }
}

test('dated JTC5 and jurisdiction evidence is present without dropping records or changing directed assertions in either layout', () => {
  assert.equal(graph.nodes.length, 150); assert.equal(graph.edges.length, 139);
  for (const scene of [structured, network]) {
    assert.deepEqual(ids(scene.nodes), ids(graph.nodes)); assert.deepEqual(ids(scene.edges), ids(graph.edges));
    assert.equal(scene.incident.get('std-iso-jtc5').size, 13);
    assert.equal(scene.adjacency.get('std-iso-jtc5').size, 13);
    for (const edge of scene.edges) assert.deepEqual(edge, graph.edges.find(original => original.id === edge.id));
    for (const node of scene.nodes) assert.equal(node.label, records.find(original => original.id === node.id).label);
  }
});

test('merged networks show the actual connected components and retain the explicit isolate shelf', () => {
  const adjacency = new Map(graph.nodes.map(node => [node.id, new Set()]));
  for (const edge of graph.edges) { adjacency.get(edge.source).add(edge.target); adjacency.get(edge.target).add(edge.source); }
  const pending = new Set(graph.nodes.map(node => node.id)), expected = [];
  for (const node of graph.nodes) {
    if (!pending.has(node.id) || !adjacency.get(node.id).size) continue;
    const component = [], queue = [node.id]; pending.delete(node.id);
    while (queue.length) {
      const id = queue.pop(); component.push(id);
      for (const other of adjacency.get(id)) if (pending.delete(other)) queue.push(other);
    }
    expected.push(component.sort().join('|'));
  }
  const actual = network.groups.filter(group => group.kind === 'connected').map(group => network.nodes.filter(node => node.groupId === group.id).map(node => node.id).sort().join('|'));
  assert.deepEqual(actual.sort(), expected.sort());
  assert.equal(actual.length, 9);
  assert.equal(network.groups[0].count, 91, 'sourced W3C, technical, committee and jurisdiction evidence join the earlier components');
  const shelf = network.groups.find(group => group.kind === 'isolated');
  assert.equal(shelf.count, 35);
  assert.deepEqual(network.nodes.filter(node => node.isolated).map(node => node.id).sort(), [...pending].sort());
});

test('updated structured overview keeps every card and connector clear, with separated JTC5 arrow ports', () => {
  assertStructuredGeometry(structured);
  assert.ok(structured.nodes.find(node => node.id === 'std-iso-jtc5').height >= 32 + 12 * 12);
});

test('updated network overview has no overlapping labels, false dot connections or clipped panels', () => {
  assertNetworkGeometry(network);
});

test('JTC5 focus remains a complete, readable fourteen-node neighbourhood in both layouts', () => {
  const focus = 'std-iso-jtc5', selected = new Set([focus, ...structured.adjacency.get(focus)]);
  const focused = graphData({ dataset }, records.filter(node => selected.has(node.id)));
  assert.equal(focused.nodes.length, 14); assert.equal(focused.edges.length, 14);
  assertStructuredGeometry(layoutGraph(focused.nodes, focused.edges));
  assertNetworkGeometry(layoutNetwork(focused.nodes, focused.edges));
});

test('the added evidence preserves deterministic ordering and routing', () => {
  const nodes = [...graph.nodes].reverse(), edges = [...graph.edges].reverse();
  assert.deepEqual(layoutGraph(nodes, edges), structured);
  assert.deepEqual(layoutNetwork(nodes, edges), network);
  assert.deepEqual(routeGraphEdges(layoutGraph(nodes, edges)), routeGraphEdges(structured));
  assert.deepEqual(routeNetworkEdges(layoutNetwork(nodes, edges)), routeNetworkEdges(network));
});


test('W3C technical context remains readable in all five filtered structured and network views', async () => {
  const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
  const map = applyEvidenceMapUpdates(await json('../../dpp-research/releases/0.1.0/views/world-map.json'), updates);
  const taxonomy = applyEvidenceTaxonomyUpdates(await json('../src/data/ecosystems.json'), updates);
  const model = createModel(dataset, map, taxonomy);
  for (const [id, key] of [['iso-iec-jtc5', 'standards'], ['cen-cenelec-jtc24', 'standards'], ['w3c', 'standards'], ['untp', 'ecosystems'], ['cirpass2', 'ecosystems']]) {
    const filtered = graphData(model, filterRecords(model, { ...emptyState(), [key]: [id] }));
    assert.ok(filtered.nodes.some(node => node.id.startsWith('std-w3c-')), id);
    assertStructuredGeometry(layoutGraph(filtered.nodes, filtered.edges));
    assertNetworkGeometry(layoutNetwork(filtered.nodes, filtered.edges));
  }
});
