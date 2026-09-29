export function duration(data) { const e=data.events.at(-1); return e.at+e.duration; }
export function eventIndex(data,time) {
  const t=Math.max(0,Math.min(duration(data),Number(time)||0));
  return Math.max(0,data.events.findLastIndex(e=>e.at<=t));
}
export function snapshot(data,time) {
  const index=eventIndex(data,time), event=data.events[index];
  return {index,event,lesson:data.lessons[event.lesson],logs:data.events.slice(0,index+1),
    time:Math.max(0,Math.min(duration(data),Number(time)||0)),
    agentStates:event.agentStates??[],
    activeAgents:event.agentStates?event.agentStates.filter(a=>!['TERMINATED','BLOCKED'].includes(a.status)).length:event.status==='TERMINATED'?0:data.actors.length,
    affected:new Set(event.affected),paths:new Set(event.paths)};
}
export function visibleInView(data,view,id) {const members=data.views?.find(v=>v.id===view)?.members;return !members||members.includes(id);}
export function alertsThrough(data,time) {const ids=new Set(snapshot(data,time).logs.map(e=>e.id));return (data.alerts??[]).filter(a=>ids.has(a.eventId));}
export function validateIncident(data) {
  const errors=[], unique=(items,name)=>{const ids=items.map(x=>x.id);if(new Set(ids).size!==ids.length) errors.push(`Duplicate ${name} id`);return new Set(ids);};
  const systems=unique(data.systems,'system'), sources=unique(data.sources,'source'), paths=unique(data.connections,'connection');
  unique(data.events,'event'); const actorIds=unique(data.actors,'actor');
  data.connections.forEach(c=>{if(!systems.has(c.from)||!systems.has(c.to))errors.push(`Invalid connection ${c.id}`);});
  data.actors.forEach(a=>{if(!systems.has(a.id))errors.push(`Actor without system ${a.id}`);});
  data.events.forEach((e,i)=>{
    if(!systems.has(e.focus))errors.push(`Invalid focus ${e.id}`);
    if(!e.sources.length||e.sources.some(s=>!sources.has(s)))errors.push(`Invalid source ${e.id}`);
    if(e.paths.some(p=>!paths.has(p))||e.affected.some(a=>!systems.has(a)))errors.push(`Invalid state ${e.id}`);
    if(!data.lessons[e.lesson])errors.push(`Invalid lesson ${e.id}`);
    if(e.agentStates){const ids=e.agentStates.map(a=>a.actorId);if(ids.length!==actorIds.size||new Set(ids).size!==ids.length||ids.some(id=>!actorIds.has(id))||e.agentStates.some(a=>a.synthetic!==true||!a.status||!a.objective||!a.access||!a.network||!a.risk))errors.push(`Invalid agent state ${e.id}`);}
    if(e.duration<=0||e.at<0||(i&&e.at!==data.events[i-1].at+data.events[i-1].duration))errors.push(`Invalid time ${e.id}`);
  });
  Object.entries(data.lessons).forEach(([id,l])=>{if(l.correct<0||l.correct>=l.answers.length)errors.push(`Invalid answer ${id}`);});
  const eventIds=new Set(data.events.map(e=>e.id));
  unique(data.views??[],'view');unique(data.alerts??[],'alert');
  for(const v of data.views??[]){
    if(v.members?.some(id=>!systems.has(id)))errors.push(`Invalid view membership ${v.id}`);
    if(v.kind==='scene'&&[v.camera,v.target].some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))))errors.push(`Invalid view camera ${v.id}`);
  }
  for(const a of data.alerts??[])if(!eventIds.has(a.eventId)||!systems.has(a.asset)||[a.source,a.destination].some(id=>id!==null&&!systems.has(id)))errors.push(`Invalid alert ${a.id}`);
  const floor=data.environment?.floor;
  for(const [view,detail] of Object.entries(data.drilldowns??{})){
    if(!data.views?.some(v=>v.id===view)||!detail.items?.length)errors.push(`Invalid drilldown ${view}`);
    for(const item of detail.items??[])if(!systems.has(item.asset)||!item.boundary||!item.permissions||!item.control)errors.push(`Invalid drilldown item ${item.id}`);
  }
  if(floor){const {minX,maxX,minZ,maxZ,step}=floor;
    if(![minX,maxX,minZ,maxZ,step].every(Number.isFinite)||step<=0||maxX<=minX||maxZ<=minZ||Math.ceil((maxX-minX)/step)*Math.ceil((maxZ-minZ)/step)>1000)errors.push('Invalid environment floor');
  }
  for(const z of data.environment?.zones??[])if(![z.x,z.z,z.width,z.depth,z.color].every(Number.isFinite)||z.width<=0||z.depth<=0)errors.push('Invalid environment zone');
  return errors;
}
