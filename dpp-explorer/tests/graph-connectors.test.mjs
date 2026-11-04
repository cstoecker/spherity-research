import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { routeGraphEdges } from '../src/graph-connectors.js';
import { layoutGraph } from '../src/graph-layout.js';
import { graphData, STRUCTURAL } from '../src/model.js';

const card = (id, x, y, layer, height = 104) => ({ id, x, y, layer, width: 260, height });
const link = (id, source, target) => ({ id, source, target });
const numbers = path => path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
const commands = path => path.match(/[MLCQ][^MLCQ]*/g).map(part => ({ kind: part[0], values: numbers(part) }));
const fixture = {
  width: 1080,
  nodes: [card('a', 180, 100, 'legal'), card('b', 180, 260, 'legal'), card('c', 540, 100, 'standards'), card('d', 900, 100, 'ecosystems'), card('e', 900, 260, 'ecosystems')],
  edges: [link('same-lane', 'a', 'b'), link('adjacent', 'a', 'c'), link('reverse', 'c', 'a'), link('parallel', 'a', 'c'), link('outer', 'a', 'd'), link('outer-reverse', 'd', 'a'), link('self', 'c', 'c'), link('right-loop', 'd', 'e')],
};

function assertAttachments(scene, routes) {
  const byId = new Map(scene.nodes.map(node => [node.id, node]));
  assert.equal(routes.size, scene.edges.length);
  for (const edge of scene.edges) {
    const route = routes.get(edge.id), values = numbers(route.path);
    assert.ok(values.every(Number.isFinite), `${edge.id}: finite path coordinates`);
    assert.deepEqual(values.slice(0, 2), [route.start.x, route.start.y]);
    assert.deepEqual(values.slice(-2), [route.end.x, route.end.y]);
    for (const [node, point, side, gap] of [
      [byId.get(edge.source), route.start, route.sourceSide, 2],
      [byId.get(edge.target), route.end, route.targetSide, 5],
    ]) {
      assert.equal(Math.abs(point.x - node.x) - node.width / 2, gap, `${edge.id}: correct card clearance`);
      assert.equal(Math.sign(point.x - node.x), side === 'right' ? 1 : -1);
      assert.ok(Math.abs(point.y - node.y) <= node.height / 2 - 16 + 1e-8, `${edge.id}: clear of rounded card corners`);
    }
    assert.equal(values[3], route.start.y, `${edge.id}: horizontal departure tangent`);
    assert.equal(values.at(-3), route.end.y, `${edge.id}: horizontal arrival tangent`);
    assert.equal(Math.sign(values[2] - route.start.x), route.sourceSide === 'right' ? 1 : -1, `${edge.id}: departs outward`);
    assert.equal(Math.sign(route.end.x - values.at(-4)), route.targetSide === 'left' ? 1 : -1, `${edge.id}: arrives inward`);
    const segments = commands(route.path), departure = segments[1], arrival = segments.at(-1);
    assert.equal(departure.kind, 'L', `${edge.id}: source starts with a straight shaft`);
    assert.equal(arrival.kind, 'L', `${edge.id}: arrowhead sits on a straight shaft`);
    assert.ok(Math.abs(departure.values[0] - route.start.x) >= 18 - 1e-8, `${edge.id}: source stub length`);
    assert.ok(Math.abs(route.end.x - segments.at(-2).values.at(-2)) >= 18 - 1e-8, `${edge.id}: at least eighteen units before the arrow tip`);
    let prior = segments[0].values;
    const vectors = segments.slice(1).map(segment => {
      const start = prior.slice(-2), end = segment.values.slice(-2);
      const entry = [segment.values[0] - start[0], segment.values[1] - start[1]];
      const exitFrom = segment.kind === 'L' ? start : segment.values.slice(-4, -2);
      const exit = [end[0] - exitFrom[0], end[1] - exitFrom[1]];
      prior = segment.values; return { entry, exit };
    }).filter(segment => Math.hypot(...segment.entry) > 1e-8 && Math.hypot(...segment.exit) > 1e-8);
    for (let index = 1; index < vectors.length; index++) {
      const a = vectors[index - 1].exit, b = vectors[index].entry;
      assert.ok(Math.abs(a[0] * b[1] - a[1] * b[0]) < 1e-6, `${edge.id}: smooth connector joins`);
      assert.ok(a[0] * b[0] + a[1] * b[1] > 0, `${edge.id}: no reversed cusp behind the arrow`);
    }
  }
}

test('same-lane, both cross-lane directions, parallel and self links keep clear, inward-pointing arrow tips', () => {
  const routes = routeGraphEdges(fixture);
  assertAttachments(fixture, routes);
  assert.deepEqual([routes.get('same-lane').sourceSide, routes.get('same-lane').targetSide], ['right', 'right']);
  assert.deepEqual([routes.get('adjacent').sourceSide, routes.get('adjacent').targetSide], ['right', 'left']);
  assert.deepEqual([routes.get('reverse').sourceSide, routes.get('reverse').targetSide], ['left', 'right']);
  assert.notEqual(routes.get('self').start.y, routes.get('self').end.y, 'a self link has two separate ports');
});

test('incoming, outgoing, parallel and reciprocal edges share distinct, centred card ports', () => {
  const routes = routeGraphEdges(fixture), groups = new Map();
  for (const edge of fixture.edges) {
    const route = routes.get(edge.id);
    for (const [nodeId, side, point] of [[edge.source, route.sourceSide, route.start], [edge.target, route.targetSide, route.end]]) {
      const key = `${nodeId}:${side}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(point.y);
    }
  }
  for (const [key, values] of groups) {
    const ys = values.sort((a, b) => a - b), node = fixture.nodes.find(n => key.startsWith(`${n.id}:`));
    assert.equal(new Set(ys).size, ys.length, `${key}: no stacked connector ports`);
    assert.ok(Math.abs((ys[0] + ys.at(-1)) / 2 - node.y) < 1e-8, `${key}: centred ports`);
    for (let index = 1; index < ys.length; index++) assert.ok(ys[index] - ys[index - 1] <= 12 + 1e-8);
  }
});

test('busy fan-in stays inside the card and preserves the vertical order of its neighbours', () => {
  const sources = Array.from({ length: 12 }, (_, i) => card(`source-${i}`, 180, 100 + i * 130, 'legal'));
  const target = card('target', 540, 500, 'standards');
  const scene = { width: 1080, nodes: [...sources, target], edges: sources.map((node, i) => link(`edge-${i}`, node.id, target.id)) };
  const routes = routeGraphEdges(scene);
  assertAttachments(scene, routes);
  const ports = scene.edges.map(edge => routes.get(edge.id).end.y);
  assert.equal(new Set(ports).size, 12);
  assert.ok(ports.every((y, index) => !index || y > ports[index - 1]));
  assert.ok(Math.abs((ports[0] + ports.at(-1)) / 2 - target.y) < 1e-8);
});

test('overlapping same-lane spans use separate gutter tracks, including parallel and reciprocal assertions', () => {
  const nodes = [card('top', 540, 100, 'standards'), card('bottom', 540, 500, 'standards')];
  const edges = [link('one', 'top', 'bottom'), link('two', 'top', 'bottom'), link('reverse', 'bottom', 'top')];
  const scene = { width: 1080, nodes, edges }, routes = routeGraphEdges(scene);
  assertAttachments(scene, routes);
  const tracks = [...routes.values()].map(route => commands(route.path).find((segment, index, all) => segment.kind === 'L' && index > 1 && segment.values[0] === all[index - 1].values.at(-2)).values[0]);
  assert.equal(new Set(tracks).size, edges.length, 'vertical tracks do not collapse into one apparent connector');
  tracks.sort((a, b) => a - b);
  assert.ok(tracks.slice(1).every((x, index) => x - tracks[index] >= 7.9));
});

test('routing is deterministic under input permutations and does not mutate the scene', () => {
  const scene = structuredClone(fixture), before = structuredClone(scene);
  scene.nodes.forEach(Object.freeze); scene.edges.forEach(Object.freeze);
  Object.freeze(scene.nodes); Object.freeze(scene.edges); Object.freeze(scene);
  const expected = routeGraphEdges(scene);
  assert.deepEqual(routeGraphEdges({ ...scene, nodes: [...scene.nodes].reverse(), edges: [...scene.edges].reverse() }), expected);
  assert.deepEqual(scene, before);
});

// Sample the actual Bézier curves, rather than checking implementation strings.
function samplePath(path) {
  const tokens = path.match(/[MCLQ]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi);
  const points = [];
  let cursor = 0, current = { x: 0, y: 0 };
  const readPoint = () => ({ x: Number(tokens[cursor++]), y: Number(tokens[cursor++]) });
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    if (command === 'M') { current = readPoint(); points.push(current); continue; }
    const controls = [current];
    for (let i = 0; i < (command === 'C' ? 3 : command === 'Q' ? 2 : 1); i++) controls.push(readPoint());
    for (let step = 1; step <= 32; step++) {
      const t = step / 32;
      let work = controls;
      while (work.length > 1) work = work.slice(0, -1).map((point, i) => ({ x: point.x * (1 - t) + work[i + 1].x * t, y: point.y * (1 - t) + work[i + 1].y * t }));
      points.push(work[0]);
    }
    current = controls.at(-1);
  }
  return points;
}

test('all release connectors stay inside the canvas and avoid every card, including middle-lane cards', async () => {
  const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
  const records = dataset.entities.filter(node => !STRUCTURAL.has(node.type));
  const graph = graphData({ dataset }, records), scene = layoutGraph(graph.nodes, graph.edges);
  const routes = routeGraphEdges(scene);
  assertAttachments(scene, routes);
  for (const [id, route] of routes) {
    for (const point of samplePath(route.path)) {
      assert.ok(point.x >= 0 && point.x <= scene.width && point.y >= 0 && point.y <= scene.height, `${id}: within graph canvas`);
      for (const node of scene.nodes) {
        assert.ok(Math.abs(point.x - node.x) >= node.width / 2 || Math.abs(point.y - node.y) >= node.height / 2, `${id}: does not cross ${node.id}`);
      }
    }
  }
});

test('full release keeps every card port twelve units apart, including JTC24 and ESPR at minimum zoom', async () => {
  const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
  const graph = graphData({ dataset }, dataset.entities.filter(node => !STRUCTURAL.has(node.type)));
  const scene = layoutGraph(graph.nodes, graph.edges), routes = routeGraphEdges(scene), ports = new Map();
  for (const edge of scene.edges) {
    const route = routes.get(edge.id);
    for (const [id, side, y] of [[edge.source, route.sourceSide, route.start.y], [edge.target, route.targetSide, route.end.y]]) {
      const key = `${id}:${side}`;
      if (!ports.has(key)) ports.set(key, []);
      ports.get(key).push(y);
    }
  }
  for (const [key, values] of ports) {
    values.sort((a, b) => a - b);
    for (let index = 1; index < values.length; index++) {
      const separation = values[index] - values[index - 1];
      assert.ok(separation >= 12 - 1e-8, `${key}: distinct arrowheads`);
      assert.ok(separation * .75 >= 9 - 1e-8, `${key}: nine screen pixels even at 75% zoom`);
    }
  }
});

test('dictionary, JTC24, registry and UNTP focus views retain clear stems and avoid all cards', async () => {
  const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
  const records = dataset.entities.filter(node => !STRUCTURAL.has(node.type));
  for (const focus of ['std-bsdd', 'std-cen-jtc24', 'eu-dpp-registry', 'std-untp']) {
    const ids = new Set([focus]);
    for (const assertion of dataset.assertions) if (assertion.subject === focus || assertion.object.entity_id === focus) {
      ids.add(assertion.subject); ids.add(assertion.object.entity_id);
    }
    const graph = graphData({ dataset }, records.filter(node => ids.has(node.id))), scene = layoutGraph(graph.nodes, graph.edges);
    const routes = routeGraphEdges(scene); assertAttachments(scene, routes);
    for (const [id, route] of routes) for (const point of samplePath(route.path)) {
      assert.ok(point.x >= 0 && point.x <= scene.width && point.y >= 0 && point.y <= scene.height, `${focus}/${id}: within canvas`);
      for (const node of scene.nodes) assert.ok(Math.abs(point.x - node.x) >= node.width / 2 || Math.abs(point.y - node.y) >= node.height / 2, `${focus}/${id}: clear of ${node.id}`);
    }
  }
});

test('a missing endpoint produces a useful error instead of an invalid SVG connector', () => {
  assert.throws(() => routeGraphEdges({ width: 1080, nodes: fixture.nodes, edges: [link('broken', 'a', 'missing')] }), /broken.*missing endpoint/);
});
