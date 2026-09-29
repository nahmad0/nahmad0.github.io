import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {snapshot,eventIndex,duration,validateIncident,visibleInView,alertsThrough} from '../src/model.js';
const data=JSON.parse(readFileSync(new URL('../src/incident.json',import.meta.url)));
test('every historical event and visual state resolves to valid records',()=>assert.deepEqual(validateIncident(data),[]));
test('scrubbing backwards reconstructs the earlier state without leaked compromise',()=>{
  const later=snapshot(data,132);assert(later.affected.has('cluster'));
  const earlier=snapshot(data,0);assert.equal(earlier.affected.size,0);assert.deepEqual([...earlier.paths],['task']);
});
test('playhead endpoints and event transitions are deterministic',()=>{
  assert.equal(eventIndex(data,-20),0);assert.equal(eventIndex(data,11.99),0);assert.equal(eventIndex(data,12),1);
  assert.equal(eventIndex(data,duration(data)),data.events.length-1);assert.equal(eventIndex(data,Infinity),data.events.length-1);
  assert.equal(snapshot(data,duration(data)).activeAgents,0);
});
test('uncertain and disclosure dates are not represented as exact detection timestamps',()=>{
  assert.equal(data.events.find(e=>e.id==='hf-detection').datePrecision,'unknown');
  assert.equal(data.events.find(e=>e.id==='hf-contain').datePrecision,'report-date');
});
test('reference validation rejects missing assets and nonexistent provenance',()=>{
  const broken=structuredClone(data);broken.events[0].focus='missing';broken.events[0].sources=['unknown'];
  assert.equal(validateIncident(broken).length,2);
});
test('view membership comes from incident data rather than fixed system identifiers',()=>{
  const custom={views:[{id:'custom',members:['other-worker']}]};
  assert(visibleInView(custom,'custom','other-worker'));assert(!visibleInView(custom,'custom','worker'));
});
test('SOC observations follow the playhead backwards and resolve connection endpoints',()=>{
  assert.equal(alertsThrough(data,0).length,1);assert.equal(alertsThrough(data,132).length,12);
  const a=alertsThrough(data,132).at(-1);assert.equal(a.source,'worker');assert.equal(a.destination,'cluster');assert(a.synthetic);
  assert.equal(alertsThrough(data,0).length,1);
});
test('validation detects invalid view and alert references',()=>{
  const broken=structuredClone(data);broken.views[0].members=['absent'];broken.alerts[0].destination='absent';
  assert.equal(validateIncident(broken).length,2);
});
test('room geometry rejects nonterminating or excessive floor generation',()=>{
  const broken=structuredClone(data);broken.environment.floor.step=0;
  assert(validateIncident(broken).includes('Invalid environment floor'));
  broken.environment.floor.step=.001;assert(validateIncident(broken).includes('Invalid environment floor'));
});
test('individual simulated agents differ and reset on backwards seek',()=>{
  const board=snapshot(data,12);assert.equal(board.agentStates.find(a=>a.actorId==='a2').status,'EXPLORING');assert.equal(board.agentStates.find(a=>a.actorId==='a3').status,'NORMAL');
  const initial=snapshot(data,0);assert(initial.agentStates.every(a=>a.status==='NORMAL'));
  assert.equal(snapshot(data,60).activeAgents,0);assert.equal(snapshot(data,72).activeAgents,3);
});
test('agent state validation rejects duplicate or missing actor assignments',()=>{
  const broken=structuredClone(data);broken.events[0].agentStates[1].actorId='a1';assert(validateIncident(broken).includes('Invalid agent state setup'));
});
test('drilldown asset references are validated',()=>{
  const broken=structuredClone(data);broken.drilldowns.kubernetes.items[0].asset='absent';
  assert(validateIncident(broken).includes('Invalid drilldown item job'));
});
