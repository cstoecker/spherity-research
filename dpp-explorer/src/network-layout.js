import { layoutGraph } from './graph-layout.js';
import { networkLabel } from './network-labels.js';

const LABEL_WIDTH = 128, LABEL_HEIGHT = 54, DOT_RADIUS = 8;
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const between = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function labelLines(node) {
  const words = networkLabel(node).split(/\s+/).flatMap(word => word.match(/.{1,18}/gu) || []);
  const lines = [];
  for (const word of words) {
    if (lines.length && [...`${lines.at(-1)} ${word}`].length <= 18) lines[lines.length - 1] += ` ${word}`;
    else lines.push(word);
  }
  if (lines.length > 3) lines.splice(2, lines.length - 2, lines.slice(2).join(' ').slice(0, 17).trimEnd() + '…');
  return lines;
}

function overlap(a, b) {
  // The occupied box includes both the dot and its label underneath it.
  return Math.abs(a.x - b.x) < LABEL_WIDTH + 10 && Math.abs(a.y - b.y) < 86;
}

function radialPositions(count, availableWidth) {
  if (count === 1) return [{ x: 0, y: 0 }];
  if (count === 2) return [{ x: -76, y: 0 }, { x: 76, y: 0 }];
  if (count === 3) return [{ x: 0, y: -44 }, { x: -76, y: 44 }, { x: 76, y: 44 }];
  let positions = [{ x: 0, y: 0 }];
  const ring = (number, rx, ry, offset) => Array.from({ length: number }, (_, i) => {
    const angle = offset + i * Math.PI * 2 / number;
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  });
  if (count <= 9) positions.push(...ring(count - 1, 180, 116, -Math.PI / 2));
  else if (count <= 25) positions.push(...ring(6, 162, 96, Math.PI / 6), ...ring(count - 7, 324, 192, 0));
  else if (count <= 37) {
    for (let radius = 1; radius <= 3; radius++) {
      const slots = [];
      for (let q = -radius; q <= radius; q++) for (let r = -radius; r <= radius; r++) {
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) === radius) slots.push({ x: 144 * (q + r / 2), y: 88 * r });
      }
      slots.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
      const needed = Math.min(slots.length, count - positions.length);
      for (let i = 0; i < needed; i++) positions.push(slots[Math.floor(i * slots.length / needed)]);
    }
  }
  if (positions.length === count) {
    for (let attempts = 0; attempts < 40; attempts++) {
      if (!positions.some((point, i) => positions.slice(i + 1).some(other => overlap(point, other)))) break;
      positions = positions.map(point => ({ x: point.x * 1.045, y: point.y * 1.045 }));
    }
  }
  const width = Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x)) + LABEL_WIDTH + 32;
  if (positions.length !== count || width > availableWidth) {
    // A wide future component remains legible on a bounded staggered lattice.
    const columns = Math.max(2, Math.floor((availableWidth - LABEL_WIDTH - 32) / 144));
    const rows = Math.ceil(count / columns);
    positions = Array.from({ length: count }, (_, i) => ({
      x: ((i % columns) - (columns - 1) / 2) * 144 + (Math.floor(i / columns) % 2 ? 36 : -36),
      y: (Math.floor(i / columns) - (rows - 1) / 2) * 88,
    })).sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) || a.y - b.y || a.x - b.x);
  }
  return positions;
}

function arrangeComponent(members, base, availableWidth) {
  const rank = (a, b) => base.incident.get(b.id).size - base.incident.get(a.id).size || compare(a.label, b.label) || compare(a.id, b.id);
  const byId = new Map(members.map(node => [node.id, node]));
  const hub = [...members].sort(rank)[0], ordered = [], queued = new Set([hub.id]), pending = [hub];
  while (pending.length) {
    const node = pending.shift(); ordered.push(node);
    const neighbors = [...base.adjacency.get(node.id)].filter(id => byId.has(id) && !queued.has(id)).map(id => byId.get(id)).sort(rank);
    for (const neighbor of neighbors) { queued.add(neighbor.id); pending.push(neighbor); }
  }
  const slots = radialPositions(members.length, availableWidth), assigned = new Map(), local = [];
  for (const node of ordered) {
    const neighbors = [...base.adjacency.get(node.id)].map(id => assigned.get(id)).filter(Boolean);
    let best = 0, score = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const candidate = slots[i];
      const next = neighbors.length ? neighbors.reduce((sum, point) => sum + between(candidate, point) ** 2, 0) / neighbors.length : Math.hypot(candidate.x, candidate.y) ** 2;
      if (next < score) { best = i; score = next; }
    }
    const point = slots.splice(best, 1)[0]; assigned.set(node.id, point); local.push({ ...node, ...point });
  }
  const minX = Math.min(...local.map(n => n.x)), maxX = Math.max(...local.map(n => n.x));
  const minY = Math.min(...local.map(n => n.y)), maxY = Math.max(...local.map(n => n.y));
  return {
    id: members[0].componentId, label: networkLabel(hub), kind: 'connected', count: members.length,
    width: Math.max(240, Math.ceil(maxX - minX + LABEL_WIDTH + 32)), height: Math.ceil(maxY - minY + 138),
    nodes: local.map(node => ({ ...node, x: node.x - minX + 80, y: node.y - minY + 52 })),
  };
}

/** Stable component panels: radial connected networks plus an explicit isolate shelf. */
export function layoutNetwork(nodes, edges, options = {}) {
  const base = layoutGraph(nodes, edges, options), width = base.width, padding = 16, gap = 16, availableWidth = width - padding * 2;
  const components = new Map(), isolated = [];
  for (const node of base.nodes) {
    if (node.isolated) isolated.push(node);
    else {
      if (!components.has(node.componentId)) components.set(node.componentId, []);
      components.get(node.componentId).push(node);
    }
  }
  const pieces = [...components.values()].sort((a, b) => b.length - a.length || compare(a[0].componentId, b[0].componentId))
    .map(members => arrangeComponent(members, base, availableWidth));
  if (isolated.length) {
    isolated.sort((a, b) => compare(a.label, b.label) || compare(a.id, b.id));
    const columns = Math.max(1, Math.floor((availableWidth - 32) / 144)), columnWidth = (availableWidth - 32) / columns;
    const shelf = {
      id: 'unconnected-records', label: 'Records without visible connections', kind: 'isolated', count: isolated.length,
      width: availableWidth, height: (Math.ceil(isolated.length / columns) - 1) * 88 + 138,
      nodes: isolated.map((node, i) => ({ ...node, x: 16 + columnWidth * (i % columns + .5), y: 52 + Math.floor(i / columns) * 88 })),
    };
    pieces.splice(Math.min(2, pieces.length), 0, shelf);
  }
  const groups = [], positioned = [];
  let x = pieces.length === 1 ? (width - pieces[0].width) / 2 : padding, y = padding, rowHeight = 0;
  for (const piece of pieces) {
    if (x > padding && x + piece.width > width - padding) { x = padding; y += rowHeight + gap; rowHeight = 0; }
    groups.push({ id: piece.id, label: piece.label, kind: piece.kind, x, y, width: piece.width, height: piece.height, count: piece.count });
    for (const node of piece.nodes) {
      const nx = node.x + x, ny = node.y + y;
      positioned.push({ ...node, x: nx, y: ny, radius: DOT_RADIUS, labelLines: labelLines(node),
        groupId: piece.id, labelBox: { x: nx - LABEL_WIDTH / 2, y: ny + 16, width: LABEL_WIDTH, height: LABEL_HEIGHT } });
    }
    x += piece.width + gap; rowHeight = Math.max(rowHeight, piece.height);
  }
  return { nodes: positioned, edges: base.edges, adjacency: base.adjacency, incident: base.incident, width,
    height: Math.max(240, y + rowHeight + padding), groups };
}

/** Directed circle-to-circle routes with separate curves for repeated assertions. */
export function routeNetworkEdges(scene) {
  const byId = new Map(scene.nodes.map(node => [node.id, node])), pairs = new Map(), result = new Map();
  const edges = [...scene.edges].sort((a, b) => compare(a.id, b.id));
  for (const edge of edges) {
    const key = JSON.stringify([edge.source, edge.target].sort(compare));
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key).push(edge);
  }
  for (const group of pairs.values()) {
    const usedOffsets = new Set();
    group.forEach((edge, index) => {
    const source = byId.get(edge.source), target = byId.get(edge.target);
    if (!source || !target) throw new Error(`Network edge ${edge.id} has a missing endpoint.`);
    const sr = (source.radius ?? DOT_RADIUS) + 2, tr = (target.radius ?? DOT_RADIUS) + 5;
    let start, end, path;
    if (source.id === target.id) {
      const reach = 29 + index * 10, angle = Math.PI / 4;
      start = { x: source.x - Math.cos(angle) * sr, y: source.y - Math.sin(angle) * sr };
      end = { x: source.x + Math.cos(angle) * tr, y: source.y - Math.sin(angle) * tr };
      path = `M${start.x},${start.y} C${source.x - reach},${source.y - reach} ${source.x + reach},${source.y - reach} ${end.x},${end.y}`;
    } else {
      const distance = between(source, target), ux = (target.x - source.x) / distance, uy = (target.y - source.y) / distance;
      const sign = compare(source.id, target.id) < 0 ? 1 : -1;
      const initialOffset = (index - (group.length - 1) / 2) * Math.min(72, distance * .4);
      const obstacles = scene.nodes.filter(node => node.id !== source.id && node.id !== target.id && (!source.groupId || node.groupId === source.groupId));
      const bounds = scene.groups?.find(panel => panel.id === source.groupId);
      const candidate = offset => {
        const control = { x: (source.x + target.x) / 2 - uy * offset * sign, y: (source.y + target.y) / 2 + ux * offset * sign };
        const a = between(source, control), b = between(target, control);
        return {
          control,
          start: { x: source.x + (control.x - source.x) / a * sr, y: source.y + (control.y - source.y) / a * sr },
          end: { x: target.x + (control.x - target.x) / b * tr, y: target.y + (control.y - target.y) / b * tr },
        };
      };
      const isClear = curve => {
        let previous = curve.start;
        for (let step = 1; step <= 96; step++) {
          const t = step / 96, u = 1 - t;
          const point = { x: u * u * curve.start.x + 2 * u * t * curve.control.x + t * t * curve.end.x,
            y: u * u * curve.start.y + 2 * u * t * curve.control.y + t * t * curve.end.y };
          if (bounds && (point.x < bounds.x + 8 || point.x > bounds.x + bounds.width - 8 || point.y < bounds.y + 40 || point.y > bounds.y + bounds.height - 8)) return false;
          const dx = point.x - previous.x, dy = point.y - previous.y, lengthSquared = dx * dx + dy * dy;
          for (const node of obstacles) {
            const fraction = Math.max(0, Math.min(1, ((node.x - previous.x) * dx + (node.y - previous.y) * dy) / lengthSquared));
            if (Math.hypot(previous.x + fraction * dx - node.x, previous.y + fraction * dy - node.y) < (node.radius ?? DOT_RADIUS) + 4) return false;
          }
          previous = point;
        }
        return true;
      };
      let curve = null;
      // A curve through another dot would imply a relationship that is not in
      // the evidence. Deflect only those links, using a stable bounded search.
      for (let attempt = 0; attempt <= 320; attempt++) {
        const adjustment = attempt ? Math.ceil(attempt / 2) * 8 * (attempt % 2 ? 1 : -1) : 0;
        const offset = initialOffset + adjustment;
        if (usedOffsets.has(offset.toFixed(6))) continue;
        const proposed = candidate(offset);
        if (isClear(proposed)) { curve = proposed; usedOffsets.add(offset.toFixed(6)); break; }
      }
      if (!curve) throw new Error(`No clear network route for ${edge.id}; refusing to draw a false connection.`);
      ({ start, end } = curve);
      path = `M${start.x},${start.y} Q${curve.control.x},${curve.control.y} ${end.x},${end.y}`;
    }
    result.set(edge.id, { path, start, end });
    });
  }
  return new Map([...result].sort((a, b) => compare(a[0], b[0])));
}
