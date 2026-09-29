const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderDrilldown(container,data,view,state){
  const detail=data.drilldowns?.[view];container.hidden=!detail;
  if(!detail){container.replaceChildren();return;}
  container.innerHTML=`<div class="section-title">${escape(detail.title)}<span class="synthetic">SYNTHETIC MODEL</span></div><p class="panel-note">${escape(detail.summary)}</p><div class="drilldown-grid">${detail.items.map(item=>`<article class="drilldown-card ${state.affected.has(item.asset)?'is-affected':''}"><span class="eyebrow">${escape(item.kind)}</span><h3>${escape(item.label)}</h3><span class="asset-state">${state.affected.has(item.asset)?'AFFECTED IN THIS SCENE':'NO AFFECTED STATE REPRESENTED'}</span><dl><dt>Boundary</dt><dd>${escape(item.boundary)}</dd><dt>Intended permissions · teaching guidance</dt><dd>${escape(item.permissions)}</dd><dt>Defensive control</dt><dd>${escape(item.control)}</dd></dl><button data-inspect="${escape(item.asset)}">Focus ${escape(data.systems.find(s=>s.id===item.asset)?.label??item.asset)}</button></article>`).join('')}</div>`;
}
