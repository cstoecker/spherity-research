import { layerOf } from './model.js';
import { semanticBadges } from './semantic-profiles.js';

export const GRAPH_LANES = Object.freeze([
  Object.freeze({ id: 'legal', label: 'Regulation & policy', description: 'Laws, provisions, requirements and policy records.' }),
  Object.freeze({ id: 'standards', label: 'Standards & specifications', description: 'Standards, specifications, vocabularies and committees.' }),
  Object.freeze({ id: 'ecosystems', label: 'Ecosystems & implementation', description: 'Initiatives, organisations, pilots and reports.' }),
]);

const compareText = (a, b) => {
  const left = String(a).normalize('NFKD').toLowerCase();
  const right = String(b).normalize('NFKD').toLowerCase();
  return left < right ? -1 : left > right ? 1 : 0;
};
const compareNodes = (a, b) => compareText(a.label || a.id, b.label || b.id) || compareText(a.id, b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function wrapLabel(value) {
  const maxCharacters = 24;
  const words = String(value).trim().split(/\s+/).filter(Boolean).flatMap(word => {
    const characters = [...word];
    return Array.from({ length: Math.ceil(characters.length / maxCharacters) }, (_, index) => characters.slice(index * maxCharacters, (index + 1) * maxCharacters).join(''));
  });
  const lines = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last && [...`${last} ${word}`].length <= maxCharacters) lines[lines.length - 1] += ` ${word}`;
    else lines.push(word);
  }
  const labelTruncated = lines.length > 3;
  const labelLines = lines.slice(0, 3);
  if (labelTruncated) labelLines[2] = [...labelLines[2]].slice(0, maxCharacters - 1).join('').trimEnd() + '…';
  return { labelLines, labelTruncated };
}

/**
 * Deterministic display geometry for graphData output. Taxonomy lanes are not a
 * causal sequence. x/y locate card centres; lane x locates its left edge.
 * Degree counts incident coded edges, including parallel assertions. Adjacency
 * is undirected for neighbourhood inspection; edge source/target stay directed.
 * Labels use 20px line spacing at approximately 16px type. The original label is
 * retained in full for the renderer's title/tooltip when three lines truncate it.
 */
export function layoutGraph(nodes, edges, options = {}) {
  const width = Math.max(1080, Number.isFinite(options.width) ? Math.ceil(options.width) : 1080);
  const laneWidth = width / GRAPH_LANES.length;
  const cardWidth = 260;
  const topPadding = 24;
  const cardGap = 24;
  const bottomPadding = 32;
  const sortedNodes = [...nodes].sort(compareNodes);
  const byId = new Map();
  for (const node of sortedNodes) {
    if (typeof node.id !== 'string' || !node.id || byId.has(node.id)) throw new Error('Graph layout requires unique nonempty node IDs.');
    byId.set(node.id, node);
  }
  const sortedEdges = [...edges].sort((a, b) => compareText(a.id, b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const adjacency = new Map(sortedNodes.map(node => [node.id, new Set()]));
  const incident = new Map(sortedNodes.map(node => [node.id, new Set()]));
  const endpointCount = new Map(sortedNodes.map(node => [node.id, 0]));
  const edgeIds = new Set();
  for (const edge of sortedEdges) {
    if (typeof edge.id !== 'string' || !edge.id || edgeIds.has(edge.id)) throw new Error('Graph layout requires unique nonempty edge IDs.');
    if (!byId.has(edge.source) || !byId.has(edge.target)) throw new Error(`Graph edge ${edge.id} has an endpoint outside the visible nodes.`);
    edgeIds.add(edge.id);
    adjacency.get(edge.source).add(edge.target);
    adjacency.get(edge.target).add(edge.source);
    incident.get(edge.source).add(edge.id);
    incident.get(edge.target).add(edge.id);
    endpointCount.set(edge.source, endpointCount.get(edge.source) + 1);
    endpointCount.set(edge.target, endpointCount.get(edge.target) + 1);
  }

  // Connected components give a stable coarse grouping without force simulation
  // or new semantic relationships. Separate records remain visible after them.
  const visited = new Set();
  const components = [];
  for (const node of sortedNodes) {
    if (visited.has(node.id) || !incident.get(node.id).size) continue;
    const members = [];
    const pending = [node.id];
    visited.add(node.id);
    while (pending.length) {
      const id = pending.pop();
      members.push(byId.get(id));
      for (const neighbour of adjacency.get(id)) {
        if (!visited.has(neighbour)) { visited.add(neighbour); pending.push(neighbour); }
      }
    }
    members.sort(compareNodes);
    components.push(members);
  }
  components.sort((a, b) => b.length - a.length || compareNodes(a[0], b[0]));
  const componentOrder = new Map();
  const componentIds = new Map();
  components.forEach((members, index) => members.forEach(node => {
    componentOrder.set(node.id, index);
    componentIds.set(node.id, members[0].id);
  }));

  const positionedNodes = [];
  let height = 240;
  const lanes = GRAPH_LANES.map((lane, index) => {
    const members = sortedNodes.filter(node => layerOf(node) === lane.id).sort((a, b) => {
      const aComponent = componentOrder.get(a.id) ?? Infinity;
      const bComponent = componentOrder.get(b.id) ?? Infinity;
      return (aComponent === bComponent ? 0 : aComponent < bComponent ? -1 : 1) || compareNodes(a, b);
    });
    let top = topPadding;
    for (const node of members) {
      const { labelLines, labelTruncated } = wrapLabel(node.label || node.id);
      const badges = semanticBadges(node.id);
      const semanticFooterHeight = badges.length ? 30 : 0;
      const degree = incident.get(node.id).size;
      const contentHeight = Math.max(72, 48 + labelLines.length * 20) + semanticFooterHeight;
      // Busy records need enough perimeter for separate arrowheads even at
      // 75% zoom. A self relationship contributes two distinct connector ports.
      const cardHeight = Math.max(contentHeight, 32 + Math.max(0, endpointCount.get(node.id) - 1) * 12);
      positionedNodes.push({
        ...node, x: laneWidth * (index + 0.5), y: top + cardHeight / 2,
        width: cardWidth, height: cardHeight, labelLines, labelTruncated,
        semanticBadges: badges, semanticFooterHeight,
        layer: lane.id, degree, isolated: degree === 0,
        linkStatus: degree === 0 ? 'No visible links in this view' : `${degree} coded relationship${degree === 1 ? '' : 's'} in this view`,
        componentId: componentIds.get(node.id) || null,
      });
      top += cardHeight + cardGap;
    }
    if (members.length) height = Math.max(height, top - cardGap + bottomPadding);
    return { ...lane, x: index * laneWidth, width: laneWidth, count: members.length };
  });
  return { nodes: positionedNodes, edges: sortedEdges.map(edge => ({ ...edge })), width, height, lanes, adjacency, incident };
}
