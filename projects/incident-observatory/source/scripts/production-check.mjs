import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.argv[2]||'playwright');
const base=process.argv[3]||'http://127.0.0.1:4175';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const failures=[],requests=[];
try {
  const context=await browser.newContext({viewport:{width:1400,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>failures.push(e.message));
  page.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin)requests.push(r.url());});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#scene canvas').waitFor();
  assert(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));
  await page.locator('#play').click();await page.waitForTimeout(200);
  const first=await page.locator('#scene canvas').screenshot();
  await page.waitForTimeout(350);const second=await page.locator('#scene canvas').screenshot();
  assert(first.equals(second),'Reduced-motion scene should not animate packets or pulse rings within an event');
  assert(Number(await page.locator('#scrubber').inputValue())>0,'Timeline should continue under reduced motion');
  await page.locator('#play').click();await page.locator('#scrubber').fill('132');
  await page.selectOption('#view','soc');
  const record=await page.locator('.alert-row').first().innerText();
  for(const text of ['Source: Processing worker','Destination: Worker cluster','Confidence: Not scored','Investigate:'])assert(record.includes(text));
  await context.close();

  const fallback=await browser.newContext({viewport:{width:1000,height:900}});
  await fallback.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args);};
  });
  const textPage=await fallback.newPage();textPage.on('pageerror',e=>failures.push(e.message));
  await textPage.goto(base,{waitUntil:'networkidle'});
  await textPage.locator('#fallback-timeline').waitFor();
  await textPage.locator('#fallback-timeline').click();
  await textPage.locator('.timeline-row').nth(2).click();
  assert.match(await textPage.locator('.event-title').innerText(),/Unintended internet access/);
  await textPage.locator('#sources-button').click();await textPage.keyboard.press('Escape');
  assert.equal(await textPage.locator('#source-dialog').isVisible(),false);
  await textPage.locator('#play').focus();await textPage.keyboard.press('Enter');
  await textPage.waitForTimeout(200);assert.match(await textPage.locator('#play').innerText(),/Pause/);
  await textPage.locator('#play').click();
  await textPage.locator('#tuning-button').click();await textPage.selectOption('#visual-preset','clear');
  assert.equal(await textPage.locator('#tune-exposure').inputValue(),'1.65');
  await fallback.close();assert.deepEqual(failures,[]);assert.deepEqual(requests,[]);
  mkdirSync('.test-artifacts',{recursive:true});
  writeFileSync('.test-artifacts/production-results.json',JSON.stringify({passed:true,base,checks:['production WebGL','reduced-motion pixels remain stable','reduced-motion timeline advances','SOC endpoint details','WebGL unavailable fallback','fallback timeline selection','Escape closes sources','keyboard activates playback','tuning safe without renderer'],pageErrors:failures,externalRequests:requests},null,2));
  console.log('Production, reduced-motion and fallback checks passed.');
} finally {await browser.close();}
