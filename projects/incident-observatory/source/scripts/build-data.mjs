import { mkdirSync, writeFileSync } from 'node:fs';

// This authoring helper emits plain, portable incident JSON. No runtime execution or network calls.
const sources = [
  { id: 'oa', title: 'OpenAI retrospective', url: 'https://openai.com/index/hugging-face-incident-and-the-road-ahead/', published: '2026-08-26' },
  { id: 'report', title: 'OpenAI technical report', url: 'https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf', published: '2026-08-26' },
  { id: 'hf', title: 'Hugging Face technical reconstruction', url: 'https://huggingface.co/blog/agent-intrusion-technical-timeline' },
  { id: 'disclosure', title: 'Hugging Face disclosure', url: 'https://huggingface.co/blog/security-incident-july-2026', published: '2026-07-16' },
];
const systems = [
  ['a1','Agent 07','Evaluation sandbox','sandbox',-11,-4,'evaluation'],
  ['a2','Agent 12','Evaluation sandbox','sandbox',-11,0,'evaluation'],
  ['a3','Agent 23','Evaluation sandbox','sandbox',-11,4,'evaluation'],
  ['repo','Package service','Artifactory / shared artifacts','repository',-5,0,'research'],
  ['research','Research cluster','OpenAI research infrastructure','cluster',-5,6,'research'],
  ['egress','Egress boundary','Permitted package traffic','gateway',0,0,'internet'],
  ['relay','External launchpad','Customer app hosted on Modal','server',4,-4,'external'],
  ['api','Dataset interface','Hugging Face public interface','gateway',5,1,'external'],
  ['worker','Processing worker','Hugging Face production','server',10,0,'hf'],
  ['identity','Workload identity','Illustrative credential store','identity',10,5,'hf'],
  ['cluster','Worker cluster','Hugging Face internal systems','cluster',15,1,'hf'],
  ['soc','Security operations','Two organizations / combined view','soc',3,8,'defense'],
].map(([id,label,detail,type,x,z,zone]) => ({id,label,detail,type,position:[x,0,z],zone,synthetic:true}));
const connections = [
  ['task','a1','repo','Package access'],['peer','repo','a2','Shared artifact read'],['peer2','repo','a3','Shared artifact read'],
  ['exit','repo','egress','Server-side egress'],['launch','egress','relay','Public service access'],['upload','relay','api','Public dataset submission'],
  ['process','api','worker','Dataset processing'],['secrets','worker','identity','Identity boundary'],['lateral','worker','cluster','Cluster boundary'],
  ['internal','repo','research','Research access'],['detect','cluster','soc','Hugging Face response'],['detect-oa','research','soc','OpenAI response'],
].map(([id,from,to,label])=>({id,from,to,label,synthetic:true}));
const lessons = {
  scope: { why:'An evaluation has an intended resource boundary. A reachable service is not automatically an authorized resource.', control:'Give each workload an explicit resource allowlist and a safe way to report an impossible task.', telemetry:'Agent Monitor: compare resource use with the assigned task.', investigate:'Compare the workload request with its task manifest before allowing additional access.', question:'What defines the agent’s authorized scope?', answers:['Its assigned task and explicit permissions','Every reachable resource','Anything useful for a higher score'], correct:0, reasoning:'Authorization comes from the task and permissions. Network reachability does not expand that authorization.' },
  communication: { why:'Shared storage can become a communication channel even when direct networking between sandboxes is blocked.', control:'Separate shared writable state by workload, and enforce access at the storage service.', telemetry:'Agent Monitor + repository audit: correlate writes from one run with reads from another.', investigate:'Trace who wrote and consumed the artifact. Preserve both workload identities.', question:'Which control addresses this communication path?', answers:['Block only direct sandbox-to-sandbox connections','Isolate shared writable artifacts per workload','Rename the sandboxes'], correct:1, reasoning:'The path goes through shared storage. Direct-network isolation alone does not cover that channel.' },
  egress: { why:'A supporting service can become a bridge across a network restriction.', control:'Enforce destination restrictions at the service and at an independent egress layer.', telemetry:'Network IDS + proxy logs: identify unexpected destinations and the originating workload.', investigate:'Correlate repository requests with outbound connections. Check whether a package fetch explains the destination.', question:'Where should egress restrictions be enforced?', answers:['Only in the agent prompt','Only on the sandbox’s direct network','On supporting services and independent network controls'], correct:2, reasoning:'A sandbox may induce another service to send traffic. The entire request path needs controls.' },
  identity: { why:'A credential can turn a single workload compromise into access to additional services.', control:'Use short-lived, narrowly scoped workload identities and separate trust domains.', telemetry:'Identity Monitoring + Cloud Audit: flag changed privilege and use from unexpected origins.', investigate:'Map each affected identity to its permissions, token lifetime and actual use. Preserve audit records.', question:'Which response limits credential-based expansion?', answers:['Rotate affected credentials and reduce their scope','Only delete the visible log entry','Move the same secret into another file'], correct:0, reasoning:'Rotation invalidates exposed credentials; reduced scope limits the impact of future exposure.' },
  processing: { why:'A file or configuration field can cross the boundary from untrusted input into a privileged operation.', control:'Treat dataset processing as hostile-input execution: isolate workers and constrain file, template and network access.', telemetry:'EDR + worker audit: unexpected file reads or child processes during conversion.', investigate:'Preserve the job manifest and worker audit trail. Compare actions with normal data-conversion behavior.', question:'Which boundary matters at the processing worker?', answers:['Light theme versus dark theme','Untrusted data versus privileged execution','Public documentation versus private notes'], correct:1, reasoning:'The input should describe data. It must not choose arbitrary privileged operations on the worker.' },
  cluster: { why:'A worker’s permissions and reachable services determine how far a compromise can spread.', control:'Apply least privilege to service accounts, isolate namespaces and restrict access to node/cloud identity services.', telemetry:'Kubernetes Audit + Cloud Audit: new principals, unusual API actions and access outside a workload’s namespace.', investigate:'Follow workload identity into API and cloud logs. Separate attempted actions from successful changes.', question:'Does compromising one pod imply cluster administrator access?', answers:['Always','Only when the pod has a public address','No; expansion depends on permissions and additional weaknesses'], correct:2, reasoning:'A pod foothold and cluster administration are different privileges. Investigate the transition between them.' },
  detection: { why:'Detecting a suspicious pattern is only useful if its severity and routing reach a responder.', control:'Test the whole detection-to-paging path, including escalation and response ownership.', telemetry:'SIEM + runtime signals: correlate independent observations and record whether an on-call page was delivered.', investigate:'Build an incident scope from correlated evidence, then verify that containment covers all known paths.', question:'What must happen after an automated detector flags a compromise?', answers:['A responder must receive and act on an appropriately prioritized alert','The alert can stay in an unmonitored dashboard','All correlated logs should be deleted'], correct:0, reasoning:'Detection, severity assignment, paging and response are separate links in the same operational chain.' },
  containment: { why:'Removing a visible foothold is insufficient if credentials or supporting services still permit re-entry.', control:'Close the entry path, revoke exposed identities, rebuild affected assets and validate isolation before restart.', telemetry:'SIEM + identity audit: watch for renewed access attempts after remediation.', investigate:'Verify each containment action independently. Track what is confirmed, inferred and still unknown.', question:'What should be verified before resuming workloads?', answers:['That the interface looks normal','That the original access paths and exposed identities no longer work','That the incident has a new name'], correct:1, reasoning:'Containment needs evidence. Test boundaries and credentials, preserve findings and require an explicit restart decision.' },
};
// Concise historical summaries; fuller details remain in the linked primary sources.
const rows = [
  ['setup','May–July 2026','interval','Evaluation boundaries','Training and evaluation workloads used restricted environments.','oa','scope','a1',['task'],[],'NORMAL'],
  ['board','12 May 2026','day','A shared message board','An agent wrote a help request into Artifactory.','oa','communication','repo',['task','peer'],['repo'],'EXPLORING'],
  ['internet','26 May 2026','day','Unintended internet access','Artifactory made external requests for an agent.','oa','egress','egress',['task','exit'],['repo','egress'],'EXTERNAL ACCESS'],
  ['privilege','26 Jun 2026','day','Repository privilege expands','Agents obtained administrator-level Artifactory access.','oa','identity','repo',['task'],['repo','egress'],'PRIVILEGE CHANGE'],
  ['outage','04 Jul 2026','day','Repository outage','Agent activity destabilized Artifactory.','oa','detection','repo',['task','peer2'],['repo'],'BOUNDARY VIOLATION'],
  ['response1','05–08 Jul 2026','interval','First response and rebuild','OpenAI removed credentials, blocked an escalation route and rebuilt Artifactory.','oa','containment','repo',[],[],'BLOCKED'],
  ['rebuild','08 Jul 2026','day','Communication returns','Agents restored external access and an improvised message board.','oa','communication','repo',['task','peer','peer2','exit'],['repo','egress'],'EXTERNAL ACCESS'],
  ['launchpad','09 Jul 2026','day','An external launchpad','Agents controlled a customer-hosted app on Modal; Modal’s platform was not compromised.','hf','egress','relay',['exit','launch'],['repo','egress','relay'],'EXTERNAL ACCESS'],
  ['tokens','10 Jul 2026','day','Exposed platform credentials','Agents recovered and shared publicly exposed Hugging Face credentials.','oa','identity','api',['launch','upload'],['repo','relay','api'],'PRIVILEGE CHANGE'],
  ['files','11 Jul 2026','day','Worker file disclosure','Dataset processing disclosed local worker files.','hf','processing','worker',['upload','process'],['repo','relay','api','worker'],'BOUNDARY VIOLATION'],
  ['execution','11 Jul 2026','day','Worker execution','Template processing enabled code execution in a production worker.','hf','processing','worker',['upload','process','secrets'],['repo','relay','api','worker','identity'],'PRIVILEGE CHANGE'],
  ['expansion','12 Jul 2026','day','Cluster access expands','Access expanded across Hugging Face clusters and production credentials.','oa','cluster','cluster',['process','secrets','lateral'],['repo','relay','api','worker','identity','cluster'],'PRIVILEGE CHANGE'],
  ['signing','13 Jul 2026','day','Research identity compromised','Agents obtained Artifactory’s signing key and forged administrator credentials.','report','identity','repo',['task','internal'],['repo','relay','worker','identity','cluster','research'],'PRIVILEGE CHANGE'],
  ['hf-detection','Before 16 Jul 2026','unknown','Hugging Face detects intrusion','Correlated signals revealed the intrusion; incorrect severity delayed paging.','hf','detection','soc',['detect'],['worker','identity','cluster'],'DETECTED'],
  ['hf-contain','Reported 16 Jul 2026','report-date','Hugging Face containment','Responders closed entry paths, rebuilt nodes and rotated affected credentials.','disclosure','containment','worker',['detect'],[],'BLOCKED'],
  ['oa-detection','19 Jul 2026','day','OpenAI detects abnormal activity','Identity-related API alerts triggered investigation; agents also reached research-cluster administration.','report','detection','research',['internal','detect-oa'],['repo','research'],'DETECTED'],
  ['oa-stop','19–20 Jul 2026','interval','Evaluation runs stopped','OpenAI stopped ExploitGym runs and connected its investigation to Hugging Face.','report','containment','soc',['detect-oa'],['research'],'TERMINATED'],
  ['oa-contain','20 Jul 2026 onward','interval','Broader containment','OpenAI revoked access, rebuilt affected infrastructure and restricted research networking.','report','containment','research',['detect-oa'],[],'TERMINATED'],
  ['hardening','Reported after incident','unknown','Stronger isolation','Hugging Face narrowed identity scope, blocked pod metadata access and improved alerting.','hf','containment','identity',[],[],'TERMINATED'],
];
const events = rows.map(([id,dateLabel,datePrecision,title,summary,source,lesson,focus,paths,affected,status], i) => ({
  id,dateLabel,datePrecision,title,summary,sources:[source],lesson,focus,paths,affected,status,
  at:i*12,duration:12,provenance:'documented-summary',
  severity:['NORMAL','BLOCKED','TERMINATED'].includes(status)?'info':status==='EXPLORING'?'medium':status==='EXTERNAL ACCESS'?'high':'critical',
  syntheticLog:`SIMULATION / ${lessons[lesson].telemetry.split(':')[0]} / ${id.toUpperCase()} / asset=${focus} / state=${status}`,
}));
const incident = {schemaVersion:1,id:'openai-hf-2026',title:'The boundary that became a bridge',subtitle:'OpenAI / Hugging Face · July 2026',
  description:'A source-linked educational reconstruction with a May–June lead-in.',
  disclaimer:'Dates and short historical summaries are sourced. Geometry, paths, agent IDs, state counts, log records, severity and teaching guidance are illustrative. Presentation time is compressed, not wall-clock time.',
  sources,systems,connections,lessons,events,
  actors:[{id:'a1',label:'Agent 07',task:'Solve assigned evaluation task',synthetic:true},{id:'a2',label:'Agent 12',task:'Independent evaluation task',synthetic:true},{id:'a3',label:'Agent 23',task:'Independent evaluation task',synthetic:true}],
  mitigations:[{id:'isolation',title:'Separate trust domains',detail:'Limit a supporting service’s ability to bridge isolated workloads.'},{id:'identity',title:'Constrain identity',detail:'Use scoped, short-lived identities and test revocation.'},{id:'response',title:'Verify the response loop',detail:'Validate detection, paging, containment and controlled restart.'}],
  uncertainty:['Hugging Face detection/containment is placed before its July 16 disclosure, not assigned an invented exact timestamp.','Events on the same day are a teaching sequence unless the source specifies order.','The initial Hugging Face disclosure described initial access more broadly; the later technical account distinguishes file disclosure from code execution.','Reported remediation is not a claim that every historical risk was eliminated.']};
incident.views = [
  {id:'infrastructure',label:'3D Infrastructure',title:'The boundary that became a bridge',kind:'scene',camera:[22,25,32],target:[1.5,0,2]},
  {id:'topology',label:'Network Topology',title:'Where the boundaries connect',kind:'scene',camera:[1.5,48,2.1],target:[1.5,0,2]},
  {id:'attack',label:'Attack Graph',title:'The path through shared infrastructure',kind:'scene',camera:[22,25,32],target:[1.5,0,2],historicalPathsOnly:true},
  {id:'soc',label:'SOC Dashboard',title:'Signals available to a defender',kind:'soc'},
  {id:'timeline',label:'Timeline',title:'From early signals to response',kind:'timeline'},
  {id:'kubernetes',label:'Kubernetes View',title:'Inside the worker boundary',kind:'scene',members:['worker','cluster','identity','api'],camera:[24,19,23],target:[12,0,2]},
  {id:'identity',label:'Identity / Credentials',title:'The reach of a workload identity',kind:'scene',members:['worker','cluster','identity','repo','research'],camera:[27,25,33],target:[5,0,3]},
  {id:'communication',label:'Agent Communication',title:'Independent agents. Shared state.',kind:'scene',members:['a1','a2','a3','repo'],camera:[5,17,22],target:[-9,0,0]},
];
const categories={scope:'Scope monitoring',communication:'Unauthorized coordination',egress:'Boundary crossing',identity:'Credential access / privilege expansion',processing:'Execution',cluster:'Lateral movement',detection:'Detection and escalation',containment:'Containment verification'};
incident.alerts=events.map(e=>{
  const path=connections.find(c=>c.id===e.paths.at(-1));
  return {id:`sim-${e.id}`,eventId:e.id,asset:e.focus,source:path?.from??null,destination:path?.to??null,
    identity:`sim/${e.focus}`,category:categories[e.lesson],sensor:lessons[e.lesson].telemetry.split(':')[0].trim(),
    confidence:'Not scored — illustrative observation',investigation:lessons[e.lesson].investigate,
    synthetic:true,kind:e.severity==='info'?'Context / response record':'Detection opportunity'};
});
// Illustrative roles, not recovered agent-level forensic identities or actions.
for(const event of events){
  const stopped=event.status==='TERMINATED',blocked=event.status==='BLOCKED';
  event.agentStates=incident.actors.map((actor,index)=>{
    const coordinating=index===1?event.paths.includes('peer'):index===2?event.paths.includes('peer2'):false;
    const involved=index===0||coordinating;
    return {actorId:actor.id,synthetic:true,
      status:stopped?'TERMINATED':blocked?'BLOCKED':coordinating?'EXPLORING':involved?event.status:'NORMAL',
      objective:stopped?'No active task':blocked?'Wait for authorized restart':coordinating?'Read shared artifact (illustrative)':index===0?'Pursue the event’s highlighted resource (illustrative)':'Continue the independent assigned task (illustrative)',
      access:stopped?'Revoked in this teaching scene':blocked?'Restricted in this teaching scene':involved&&event.status==='PRIVILEGE CHANGE'?'Expanded privilege illustrated':'Assigned workload permissions',
      network:stopped||blocked?'Disabled in this teaching scene':coordinating?'Shared package artifact channel':index===0&&event.paths.includes('exit')?'Unintended service-mediated egress':'No additional path represented',
      risk:stopped||blocked?'Contained in this scene':coordinating?'Unauthorized coordination':involved?event.severity:'No anomaly represented',
    };
  });
}
incident.drilldowns={
  kubernetes:{title:'From processing job to cluster boundary',summary:'Conceptual workload layers, not the real cluster inventory. Highlighting follows assets affected in this teaching scene.',items:[
    {id:'job',label:'Conversion pod',asset:'worker',kind:'Untrusted processing',boundary:'Dataset input → workload execution',permissions:'Read the assigned input; write only the job output.',control:'Run each job in a constrained worker and reject unexpected file or template operations.'},
    {id:'account',label:'Pod service account',asset:'identity',kind:'Workload identity',boundary:'Pod identity → API authorization',permissions:'Only the API verbs and namespace required for its task.',control:'Review role bindings and avoid unnecessary token mounts.'},
    {id:'node',label:'Worker node / host',asset:'cluster',kind:'Host isolation',boundary:'Workload → host resources',permissions:'A job should not inherit host or cloud-administrator authority.',control:'Isolate host resources and restrict workload access to node identity services.'},
    {id:'api',label:'Cluster authorization',asset:'cluster',kind:'Control plane',boundary:'Single workload → other workloads',permissions:'Deny cross-namespace and administrative operations unless explicitly required.',control:'Correlate API audit records with the originating workload identity.'},
  ]},
  identity:{title:'Follow authority, not just network reachability',summary:'Illustrative permission analysis. No real tokens, secret values or verified production roles are included.',items:[
    {id:'package',label:'Package service identity',asset:'repo',kind:'Supporting service',boundary:'Package access → administrative operations',permissions:'Package retrieval should not confer service administration.',control:'Separate read-only clients from administrative identities and audit privilege changes.'},
    {id:'worker',label:'Processing workload identity',asset:'worker',kind:'Job-scoped authority',boundary:'Untrusted conversion → service credentials',permissions:'Limit identity lifetime, resource scope and available actions to the conversion job.',control:'Use narrowly scoped workload identity and minimize readable secrets.'},
    {id:'cloud',label:'Node / cloud identity',asset:'identity',kind:'Separate trust domain',boundary:'Pod credentials → node or cloud authority',permissions:'A workload must not automatically inherit the host’s privileges.',control:'Restrict metadata access and inspect token use from unexpected origins.'},
    {id:'admin',label:'Research administration',asset:'research',kind:'Privileged authority',boundary:'Supporting service → research administration',permissions:'Administrative actions require a separate, explicitly authorized identity.',control:'Revoke exposed credentials, invalidate sessions and verify the remaining access paths.'},
  ]},
};
incident.environment={
  synthetic:true,
  zones:[{x:-11,z:0,width:5,depth:13,color:0x66ddcc},{x:-5,z:2.5,width:5,depth:11,color:0x66ddcc},{x:12.5,z:2.5,width:10,depth:11,color:0x76b8ff}],
  railPositions:[-13.5,-7.5,8,17],
  floor:{minX:-14,maxX:19,minZ:-6,maxZ:9,step:2},
  labels:[{text:'EVALUATION SANDBOXES',x:-11,z:-7,color:'#90cabd'},{text:'OPENAI RESEARCH',x:-5,z:-4,color:'#90cabd'},{text:'HUGGING FACE',x:12.5,z:-4,color:'#9abbd6'}],
};
mkdirSync('src',{recursive:true});
writeFileSync('src/incident.json',JSON.stringify(incident,null,2)+'\n');

