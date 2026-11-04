const compareId = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const direction = side => side === 'right' ? 1 : -1;
const STEM = 18, CORNER = 7;

/**
 * Route directed assertions without changing their endpoints or topology.
 * A card's incoming and outgoing connectors share deterministic side ports.
 * The target gap leaves the arrow tip visible outside the card's border.
 */
export function routeGraphEdges(scene) {
  const nodes = new Map(scene.nodes.map(node => [node.id, node]));
  const edges = [...scene.edges].sort((a, b) => compareId(a.id, b.id));
  const ports = new Map();
  const routes = new Map();

  for (const edge of edges) {
    const source = nodes.get(edge.source), target = nodes.get(edge.target);
    if (!source || !target) throw new Error(`Graph connector ${edge.id} has a missing endpoint.`);
    const sameLane = source.layer === target.layer;
    const sourceSide = sameLane || target.x > source.x ? 'right' : 'left';
    const targetSide = sameLane || target.x < source.x ? 'right' : 'left';
    const route = { source, target, sourceSide, targetSide, sameLane };
    routes.set(edge.id, route);
    for (const [role, node, other, side] of [
      ['source', source, target, sourceSide], ['target', target, source, targetSide],
    ]) {
      const key = JSON.stringify([node.id, side]);
      if (!ports.has(key)) ports.set(key, []);
      ports.get(key).push({ edgeId: edge.id, role, node, otherY: other.y, sameLane, side });
    }
  }

  for (const members of ports.values()) {
    // Reverse the order for right-side return loops so nested links can share
    // a card without their stems crossing. Cross-lane ports follow neighbour y.
    const orderY = port => port.sameLane ? 2 * port.node.y - port.otherY : port.otherY;
    members.sort((a, b) => orderY(a) - orderY(b) || compareId(a.edgeId, b.edgeId) || compareId(a.role, b.role));
    const node = members[0].node;
    const spacing = members.length > 1 ? Math.min(12, Math.max(0, node.height - 32) / (members.length - 1)) : 0;
    members.forEach((port, index) => {
      const gap = port.role === 'source' ? 2 : 5;
      routes.get(port.edgeId)[port.role === 'source' ? 'start' : 'end'] = {
        x: node.x + direction(port.side) * (node.width / 2 + gap),
        y: node.y + (index - (members.length - 1) / 2) * spacing,
      };
    });
  }

  const laneLoops = new Map();
  for (const edge of edges) {
    const route = routes.get(edge.id);
    if (!route.sameLane) continue;
    if (!laneLoops.has(route.source.layer)) laneLoops.set(route.source.layer, []);
    laneLoops.get(route.source.layer).push({ id: edge.id, route,
      low: Math.min(route.start.y, route.end.y) - CORNER,
      high: Math.max(route.start.y, route.end.y) + CORNER });
  }
  for (const members of laneLoops.values()) {
    members.sort((a, b) => a.low - b.low || b.high - a.high || compareId(a.id, b.id));
    const occupied = [];
    for (const member of members) {
      let track = occupied.findIndex(until => until < member.low);
      if (track === -1) track = occupied.length;
      occupied[track] = member.high; member.track = track;
    }
    const right = Math.max(...members.flatMap(({ route }) => [route.source.x + route.source.width / 2, route.target.x + route.target.width / 2]));
    const nextCard = Math.min(Infinity, ...scene.nodes.filter(node => node.x > members[0].route.source.x).map(node => node.x - node.width / 2));
    const minimum = right + 5 + STEM + CORNER;
    const maximum = Math.min(scene.width - 8, right + 88, nextCard - 12);
    const step = occupied.length > 1 ? Math.min(8, (maximum - minimum) / (occupied.length - 1)) : 0;
    for (const member of members) {
      // Earlier/longer loops use the outer tracks; disjoint vertical spans can
      // reuse a track, but overlapping spans never collapse onto the same line.
      member.route.trackX = minimum + (occupied.length - member.track - 1) * step;
    }
  }
  const outerEdges = edges.filter(edge => {
    const route = routes.get(edge.id);
    return !route.sameLane && Math.abs(route.target.x - route.source.x) > scene.width / 3 + 1;
  });
  const outerRows = new Map(outerEdges.map((edge, index) => [edge.id, outerEdges.length > 1 ? 8 + index * 8 / (outerEdges.length - 1) : 8]));
  const result = new Map();
  for (const edge of edges) {
    const { source, target, sourceSide, targetSide, sameLane, start, end, trackX } = routes.get(edge.id);
    let path;
    if (sameLane) {
      const vertical = Math.sign(end.y - start.y) || 1, radius = Math.min(CORNER, Math.abs(end.y - start.y) / 2);
      path = `M${start.x},${start.y} L${trackX - radius},${start.y}`
        + ` Q${trackX},${start.y} ${trackX},${start.y + vertical * radius}`
        + ` L${trackX},${end.y - vertical * radius}`
        + ` Q${trackX},${end.y} ${trackX - radius},${end.y} L${end.x},${end.y}`;
    } else if (Math.abs(target.x - source.x) > scene.width / 3 + 1) {
      // The top corridor keeps outer-lane links clear of all middle-lane cards.
      const dir = direction(sourceSide), routeY = outerRows.get(edge.id), radius = CORNER;
      const exit = start.x + dir * 32, entry = end.x - dir * 32;
      path = `M${start.x},${start.y} L${exit - dir * radius},${start.y}`
        + ` Q${exit},${start.y} ${exit},${start.y - radius} L${exit},${routeY + radius}`
        + ` Q${exit},${routeY} ${exit + dir * radius},${routeY}`
        + ` L${entry - dir * radius},${routeY} Q${entry},${routeY} ${entry},${routeY + radius}`
        + ` L${entry},${end.y - radius} Q${entry},${end.y} ${entry + dir * radius},${end.y} L${end.x},${end.y}`;
    } else {
      const dir = direction(sourceSide), departure = start.x + dir * STEM, arrival = end.x - dir * STEM;
      const bend = Math.max(8, Math.abs(arrival - departure) * .45);
      path = `M${start.x},${start.y} L${departure},${start.y}`
        + ` C${departure + dir * bend},${start.y} ${arrival - dir * bend},${end.y} ${arrival},${end.y} L${end.x},${end.y}`;
    }
    result.set(edge.id, { path, start, end, sourceSide, targetSide });
  }
  return result;
}
