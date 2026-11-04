/** All views in a session read one named dataset edition. */
export async function loadAtlasData(fetchJson, release='current') {
  const historical=release==='0.1.0';
  const paths=historical
    ?['data/dataset.json','data/world-map.json','data/ecosystems.json','vendor/world.geojson','releases/0.1.0/views/timeline.json']
    :['data/current-dataset.json','data/current-world-map.json','data/current-ecosystems.json','vendor/world.geojson','data/current-timeline.json','data/current-regulatory-phases.json','data/current-regulatory-calendar.json'];
  const [dataset,map,taxonomy,world,timeline,regulatory,calendar]=await Promise.all(paths.map(fetchJson));
  return {dataset,map,taxonomy,world,timeline,historical,
    regulatory:regulatory||{id:'baseline-without-phase-overlay',checked_at:dataset.metadata.evidence_cutoff,review_status:'machine_assisted_unreviewed',profiles:[]},
    calendar:calendar||{version:'0.1.0',checked_at:dataset.metadata.evidence_cutoff,events:[]}};
}

export function timelineRows(model,records,kind='regulatory') {
  const ids=new Set(records.map(record=>record.id));
  const rows=kind==='regulatory'
    ?model.calendar.events.filter(event=>event.record_ids.some(id=>ids.has(id)))
    :model.timeline.filter(event=>ids.has(event.entity_id)).map((event,index)=>({id:event.id||`baseline-event-${index}`,record_ids:[event.entity_id],title:event.label,event_role:event.kind,status:'Recorded event',date:{precision:event.precision,value:event.date,condition:event.condition},observed_at:event.observed_at||model.entities.get(event.entity_id)?.status.as_of,summary:event.condition||'',caveats:[],sources:event.source_ids.map(id=>({source_id:id}))}));
  // Sort by the earliest stated period only. This is an ordering key, never a
  // new event date: the original year, quarter window and condition stay intact.
  const order=event=>{
    if(!event.date.value)return '9999-99-99';
    if(event.date.precision==='day')return event.date.value;
    if(event.date.precision==='month')return event.date.value+'-00';
    const quarters=[...`${event.date_label||''} ${event.date.condition||''}`.matchAll(/\bQ([1-4])/g)].map(match=>Number(match[1]));
    const month=quarters.length?(Math.min(...quarters)-1)*3+1:0;
    return `${event.date.value}-${String(month).padStart(2,'0')}-00`;
  };
  return [...rows].sort((a,b)=>order(a).localeCompare(order(b))||a.id.localeCompare(b.id));
}

export function timelinePrecisionLabel(event){
  if(event.date.precision==='conditional')return 'Conditional timing';
  if(event.date.precision==='unknown')return 'Date not fixed';
  if(/\bQ[1-4]/.test(`${event.date_label||''} ${event.date.condition||''}`))return 'Indicative planning window';
  return `${event.date.precision} precision`;
}
