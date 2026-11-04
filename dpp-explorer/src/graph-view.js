import {layoutNetwork, routeNetworkEdges} from './network-layout.js';
import {layoutGraph} from './graph-layout.js';
import {routeGraphEdges} from './graph-connectors.js';
import {human,currentAssertions} from './model.js';
import {semanticSummary} from './semantic-profiles.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors = {legal:'#0969da',standards:'#167a79',ecosystems:'#ad6f1a'};

// Coordinates and topology stay fixed while readers inspect a neighbourhood.
export function createGraphView({d3, model, onNode, onEdge}) {
  const svg=d3.select('#knowledge-graph'), stage=$('graph-stage'), tip=$('graph-tooltip'), tipHome=tip.parentElement;
  let expanded=false, mode='structured';
  let scene, nodes, links, emphasis, paths, selected='', assertion='', hovered=null, zoom=1, signature='';
  const fullDegree=new Map(model.records.map(n=>[n.id,0]));
  for(const a of currentAssertions(model.dataset))if(fullDegree.has(a.subject)&&fullDegree.has(a.object.entity_id)){
    fullDegree.set(a.subject,fullDegree.get(a.subject)+1);
    if(a.subject!==a.object.entity_id)fullDegree.set(a.object.entity_id,fullDegree.get(a.object.entity_id)+1);
  }
  const nodeById=id=>scene.nodes.find(n=>n.id===id);
  const edgeById=id=>scene.edges.find(e=>e.id===id);
  const isolation=n=>fullDegree.get(n.id)?'Connections are outside the current filters.':'No inter-record relationship is coded in this snapshot.';
  function hideTooltip(){tip.hidden=true;$('graph-hover-empty').hidden=false;svg.selectAll('[aria-describedby]').attr('aria-describedby',null);}
  function setExpanded(active){expanded=active;hideTooltip();hovered=null;paint();(expanded?$('graph-hover-panel'):tipHome).append(tip);tip.style.left='';tip.style.top='';}
  function endHover(event){if(expanded&&event&&['pointerleave','blur'].includes(event.type))return;hovered=null;hideTooltip();paint();}
  function tooltip(event,html){
    tip.innerHTML=html;tip.hidden=false;
    event.currentTarget.setAttribute('aria-describedby','graph-tooltip');
    if(expanded){$('graph-hover-empty').hidden=true;return;}
    const bounds=event.currentTarget.getBoundingClientRect(), box=tip.getBoundingClientRect();
    const x=event.type.startsWith('pointer')?event.clientX:bounds.right;
    const y=event.type.startsWith('pointer')?event.clientY:bounds.top;
    tip.style.left=Math.max(10,Math.min(x+18,innerWidth-box.width-10))+'px';
    tip.style.top=Math.max(10,Math.min(y+16,innerHeight-box.height-10))+'px';
  }
  function describeNode(event,n){
    hovered={kind:'node',id:n.id};paint();
    const related=scene.edges.filter(e=>e.source===n.id||e.target===n.id);
    const connectionList=related.slice(0,3).map(e=>{
      const outgoing=e.source===n.id, other=nodeById(outgoing?e.target:e.source);
      return `<li>${outgoing?'→':'←'} <b>${esc(human(e.assertion.predicate))}</b>: ${esc(other.label)}</li>`;
    }).join('');
    const semantics=model.historical?'':semanticSummary(n.id);
    tooltip(event,`<h3>${esc(n.label)}</h3><p>${esc(human(n.type))} · ${esc(human(n.status?.value))}</p><p>${scene.adjacency.get(n.id).size} connected records · ${related.length} sourced relationships in this view</p>${related.length?`<ul>${connectionList}</ul>${related.length>3?`<p>+ ${related.length-3} more. Select the record to inspect every assertion.</p>`:''}`:`<p>${esc(isolation(n))}</p>`}${semantics?`<p class="graph-semantic-summary">${esc(semantics)}</p><small>Read evidence for classification sources and qualifications.</small> `:''}<small>Human review pending · Select to pin; open evidence for sources and limitations.</small>`);
    $('graph-live').textContent=`${n.label}. ${scene.adjacency.get(n.id).size} connected records highlighted.`;
  }
  function describeEdge(event,e){
    hovered={kind:'edge',id:e.id};paint();
    tooltip(event,`<h3>${esc(human(e.assertion.predicate))}</h3><p>${e.assertion.assertion_type==='research_classification'?'Analytical classification / proposal':'Documentary or attributed claim'} · ${esc(e.assertion.id)}</p><p><b>${esc(nodeById(e.source).label)}</b> → <b>${esc(nodeById(e.target).label)}</b></p><p>${esc(e.assertion.statement)}</p><small>${e.assertion.source_ids.length} source${e.assertion.source_ids.length===1?'':'s'} · ${esc(human(e.assertion.review_status))}. Select for the qualified evidence.</small>`);
    $('graph-live').textContent=`${human(e.assertion.predicate)}. ${e.assertion.statement}`;
  }
  function paint(){
    if(!scene)return;
    const active=hovered||(selected?{kind:'node',id:selected}:assertion?{kind:'edge',id:assertion}:null);
    const activeNode=active?.kind==='node'?nodeById(active.id):null;
    const activeEdge=active?.kind==='edge'?edgeById(active.id):null;
    const relatedNodes=activeNode?scene.adjacency.get(activeNode.id):new Set(activeEdge?[activeEdge.source,activeEdge.target]:[]);
    const relatedEdges=activeNode?scene.incident.get(activeNode.id):new Set(activeEdge?[activeEdge.id]:[]);
    const hasActive=!!(activeEdge||(activeNode&&!activeNode.isolated));
    nodes.classed('selected',n=>n.id===selected).classed('is-active',n=>n.id===activeNode?.id)
      .classed('is-neighbor',n=>relatedNodes.has(n.id))
      .classed('is-dimmed',n=>hasActive&&n.id!==activeNode?.id&&!relatedNodes.has(n.id))
      .attr('aria-pressed',n=>String(n.id===selected));
    links.attr('aria-pressed',e=>String(e.id===assertion));
    links.select('.graph-edge').classed('selected',e=>e.id===assertion)
      .classed('is-active',e=>relatedEdges.has(e.id)).classed('is-dimmed',e=>hasActive&&!relatedEdges.has(e.id))
      .attr('marker-end',e=>hovered?.kind==='edge'&&hovered.id===e.id?'url(#graph-arrow-hover)':relatedEdges.has(e.id)?'url(#graph-arrow-active)':hasActive?'url(#graph-arrow-dimmed)':'url(#graph-arrow)');
    // Emphasis is a visual overlay; interactive links retain their keyboard order.
    emphasis.selectAll('path').data(scene.edges.filter(e=>relatedEdges.has(e.id)),e=>e.id).join('path')
      .attr('class','graph-edge graph-edge-emphasis is-active').attr('d',e=>paths.get(e.id).path).attr('stroke-dasharray',e=>e.assertion.assertion_type==='research_classification'?'6 5':null)
      .style('stroke',e=>hovered?.kind==='edge'&&hovered.id===e.id?'#075aa7':'#0969da')
      .style('stroke-width',e=>hovered?.kind==='edge'&&hovered.id===e.id?2.4:2.2)
      .attr('marker-end',e=>hovered?.kind==='edge'&&hovered.id===e.id?'url(#graph-arrow-hover)':'url(#graph-arrow-active)');
  }
  function selection(){
    const n=model.entities.get(selected),e=model.dataset.assertions.find(a=>a.id===assertion),bar=$('graph-selection');
    bar.hidden=!(n||e);if(bar.hidden){bar.innerHTML='';return;}
    bar.innerHTML=`<div><strong>${esc(n?n.label:human(e.predicate))}</strong><p>${n?'Selected record: its visible neighbours remain highlighted.':'Selected relationship: arrow direction follows subject → object.'}</p></div><div class="graph-selection-actions"><button data-graph-action="inspect">Read evidence ↓</button>${n&&!['Jurisdiction','Sector'].includes(n.type)?'<button data-graph-action="focus">Only these connections</button>':''}<button data-graph-action="clear">Clear selection ×</button></div>`;
  }
  function setZoom(value){
    zoom=Math.max(.75,Math.min(1.75,Math.round(value*100)/100));if(!scene)return;
    svg.style('width',scene.width*zoom+'px').style('height',scene.height*zoom+'px');
    // Match non-scaling stems: arrowheads retain the same screen size at every zoom.
    svg.selectAll('marker').attr('markerWidth',10/zoom).attr('markerHeight',8/zoom);
    $('graph-surface').style.width=scene.width*zoom+'px';$('graph-surface').style.minWidth=scene.width*zoom+'px';
    $('graph-lanes').style.minWidth=scene.width*zoom+'px';
    $('graph-zoom-label').textContent=Math.round(zoom*100)+'%';
    $('graph-minus').disabled=zoom<=.75;$('graph-plus').disabled=zoom>=1.75;
    hideTooltip();
  }
  function draw(data,nextMode='structured'){
    mode=nextMode;const network=mode==='network';
    const nextSignature=mode+':'+data.nodes.map(n=>n.id).sort().join('|');
    const changed=signature!==nextSignature;signature=nextSignature;
    scene=network?layoutNetwork(data.nodes,data.edges):layoutGraph(data.nodes,data.edges);if(model.historical)scene.nodes.forEach(n=>n.semanticBadges=[]);hovered=null;hideTooltip();svg.selectAll('*').remove();
    svg.attr('viewBox',`0 0 ${scene.width} ${scene.height}`);
    $('graph-panel').classList.toggle('is-network',network);
    $('graph-lanes').hidden=network;
    $('network-summary').hidden=!network;
    $('graph-stage').setAttribute('aria-label',network?'Scrollable network overview. Labelled dots show connected components and records with no visible links.':'Scrollable knowledge graph. Record categories are arranged in columns.');
    $('graph-learning').innerHTML=network?'Hover or focus a dot to highlight its neighbours and reveal its full name. Click to pin its evidence. <strong>Groups show recorded connections; hollow dots have no visible links.</strong>':'Hover or focus a record to highlight its connections. Click to pin a selection, then choose Read evidence for sources. <strong>The columns are record categories, not stages of progress.</strong>';
    $('graph-navigation-hint').textContent=network?'Scroll to explore clusters or jump to unconnected dots.':'Scroll across categories and down through records.';
    $('graph-summary').textContent=`${scene.nodes.length} ${scene.nodes.length===1?'RECORD':'RECORDS'} · ${scene.edges.length} SOURCED ${scene.edges.length===1?'RELATIONSHIP':'RELATIONSHIPS'}`;
    $('graph-lanes').innerHTML=(scene.lanes||[]).map(l=>`<div class="graph-lane" style="--lane-color:${colors[l.id]}"><h3>${esc(l.label)} <span>(${l.count})</span></h3><p>${esc(l.description)}</p></div>`).join('');
    const isolated=scene.nodes.filter(n=>n.isolated), outside=isolated.filter(n=>fullDegree.get(n.id)>0).length;
    const connectedGroups=network?scene.groups.filter(g=>g.kind==='connected'):[];
    if(network){
      $('network-summary-text').innerHTML=`<strong>${scene.nodes.length-isolated.length}</strong> connected records in <strong>${connectedGroups.length}</strong> ${connectedGroups.length===1?'group':'groups'} · <strong>${isolated.length}</strong> dots with no visible links`;
      $('network-isolated-jump').disabled=!isolated.length;
    }
    $('graph-isolation-note').textContent=`Arrows run from the statement’s subject to its object. ${network?'Hollow dots':'Dashed cards'} have no visible links: ${isolated.length-outside} ${isolated.length-outside===1?'has':'have'} no coded inter-record relationship${outside?`; ${outside} have connections outside the current filters`:''}. No link does not establish absence of a real-world relationship.`;
    const defs=svg.append('defs');
    // Arrow geometry is independent of line thickness, so selection never inflates it.
    for(const [id,color] of [['graph-arrow','#99adbe'],['graph-arrow-active','#0969da'],['graph-arrow-hover','#075aa7'],['graph-arrow-dimmed','#b9c7d2']]){
      defs.append('marker').attr('id',id).attr('markerUnits','userSpaceOnUse')
        .attr('viewBox','-1 -4 10 8').attr('refX',7.75).attr('refY',0)
        .attr('markerWidth',10/zoom).attr('markerHeight',8/zoom).attr('orient','auto').attr('overflow','visible')
        .append('path').attr('d','M0.7,-3.1 Q0,-3.5 0,-2.7 L0,2.7 Q0,3.5 0.7,3.1 L7.3,0.45 Q8.2,0 7.3,-0.45 Z').attr('fill',color).attr('stroke','none');
    }
    if(network){
      const groups=svg.append('g').attr('class','network-groups').selectAll('g').data(scene.groups).join('g').attr('class',g=>`network-group ${g.kind}`).attr('data-network-group',g=>g.id);
      groups.append('rect').attr('x',g=>g.x).attr('y',g=>g.y).attr('width',g=>g.width).attr('height',g=>g.height).attr('rx',14);
      groups.append('text').attr('x',g=>g.x+18).attr('y',g=>g.y+27).text(g=>`${g.label} · ${g.count}`);
    }
    paths=network?routeNetworkEdges(scene):routeGraphEdges(scene);
    links=svg.append('g').attr('class','graph-relationships').selectAll('g').data(scene.edges).join('g').attr('class','graph-link').attr('data-edge-id',e=>e.id).attr('role','button').attr('tabindex',0)
      .attr('aria-label',e=>`${nodeById(e.source).label} → ${human(e.assertion.predicate)} → ${nodeById(e.target).label}. Select for evidence.`)
      .on('pointerenter focus',describeEdge).on('pointerleave blur',endHover)
      .on('click',(event,e)=>{event.stopPropagation();onEdge(e.id);})
      .on('keydown',(event,e)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();onEdge(e.id);}if(event.key==='Escape')endHover();});
    links.append('path').attr('class',e=>`graph-edge${e.assertion.assertion_type==='research_classification'?' graph-edge-analysis':''}`).attr('stroke-dasharray',e=>e.assertion.assertion_type==='research_classification'?'6 5':null).attr('d',e=>paths.get(e.id).path);
    links.append('path').attr('class','graph-edge-hit').attr('d',e=>paths.get(e.id).path);
    emphasis=svg.append('g').attr('class','graph-emphasis').attr('aria-hidden','true').style('pointer-events','none');
    nodes=svg.append('g').attr('class','graph-records').selectAll('g').data(scene.nodes).join('g').attr('class',n=>`graph-node${network?' network-node':''}${n.isolated?' is-isolated':''}`)
      .attr('data-node-id',n=>n.id).attr('transform',n=>`translate(${n.x},${n.y})`).style('--node-color',n=>colors[n.layer])
      .attr('role','button').attr('tabindex',0).attr('aria-label',n=>`${n.label}. ${human(n.type)}. ${scene.adjacency.get(n.id).size} connected records in this view. ${model.historical?'':semanticSummary(n.id)} Select to pin.`)
      .on('pointerenter focus',describeNode).on('pointerleave blur',endHover)
      .on('click',(_,n)=>onNode(n.id)).on('keydown',(event,n)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();onNode(n.id);}if(event.key==='Escape')endHover();});
    if(network){
      nodes.append('rect').attr('class','network-label-back').attr('x',-64).attr('y',16).attr('width',128).attr('height',54).attr('rx',6);
      nodes.append('circle').attr('class','network-dot-ring').attr('r',13);
      nodes.append('circle').attr('class','network-dot').attr('r',n=>n.radius);
      nodes.each(function(n){
        const group=d3.select(this), label=group.append('text').attr('class','network-node-label').attr('text-anchor','middle').attr('x',0).attr('y',29);
        n.labelLines.forEach((line,i)=>label.append('tspan').attr('x',0).attr('dy',i?16:0).text(line));
        group.append('text').attr('class','network-semantic-symbols').attr('x',19).attr('y',5).text(n.semanticBadges.map(b=>b.symbol).join(' '));
      });
    }else{
    nodes.append('rect').attr('class','graph-card').attr('x',n=>-n.width/2).attr('y',n=>-n.height/2).attr('width',n=>n.width).attr('height',n=>n.height);
    nodes.append('text').attr('class','graph-node-type').attr('x',-114).attr('y',n=>-n.height/2+20).text(n=>human(n.type));
    nodes.each(function(n){
      const group=d3.select(this),label=group.append('text').attr('class','graph-node-label').attr('x',-114).attr('y',-n.height/2+42);
      n.labelLines.forEach((line,i)=>label.append('tspan').attr('x',-114).attr('dy',i?20:0).text(line));
      const badges=group.selectAll('.semantic-badge').data(n.semanticBadges).join('g')
        .attr('class',badge=>`semantic-badge tone-${badge.tone}`).attr('data-semantic-badge',badge=>badge.id)
        .attr('transform',(_,index)=>`translate(${-114+index*118},${n.height/2-30})`);
      badges.append('rect').attr('width',110).attr('height',22).attr('rx',5).attr('ry',5);
      badges.append('text').attr('x',7).attr('y',15).text(badge=>`${badge.symbol} ${badge.label}`);
      group.append('text').attr('class','graph-node-count').attr('text-anchor','end').attr('x',113).attr('y',-n.height/2+20).text(n.isolated?'○':`${scene.adjacency.get(n.id).size} ↔`);
    });
    }
    if(!scene.nodes.length)svg.append('text').attr('x',540).attr('y',100).attr('text-anchor','middle').text('No records match these filters. Reset filters to explore the graph.');
    setZoom(zoom);if(changed){stage.scrollTop=0;stage.scrollLeft=network&&scene.groups.length===1?Math.max(0,(scene.width*zoom-stage.clientWidth)/2):0;}paint();selection();
  }
  $('graph-plus').onclick=()=>setZoom(zoom+.25);$('graph-minus').onclick=()=>setZoom(zoom-.25);
  $('graph-reset').onclick=()=>{setZoom(1);stage.scrollTop=0;stage.scrollLeft=mode==='network'&&scene.groups.length===1?Math.max(0,(scene.width-stage.clientWidth)/2):0;endHover();};
  $('network-isolated-jump').onclick=()=>{const group=scene?.groups?.find(g=>g.kind==='isolated');if(!group)return;hideTooltip();stage.scrollTop=group.y*zoom;stage.scrollLeft=group.x*zoom;const first=scene.nodes.find(n=>n.isolated);if(first)document.querySelector(`[data-node-id="${CSS.escape(first.id)}"]`)?.focus({preventScroll:true});};
  stage.addEventListener('scroll',()=>{if(!expanded)hideTooltip();},{passive:true});window.addEventListener('resize',()=>{if(!expanded)hideTooltip();});
  return {draw,setExpanded,highlight(nodeId,edgeId){selected=nodeId;assertion=edgeId;paint();selection();},hideTooltip};
}
