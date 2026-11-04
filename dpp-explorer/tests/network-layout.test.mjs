import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { layoutNetwork, routeNetworkEdges } from '../src/network-layout.js';
import { graphData, STRUCTURAL } from '../src/model.js';

const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
const records = dataset.entities.filter(node => !STRUCTURAL.has(node.type));
const graph = graphData({ dataset }, records);
const ids = values => values.map(value => value.id).sort();
const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('network retains every released record, directed assertion and adjacency, including all isolates', () => {
  const scene = layoutNetwork(graph.nodes, graph.edges);
  assert.equal(scene.nodes.length, 128); assert.equal(scene.edges.length, 87);
  assert.deepEqual(ids(scene.nodes), ids(graph.nodes)); assert.deepEqual(ids(scene.edges), ids(graph.edges));
  assert.equal(scene.groups.filter(group => group.kind === 'connected').length, 13);
  assert.equal(scene.nodes.filter(node => node.isolated).length, 38);
  assert.deepEqual(scene.edges, [...graph.edges].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const node of scene.nodes) {
    assert.equal(node.label, graph.nodes.find(original => original.id === node.id).label);
    assert.equal(scene.incident.get(node.id).size, scene.edges.filter(edge => edge.source === node.id || edge.target === node.id).length);
    for (const neighbor of scene.adjacency.get(node.id)) assert.ok(scene.edges.some(edge => edge.source === node.id && edge.target === neighbor || edge.target === node.id && edge.source === neighbor));
  }
});

test('all dots and complete label boxes are separated and contained in their nonoverlapping component panels', () => {
  const scene = layoutNetwork(graph.nodes, graph.edges), groups = new Map(scene.groups.map(group => [group.id, group]));
  for (const node of scene.nodes) {
    const group = groups.get(node.groupId), label = node.labelBox;
    assert.ok(label.x >= group.x && label.y >= group.y && label.x + label.width <= group.x + group.width && label.y + label.height <= group.y + group.height);
    assert.ok(node.x - node.radius >= group.x && node.x + node.radius <= group.x + group.width && node.y - node.radius >= group.y + 40);
    assert.ok(node.labelLines.length >= 1 && node.labelLines.length <= 3);
    assert.ok(node.labelLines.every(line => [...line].length <= 18));
  }
  for (let i = 0; i < scene.nodes.length; i++) for (const other of scene.nodes.slice(i + 1)) {
    const node = scene.nodes[i];
    assert.ok(!overlaps(node.labelBox, other.labelBox), `${node.id} and ${other.id}: readable labels`);
    assert.ok(distance(node, other) > node.radius + other.radius, 'separate dots');
    const dotBox = n => ({ x: n.x - n.radius, y: n.y - n.radius, width: n.radius * 2, height: n.radius * 2 });
    assert.ok(!overlaps(dotBox(node), other.labelBox) && !overlaps(dotBox(other), node.labelBox), 'dots do not obscure another label');
  }
  for (let i = 0; i < scene.groups.length; i++) {
    const group = scene.groups[i];
    assert.ok(group.x >= 0 && group.y >= 0 && group.x + group.width <= scene.width && group.y + group.height <= scene.height);
    for (const other of scene.groups.slice(i + 1)) assert.ok(!overlaps(group, other), 'component panels stay separate');
  }
  assert.ok(scene.height < 3300, `overview remains compact: ${scene.height}px`);
});

test('isolates have an explicit shelf after the two largest networks and before smaller groups', () => {
  const scene = layoutNetwork(graph.nodes, graph.edges);
  assert.deepEqual(scene.groups.slice(0, 3).map(group => [group.kind, group.count]), [['connected', 37], ['connected', 21], ['isolated', 38]]);
  const shelf = scene.groups[2];
  assert.ok(scene.nodes.filter(node => node.groupId === shelf.id).every(node => node.isolated));
});

test('a focused single network is centred in the canvas', () => {
  const edge = graph.edges[0];
  const nodes = graph.nodes.filter(node => node.id === edge.source || node.id === edge.target);
  const scene = layoutNetwork(nodes, [edge]), panel = scene.groups[0];
  assert.equal(scene.groups.length, 1);
  assert.equal(panel.x + panel.width / 2, scene.width / 2);
  for (const node of scene.nodes) assert.ok(node.labelBox.x >= panel.x && node.labelBox.x + node.labelBox.width <= panel.x + panel.width);
});

test('layout and routes are deterministic under input order changes without mutating input', () => {
  const copy = structuredClone(graph), before = structuredClone(copy);
  copy.nodes.forEach(Object.freeze); copy.edges.forEach(Object.freeze); Object.freeze(copy.nodes); Object.freeze(copy.edges);
  const scene = layoutNetwork(copy.nodes, copy.edges), reversed = layoutNetwork([...copy.nodes].reverse(), [...copy.edges].reverse());
  assert.deepEqual(reversed, scene); assert.deepEqual(copy, before);
  assert.deepEqual(routeNetworkEdges(reversed), routeNetworkEdges(scene));
});

test('all released arrows have finite coordinates and stop outside their source and target dots', () => {
  const scene = layoutNetwork(graph.nodes, graph.edges), byId = new Map(scene.nodes.map(node => [node.id, node])), routes = routeNetworkEdges(scene);
  assert.equal(routes.size, scene.edges.length);
  for (const edge of scene.edges) {
    const route = routes.get(edge.id), source = byId.get(edge.source), target = byId.get(edge.target);
    assert.ok(!/NaN|Infinity/.test(route.path));
    assert.ok(Object.values(route.start).every(Number.isFinite) && Object.values(route.end).every(Number.isFinite));
    assert.ok(Math.abs(distance(source, route.start) - source.radius - 2) < 1e-8);
    assert.ok(Math.abs(distance(target, route.end) - target.radius - 5) < 1e-8);
  }
});

test('released connectors do not pass through unrelated dots or cross a component panel boundary', () => {
  const scene = layoutNetwork(graph.nodes, graph.edges), routes = routeNetworkEdges(scene);
  for (const edge of scene.edges) {
    const route = routes.get(edge.id), values = route.path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
    const source = scene.nodes.find(node => node.id === edge.source), panel = scene.groups.find(group => group.id === source.groupId);
    const controls = [];
    for (let i = 0; i < values.length; i += 2) controls.push({ x: values[i], y: values[i + 1] });
    for (let step = 0; step <= 200; step++) {
      const t = step / 200;
      let points = controls;
      while (points.length > 1) points = points.slice(0, -1).map((point, i) => ({ x: point.x * (1 - t) + points[i + 1].x * t, y: point.y * (1 - t) + points[i + 1].y * t }));
      const point = points[0];
      assert.ok(point.x >= panel.x && point.x <= panel.x + panel.width && point.y >= panel.y + 40 && point.y <= panel.y + panel.height, `${edge.id}: connector stays in its panel`);
      for (const node of scene.nodes) if (node.id !== edge.source && node.id !== edge.target) {
        assert.ok(distance(point, node) >= node.radius + 3, `${edge.id}: does not imply a connection to ${node.id}`);
      }
    }
  }
});

test('parallel, reciprocal and self relationships use distinct directed curves', () => {
  const nodes = [{ id: 'a', x: 100, y: 100, radius: 8 }, { id: 'b', x: 300, y: 100, radius: 8 }];
  const edges = [{ id: 'p1', source: 'a', target: 'b' }, { id: 'p2', source: 'a', target: 'b' }, { id: 'r1', source: 'b', target: 'a' }, { id: 's1', source: 'a', target: 'a' }, { id: 's2', source: 'a', target: 'a' }];
  const routes = routeNetworkEdges({ nodes, edges });
  assert.equal(new Set([...routes.values()].map(route => route.path)).size, 5);
  for (const edge of edges) {
    const route = routes.get(edge.id), source = nodes.find(node => node.id === edge.source), target = nodes.find(node => node.id === edge.target);
    assert.ok(Math.abs(distance(source, route.start) - 10) < 1e-8);
    assert.ok(Math.abs(distance(target, route.end) - 13) < 1e-8);
  }
  assert.deepEqual(routeNetworkEdges({ nodes: [...nodes].reverse(), edges: [...edges].reverse() }), routes);
});

test('empty and isolate-only views stay valid and contain no invented links', () => {
  const empty = layoutNetwork([], []);
  assert.deepEqual(empty.nodes, []); assert.deepEqual(empty.edges, []); assert.deepEqual(empty.groups, []);
  assert.equal(routeNetworkEdges(empty).size, 0); assert.equal(empty.width, 1080); assert.equal(empty.height, 240);
  const isolated = layoutNetwork(graph.nodes.slice(0, 2), []);
  assert.equal(isolated.groups.length, 1); assert.equal(isolated.groups[0].kind, 'isolated'); assert.equal(isolated.edges.length, 0);
});

test('invalid endpoint topology still receives the shared graph validation', () => {
  assert.throws(() => layoutNetwork(graph.nodes.slice(0, 1), [{ id: 'bad', source: graph.nodes[0].id, target: 'missing' }]), /outside the visible nodes/);
});
