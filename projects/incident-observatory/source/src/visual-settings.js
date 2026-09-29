export const DEFAULTS={preset:'documentary',exposure:1.25,ambient:1.5,key:3.5,fill:1.1,fog:.009,fov:38,packetSpeed:.17,boundaryOpacity:.13,quality:1.5,labels:true,shadows:true,details:true};
export const PRESETS={
  documentary:{...DEFAULTS},
  clear:{...DEFAULTS,preset:'clear',exposure:1.65,ambient:2.5,key:3,fog:.003,boundaryOpacity:.22,fov:42},
  night:{...DEFAULTS,preset:'night',exposure:1,ambient:.8,key:2.8,fill:1.6,fog:.016,boundaryOpacity:.1},
  performance:{...DEFAULTS,preset:'performance',quality:1,shadows:false,details:false,fog:.006},
};
export const RANGES={exposure:[.5,2.2,.05],ambient:[.3,3.5,.1],key:[.5,6,.1],fill:[0,3,.1],fog:[0,.025,.001],fov:[28,55,1],packetSpeed:[.03,.5,.01],boundaryOpacity:[.03,.4,.01],quality:[.75,2,.25]};
export function sanitize(value){const result={...DEFAULTS};for(const [key,range] of Object.entries(RANGES)){const v=value?.[key];if(typeof v==='number'&&Number.isFinite(v))result[key]=Math.max(range[0],Math.min(range[1],v));}for(const key of ['labels','shadows','details'])if(typeof value?.[key]==='boolean')result[key]=value[key];result.preset=Object.hasOwn(PRESETS,value?.preset)?value.preset:'documentary';return result;}
const STORAGE_KEY='incident-observatory-realistic-visual-v1';
export function loadSettings(){try{return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{return {...DEFAULTS};}}
export function mountTuning(getScene){
  let settings=loadSettings();
  const labels={exposure:'Exposure',ambient:'Ambient light',key:'Key light',fill:'Teal rim light',fog:'Atmospheric haze',fov:'Field of view',packetSpeed:'Packet motion',boundaryOpacity:'Boundary visibility',quality:'Resolution scale'};
  const panel=document.createElement('dialog');panel.id='tuning-panel';panel.className='tuning-panel';
  panel.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">REALISTIC EDITION</span><h2>Visual tuning</h2></div><button id="close-tuning" aria-label="Close visual tuning">✕</button></div><p class="tune-help">Changes preview live and save in this browser.</p><label class="tune-preset">Starting look<select id="visual-preset"><option value="documentary">Documentary</option><option value="clear">Clear / classroom</option><option value="night">Night operations</option><option value="performance">Laptop / performance</option></select></label>${Object.entries(RANGES).map(([key,[min,max,step]])=>`<label class="tune-slider" for="tune-${key}"><span>${labels[key]}</span><output id="out-${key}"></output><input id="tune-${key}" type="range" min="${min}" max="${max}" step="${step}" /></label>`).join('')}<div class="tune-checks">${[['labels','Asset labels'],['shadows','Soft shadows'],['details','Cabinet details']].map(([key,label])=>`<label class="check"><input id="tune-${key}" type="checkbox" />${label}</label>`).join('')}</div><div class="tune-actions"><button id="reset-tuning">Reset</button><button id="export-tuning">Export JSON</button><button id="import-tuning">Import JSON</button><input id="tuning-file" type="file" accept="application/json,.json" hidden /></div><p id="tuning-status" role="status">Tip: adjust lighting before adding haze.</p>`;
  document.body.appendChild(panel);
  const $=id=>document.getElementById(id);
  const apply=()=>{getScene()?.applySettings(settings);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));$('tuning-status').textContent='Saved in this browser.';}catch{$('tuning-status').textContent='Preview applied. Browser storage unavailable; export to save.'}};
  const sync=()=>{for(const key of Object.keys(RANGES)){$(`tune-${key}`).value=settings[key];$(`out-${key}`).textContent=settings[key];}for(const key of ['labels','shadows','details'])$(`tune-${key}`).checked=settings[key];$('visual-preset').value=settings.preset;};
  for(const key of Object.keys(RANGES))$(`tune-${key}`).addEventListener('input',e=>{settings[key]=Number(e.target.value);$(`out-${key}`).textContent=settings[key];apply();});
  for(const key of ['labels','shadows','details'])$(`tune-${key}`).addEventListener('change',e=>{settings[key]=e.target.checked;apply();});
  $('visual-preset').addEventListener('change',e=>{settings={...PRESETS[e.target.value]};sync();apply();});
  $('reset-tuning').addEventListener('click',()=>{settings={...DEFAULTS};sync();apply();});
  $('close-tuning').addEventListener('click',()=>panel.close());
  $('tuning-button').addEventListener('click',()=>panel.open?panel.close():panel.show());
  $('export-tuning').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(settings,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='observatory-look.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('import-tuning').addEventListener('click',()=>$('tuning-file').click());
  $('tuning-file').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>10000)throw new Error();const input=JSON.parse(await file.text());if(!input||typeof input!=='object'||Array.isArray(input)||!Object.keys(RANGES).some(k=>typeof input[k]==='number'))throw new Error();settings=sanitize(input);sync();apply();}catch{$('tuning-status').textContent='Could not import. Choose a settings JSON exported from this panel.'}finally{e.target.value='';}});
  sync();getScene()?.applySettings(settings);
}
