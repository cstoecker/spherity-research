(()=>{
  const root=document.getElementById('robot-evidence-explorer');
  const data=JSON.parse(document.getElementById('reg-data').textContent);
  const graph=root.querySelector('#reg-graph'), picker=root.querySelector('#reg-node'), lensPicker=root.querySelector('#reg-domain'), statusPicker=root.querySelector('#reg-status');
  const nodes=new Map(data.nodes.map(n=>[n.id,n]));
  const kind={entity:['●','Object / service'],document:['▤','Source document'],assertion:['◆','Assertion'],certificate:['⬡','Certificate'],event:['◇','Event'],policy:['▱','Rule / profile']};
  const short={S01:['Actuator','A17'],S02:['Firmware','FW3.2'],S03:['SBOM','SB04'],S04:['Materials','MD2'],L01:['Test claim','TA42'],L02:['Test report','TR42'],L03:['Method','TM1'],L04:['Lab scope','LC7'],L05:['Status event','RS9'],M01:['Humanoid','H-01'],M02:['Configuration','R3'],M03:['Task','TP-PICK'],M04:['Release claim','RC3'],M05:['Rule','AR1'],M06:['AI service','AS1'],O01:['Installed','IC3'],O02:['Maintenance','ME5'],O03:['Delivery','DE7'],O04:['Work order','WO9'],META1:['Meaning','SP1'],META2:['Discovery','CAT1'],META3:['Trust / status','TB1']};
  const state={node:'M02',domain:'all',status:'withdrawn'};
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  data.nodes.forEach(n=>{const o=document.createElement('option');o.value=n.id;o.textContent=n.title;picker.append(o)});
  data.domains.forEach(d=>{const o=document.createElement('option');o.value=d.id;o.textContent=d.name;lensPicker.append(o)});

  // UI selections are ephemeral; this demonstration stores no visitor data.
  function walk(start,reverse=false){const seen=new Set(),todo=[start];while(todo.length){const v=todo.shift();for(const [a,b]of data.dependency_projection){const from=reverse?b:a,to=reverse?a:b;if(from===v&&!seen.has(to)&&to!==start){seen.add(to);todo.push(to)}}}return seen}
  function select(id){state.node=id;render()}
  function render(){
    const active=document.activeElement;
    const restoreNode=root.contains(active) ? active.dataset.node : null;
    const restoreRelation=root.contains(active) ? active.dataset.relation : null;
    picker.value=state.node;lensPicker.value=state.domain;statusPicker.value=state.status;
    const selected=nodes.get(state.node),lens=data.domains.find(d=>d.id===state.domain),allowed=new Set(lens.nodes),supports=walk(state.node),impacts=walk(state.node,true);
    // Subject lookup includes assertions about the selected configuration, then follows their support.
    data.edges.filter(e=>e.target===state.node&&e.relation==='tests').forEach(e=>{supports.add(e.source);for(const id of walk(e.source))if(id!==state.node)supports.add(id)});
    const width=Math.max(220,Math.floor(graph.getBoundingClientRect().width)),cols=width>=820?4:2,gap=18,lane=(width-gap*(cols-1))/cols;
    const metaHeight=104,top=metaHeight+42,rowHeight=98,laneHeight=6*rowHeight+92;
    const height=metaHeight+32+Math.ceil(4/cols)*laneHeight;
    graph.style.height=height+'px';graph.replaceChildren();
    const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('class','reg-svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('aria-hidden','true');
    svg.innerHTML='<defs><marker id="reg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>';
    graph.append(svg);
    function rect(x,y,w,h,dashed){const r=document.createElementNS(ns,'rect');for(const[k,v]of Object.entries({x,y,width:w,height:h,rx:5,fill:'none',stroke:'var(--border)','stroke-width':1,...(dashed?{'stroke-dasharray':'5 4'}:{})}))r.setAttribute(k,v);svg.append(r)}
    function path(d,color,width=1,opacity=1,dashed=false){const p=document.createElementNS(ns,'path');for(const[k,v]of Object.entries({d,fill:'none',stroke:color,'stroke-width':width,opacity,'marker-end':'url(#reg-arrow)',...(dashed?{'stroke-dasharray':'4 4'}:{})}))p.setAttribute(k,v);svg.append(p);return p}
    const pos=new Map();
    data.groups.forEach((g,idx)=>{
      const gx=(idx%cols)*(lane+gap),gy=top+Math.floor(idx/cols)*laneHeight;
      rect(gx,gy,lane,laneHeight-24,true);
      const caption=document.createElement('div');caption.className='reg-caption text-small';caption.style.left=(gx+10)+'px';caption.style.top=(gy+10)+'px';caption.style.width=(lane-20)+'px';caption.textContent=g.short;graph.append(caption);
      data.nodes.filter(n=>n.group===g.id).forEach((n,row)=>pos.set(n.id,{x:gx+18,y:gy+53+row*rowHeight,w:lane-36,h:80,col:idx%cols,band:Math.floor(idx/cols)}));
      const mid=width/2;const rail=gx+lane-5;path(`M ${mid} ${metaHeight-4} L ${mid} ${top-12} L ${rail} ${top-12} L ${rail} ${gy-8} L ${gx+lane/2} ${gy-8} L ${gx+lane/2} ${gy+2}`,selected.group==='G'?'var(--viz-series-1)':'var(--border)',1,1,true);
    });
    const metas=data.nodes.filter(n=>n.group==='G');metas.forEach((n,i)=>{
      pos.set(n.id,{x:i*width/3+4,y:10,w:width/3-8,h:72,col:i,band:-1});
      // Join each shared metadata role to the rail serving all four participants.
      // These dashed links are architecture roles, not extra typed model edges.
      path(`M ${(i+.5)*width/3} 82 L ${(i+.5)*width/3} ${metaHeight-4} L ${width/2} ${metaHeight-4}`,'var(--border)',1,1,true);
    });
    const desc=document.createElement('div');desc.className='reg-caption text-small';desc.style.left='6px';desc.style.top='86px';desc.textContent='Shared meaning · discovery · trust/status serve every participant';graph.append(desc);
    const ordered=data.edges.map((e,i)=>({e,i})).sort((a,b)=>(+(a.e.source===state.node||a.e.target===state.node))-(+(b.e.source===state.node||b.e.target===state.node)));
    for(const {e,i}of ordered){
      const a=pos.get(e.source),b=pos.get(e.target);if(!a||!b)continue;
      let color='var(--border)',op=0.45,sw=1;
      if((supports.has(e.source)||e.source===state.node)&&(supports.has(e.target)||e.target===state.node)){color='var(--viz-series-1)';op=0.9;sw=2}
      if((impacts.has(e.source)||e.source===state.node)&&(impacts.has(e.target)||e.target===state.node)){color='var(--viz-series-2)';op=0.85;sw=2}
      if(e.source===state.node||e.target===state.node){op=1;sw=2.5;}
      if(state.domain!=='all'&&(!allowed.has(e.source)||!allowed.has(e.target)))op=0.16;
      const same=a.col===b.col&&a.band===b.band,right=b.x>a.x;
      let d;
      if(same){const x=Math.max(a.x+a.w,b.x+b.w)+8+(i%2)*3;d=`M ${a.x+a.w} ${a.y+a.h/2} L ${x} ${a.y+a.h/2} L ${x} ${b.y+b.h/2} L ${b.x+b.w} ${b.y+b.h/2}`;}
      else {const ax=right?a.x+a.w:a.x,bx=right?b.x:b.x+b.w,ay=a.y+a.h/2,by=b.y+b.h/2;const offset=(i%3-1)*4;const rail=Math.min(a.y,b.y)-15+offset;const ex=ax+(right?10:-10),en=bx+(right?-10:10);d=`M ${ax} ${ay} L ${ex} ${ay} L ${ex} ${rail} L ${en} ${rail} L ${en} ${by} L ${bx} ${by}`;}
      const p=path(d,color,sw,op);const title=document.createElementNS(ns,'title');title.textContent=nodes.get(e.source).label+' '+e.relation+' '+nodes.get(e.target).label;p.append(title);
    }
    for(const n of data.nodes){
      const p=pos.get(n.id),wrap=document.createElement('div');wrap.className='reg-node-wrap';if(supports.has(n.id))wrap.dataset.support='true';if(impacts.has(n.id))wrap.dataset.impact='true';Object.assign(wrap.style,{left:p.x+'px',top:p.y+'px',width:p.w+'px',height:p.h+'px'});
      const button=document.createElement('button');button.type='button';button.className='btn btn-block';button.setAttribute('aria-pressed',String(n.id===state.node));button.setAttribute('aria-label',n.title+'; '+kind[n.type][1]+'; '+n.owner);button.dataset.node=n.id;
      if(state.domain!=='all'&&!allowed.has(n.id)&&n.group!=='G')wrap.style.opacity='0.45';
      const label=short[n.id];const first=width<620&&n.id==='M02'?'Config.':label[0];
      button.innerHTML=`<span class="reg-mark" aria-hidden="true">${kind[n.type][0]}</span>${escape(first)}<br>${escape(label[1])}`;
      button.addEventListener('click',()=>select(n.id));wrap.append(button);graph.append(wrap);
    }
    const outcome=state.status==='withdrawn'?'HOLD · TR42 withdrawn; RC3 and work order WO9 require reassessment':'REVIEW · TR42 available; applicability, issuer acceptance and local approval still required';
    const count=selected.group==='G'?'Metadata supports all four participants':`${supports.size} linked support records · ${impacts.size} potentially affected records`;
    const direct=data.edges.filter(e=>e.source===state.node||e.target===state.node).slice(0,3).map(e=>`${escape(nodes.get(e.source).label)} —${escape(e.relation)}→ ${escape(nodes.get(e.target).label)}`).join('<br>');
    root.querySelector('#reg-detail').innerHTML=`<div><strong>${escape(selected.title)}</strong> · ${kind[selected.type][1]} · ${escape(selected.owner)}</div><div class="reg-stats text-small">${count}</div><div class="reg-stats text-small">${direct}</div><div class="reg-stats">${outcome}</div>`;
    const related=data.edges.filter(e=>e.source===state.node||e.target===state.node);
    root.querySelector('#reg-evidence').innerHTML=`<dl class="reg-fields"><dt>Claim / meaning</dt><dd>${escape(selected.claim)}</dd><dt>Version / source</dt><dd>${escape(selected.version)} · ${escape(selected.source_kind)}</dd><dt>Limits</dt><dd>${escape(selected.limit)}</dd><dt>Proof / authority</dt><dd>${escape(selected.signature)}</dd><dt>Permission</dt><dd>${escape(selected.access)}</dd><dt>Current status</dt><dd>${selected.id==='L02'||selected.id==='L05'?(state.status==='withdrawn'?'TR42 withdrawn in the simulated current status':'TR42 available in this alternative scenario'):'Illustrative; no independent validation'}</dd></dl><div class="reg-relations"></div><div class="text-small reg-stats">Relationship arrows keep their original meaning. Dependency counts use the declared teaching projection; they are not proof of causation or automatic legal invalidation.</div>`;
    const rel=root.querySelector('.reg-relations');related.forEach(e=>{const other=e.source===state.node?e.target:e.source;const b=document.createElement('button');b.className='btn';b.type='button';b.innerHTML=escape(nodes.get(e.source).label)+'<br>↓ '+escape(e.relation)+'<br>'+escape(nodes.get(e.target).label);b.dataset.relation=e.source+'-'+e.relation+'-'+e.target;b.onclick=()=>select(other);rel.append(b)});
    root.querySelector('#reg-lens').innerHTML=`<div class="reg-domain-title">${escape(lens.name)} · ${escape(lens.question)}</div><div class="text-small">${escape(lens.scope)} ${lens.url?`<a href="${lens.url}" target="_blank" rel="noopener noreferrer">Primary legal / standards source</a>`:''}</div>`;
    root.dataset.ready='true';
    if(restoreNode)root.querySelector('[data-node="'+CSS.escape(restoreNode)+'"]')?.focus({preventScroll:true});
    if(restoreRelation){const next=root.querySelector('[data-relation="'+CSS.escape(restoreRelation)+'"]')||picker;next.focus({preventScroll:true});}
  }
  picker.onchange=()=>select(picker.value);lensPicker.onchange=()=>{state.domain=lensPicker.value;render()};statusPicker.onchange=()=>{state.status=statusPicker.value;render()};
  let lastWidth=0;new ResizeObserver(()=>{const w=Math.floor(graph.getBoundingClientRect().width);if(w!==lastWidth){lastWidth=w;render()}}).observe(graph);
  root.hidden=false;
  document.getElementById('reg-loading').hidden=true;
  render();
})();
