import './style.css';
import incident from './incident.json';
import { duration, snapshot, validateIncident, alertsThrough } from './model.js';
import { Infrastructure } from './scene.js';
import { mountTuning } from './visual-settings.js';
import { renderDrilldown } from './drilldown.js';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const errors=validateIncident(incident);if(errors.length)throw new Error(errors.join('\n'));
let time=0,playing=false,speed=1,perspective='defender',view='infrastructure',lastIndex=-1,scene=null,selected=incident.systems[0].id;
const asked=new Set(),total=duration(incident);
$('scrubber').max=total;$('event-count').textContent=incident.events.length;
$('view').innerHTML=incident.views.map(v=>`<option value="${escape(v.id)}">${escape(v.label)}</option>`).join('');
$('event-list').innerHTML=incident.events.map((e,i)=>`<li><button data-event="${i}" aria-current="false"><span class="number">${String(i+1).padStart(2,'0')}</span><span><small>${escape(e.dateLabel)}</small>${escape(e.title)}</span></button></li>`).join('');
$('asset-select').innerHTML=incident.systems.map(s=>`<option value="${s.id}">${escape(s.label)}</option>`).join('');
$('source-content').innerHTML=`<p>${escape(incident.disclaimer)}</p>${incident.sources.map(s=>`<a class="source-card" href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗<small>${s.published?`Published ${s.published}`:'Primary technical reconstruction'}</small></a>`).join('')}<h3 style="margin-top:24px">Where precision is limited</h3><ul>${incident.uncertainty.map(u=>`<li>${escape(u)}</li>`).join('')}</ul><p>Defensive controls and questions are teaching guidance. This tool is not affiliated with OpenAI, Hugging Face, Modal or JFrog. It does not run agent commands.</p>`;

function selectAsset(id,focus=true){selected=id;$('asset-select').value=id;if(focus)scene?.focus(id);renderAsset();}
function renderAsset(){
  const s=incident.systems.find(s=>s.id===selected),state=snapshot(incident,time),actor=incident.actors.find(a=>a.id===selected);
  const agentState=state.agentStates.find(a=>a.actorId===selected);
  const label=actor?(agentState?.status??state.event.status):state.affected.has(selected)?'AFFECTED IN THIS SCENE':'ILLUSTRATIVE ASSET';
  const source=incident.systems.find(s=>s.id===incident.connections.find(c=>state.paths.has(c.id)&&c.to===selected)?.from)?.label;
  const access=state.event.status==='TERMINATED'?'Evaluation stopped':state.event.status==='BLOCKED'?'Restricted during response':state.event.status==='NORMAL'?'Assigned resources only':state.event.status==='PRIVILEGE CHANGE'?'Expanded access represented':'Unexpected resource use represented';
  $('asset-detail').innerHTML=`<strong>${escape(s.detail)}</strong><br /><span class="asset-state">${escape(label)}</span>${actor?`<p>Task: ${escape(actor.task)}<br />Sandbox: ${escape(actor.id)}.example<br />Access: ${escape(agentState?.access??access)}<br />Objective: ${escape(agentState?.objective??'Assigned evaluation task')}<br />Network: ${escape(agentState?.network??'See highlighted paths')}<br />Risk: ${escape(agentState?.risk??'Illustrative')}</p><small>Individual roles and states are synthetic teaching examples, not recovered agent histories.</small>`:`<p>Zone: ${escape(s.zone)}<br />${source?`Illustrated source: ${escape(source)}<br />`:''}Identity: sim/${escape(s.id)}<br />Asset ID and position are synthetic.</p>`}`;
}
function setPlaying(value){playing=value&&time<total;$('play').textContent=playing?'Ⅱ Pause':'▶ Play';$('play').setAttribute('aria-label',playing?'Pause playback':'Play incident');}
function seek(t,{focus=true}={}){time=Math.max(0,Math.min(total,Number(t)||0));if(time===total)setPlaying(false);render(true,focus);}
function go(index){setPlaying(false);seek(incident.events[Math.max(0,Math.min(incident.events.length-1,index))].at);}
function render(force=false,focus=true){
  const state=snapshot(incident,time),e=state.event,l=state.lesson;
  $('scrubber').value=time;$('elapsed').textContent=`${clock(time)} / ${clock(total)} · presentation time`;
  $('scrubber').setAttribute('aria-valuetext',`${e.dateLabel}, ${e.title}, ${clock(time)} presentation time`);
  if(!force&&lastIndex===state.index)return;
  lastIndex=state.index;
  $('date-label').textContent=e.dateLabel;$('phase').textContent=`${String(state.index+1).padStart(2,'0')} / ${incident.events.length}`;
  $('active-agents').textContent=state.activeAgents;$('affected-systems').textContent=state.affected.size;
  $('severity').textContent=e.severity.toUpperCase();$('severity').style.color={info:'#85c7ff',medium:'#ffcf81',high:'#ffb766',critical:'#ff8e9b'}[e.severity];
  $('previous').disabled=state.index===0;$('next').disabled=state.index===incident.events.length-1;
  document.querySelectorAll('#event-list button').forEach((b,i)=>b.setAttribute('aria-current',String(i===state.index)));
  if(playing)$('event-list').querySelector('[aria-current=true]')?.scrollIntoView({block:'nearest'});
  const precision={day:'Documented date · exact time not represented',interval:'Reported interval · compressed into one scene',unknown:'Exact historical time not established', 'report-date':'Disclosure date · actions occurred earlier'}[e.datePrecision];
  $('event-detail').innerHTML=`<span class="event-date">${escape(e.dateLabel)}</span><h2 class="event-title">${escape(e.title)}</h2><p class="event-summary">${escape(e.summary)}</p>${e.sources.map(id=>{const s=incident.sources.find(s=>s.id===id);return `<a class="source-link" href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a>`;}).join(' · ')}<div class="precision">${precision}</div><span class="teaching-label">BELOW: DEFENSIVE TEACHING GUIDANCE</span><div class="explanation"><section><h3>${perspective==='agent'?'BOUNDARY / CONSEQUENCE':'WHY IT MATTERS'}</h3><p>${escape(l.why)}</p></section><section><h3>CONTROL THAT SHOULD CONSTRAIN THIS</h3><p>${escape(l.control)}</p></section><section><h3>${perspective==='agent'?'OBSERVABLE TRACES':'WHAT A DEFENDER COULD SEE'}</h3><p>${escape(l.telemetry)}</p></section><section><h3>RECOMMENDED INVESTIGATION</h3><p>${escape(l.investigate)}</p></section></div>`;
  $('stream-title').textContent=perspective==='defender'?'DEFENSIVE TELEMETRY':'AGENT ACTIVITY';
  $('terminal').innerHTML=state.logs.slice(-6).map(log=>`<div class="log-line"><b>${clock(log.at)}</b><span>${escape(perspective==='defender'?log.syntheticLog:`SIMULATION / AGENT-07 / ${log.status} / resource=${log.focus}.example / action=${log.id}`)}</span></div>`).join('');
  $('terminal').scrollTop=$('terminal').scrollHeight;
  if(focus)selected=e.focus;
  scene?.setState(state,focus&&$('follow').checked);
  if(view==='infrastructure')$('scene-title').textContent=e.title;
  $('asset-select').value=selected;renderAsset();renderAlternative(state);
}
function renderAlternative(state){
  renderDrilldown($('drilldown'),incident,view,state);
  if(view==='timeline'){
    $('alternative-view').innerHTML=`<p class="panel-note">Select an event to pause and inspect it. Spacing represents presentation time, not the duration between dates.</p>${incident.events.map((e,i)=>`<button class="timeline-row" data-event="${i}"><span class="event-date">${escape(e.dateLabel)}</span>${String(i+1).padStart(2,'0')} · ${escape(e.title)}<small>${escape(e.summary)}</small></button>`).join('')}`;
  } else if(view==='soc'){
    const assetName=id=>id?incident.systems.find(s=>s.id===id)?.label??id:'No connection represented';
    $('alternative-view').innerHTML=`<p class="panel-note">Synthetic observations through the playhead, not recovered forensic alerts. Categories are teaching labels, not verified ATT&CK mappings. Select a record to focus its asset.</p>${alertsThrough(incident,time).slice().reverse().map(a=>{const e=incident.events.find(e=>e.id===a.eventId);return `<button class="alert-row" data-alert="${incident.events.indexOf(e)}"><span class="severity-chip ${e.severity}">${e.severity.toUpperCase()}</span>${escape(e.title)}<small>${escape(a.kind)} · ${escape(a.category)}</small><small>SIM ${clock(e.at)} · ${escape(e.dateLabel)} · ${escape(a.sensor)}</small><small>Source: ${escape(assetName(a.source))}<br />Destination: ${escape(assetName(a.destination))}</small><small>Asset: ${escape(assetName(a.asset))} · workload identity: ${escape(a.identity)}</small><small>Confidence: ${escape(a.confidence)}</small><small>Investigate: ${escape(a.investigation)}</small></button>`;}).join('')}`;
  }
}
function setView(next){
  view=next;$('view').value=next;const table=['soc','timeline'].includes(view);
  $('alternative-view').hidden=!table;$('scene').style.visibility=table?'hidden':'visible';$('labels').style.visibility=table?'hidden':'visible';
  $('scene-hint').textContent=table?'Select an entry to inspect the corresponding event':'Drag to orbit · Scroll to zoom · Select an asset';
  $('scene-title').textContent=view==='infrastructure'?snapshot(incident,time).event.title:incident.views.find(v=>v.id===view)?.title??view;scene?.setView(view);renderAlternative(snapshot(incident,time));
}
function showQuestion(state){
  if($('source-dialog').open||$('teach-dialog').open)return;
  asked.add(state.event.lesson);setPlaying(false);const l=state.lesson;
  $('question').textContent=l.question;$('answer-feedback').textContent='';$('continue-lesson').textContent='Return to event';
  $('answers').replaceChildren(...l.answers.map((answer,i)=>{const b=document.createElement('button');b.textContent=answer;b.addEventListener('click',()=>{
    [...$('answers').children].forEach((x,j)=>{x.disabled=true;if(j===l.correct)x.classList.add('correct');});if(i!==l.correct)b.classList.add('incorrect');
    $('answer-feedback').textContent=`${i===l.correct?'Correct.':'Not quite.'} ${l.reasoning}`;$('continue-lesson').textContent='Continue playback';
  });return b;}));
  $('teach-dialog').showModal();
}
document.addEventListener('click',e=>{
  const inspect=e.target.closest('[data-inspect]');if(inspect){setPlaying(false);selectAsset(inspect.dataset.inspect);}
  const b=e.target.closest('[data-event]');if(b)go(Number(b.dataset.event));
  const alert=e.target.closest('[data-alert]');if(alert){go(Number(alert.dataset.alert));setView('infrastructure');selectAsset(snapshot(incident,time).event.focus);}
});
$('play').addEventListener('click',()=>{if(time>=total)seek(0);setPlaying(!playing);});
$('restart').addEventListener('click',()=>{setPlaying(false);asked.clear();seek(0);scene?.overview();});
$('previous').addEventListener('click',()=>go(snapshot(incident,time).index-1));
$('next').addEventListener('click',()=>go(snapshot(incident,time).index+1));
$('scrubber').addEventListener('input',e=>{setPlaying(false);seek(e.target.value);});
$('speed').addEventListener('change',e=>{speed=Number(e.target.value);});
$('view').addEventListener('change',e=>setView(e.target.value));
$('overview').addEventListener('click',()=>scene?.overview());
$('asset-select').addEventListener('change',e=>{setPlaying(false);selectAsset(e.target.value);});
$('follow').addEventListener('change',()=>{if($('follow').checked)scene?.focus(snapshot(incident,time).event.focus);});
for(const mode of ['defender','agent'])$(mode).addEventListener('click',()=>{perspective=mode;$('defender').setAttribute('aria-pressed',String(mode==='defender'));$('agent').setAttribute('aria-pressed',String(mode==='agent'));render(true,false);});
$('sources-button').addEventListener('click',()=>{setPlaying(false);$('source-dialog').showModal();});
$('close-sources').addEventListener('click',()=>$('source-dialog').close());
$('continue-lesson').addEventListener('click',()=>{const resume=$('continue-lesson').textContent==='Continue playback';$('teach-dialog').close();if(resume)setPlaying(true);});
document.addEventListener('keydown',e=>{if(e.target.closest('button,input,select,textarea,dialog')||$('source-dialog').open||$('teach-dialog').open)return;if(e.code==='Space'){e.preventDefault();if(time>=total)seek(0);setPlaying(!playing);}if(e.code==='ArrowRight')go(snapshot(incident,time).index+1);if(e.code==='ArrowLeft')go(snapshot(incident,time).index-1);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});
try {scene=new Infrastructure($('scene'),$('labels'),incident,id=>{setPlaying(false);selectAsset(id);});scene.overview();}
catch(error){console.warn('3D view unavailable; text views remain usable.',error.message);const warning=document.createElement('div');warning.className='fallback';warning.innerHTML='<strong>3D rendering is unavailable in this browser.</strong><p>The event timeline, explanations, teaching mode and telemetry still work.</p><button id="fallback-timeline">Open timeline</button>';$('scene').appendChild(warning);$('fallback-timeline').addEventListener('click',()=>setView('timeline'));}
mountTuning(()=>scene);
render(true,false);
let previous=performance.now();
function frame(now){const dt=Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;if(playing){time=Math.min(total,time+dt*speed);render();if(time>=total)setPlaying(false);const state=snapshot(incident,time);if($('teach').checked&&!asked.has(state.event.lesson)&&time-state.event.at>=2)showQuestion(state);}if(!['soc','timeline'].includes(view))scene?.render(dt,playing);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
