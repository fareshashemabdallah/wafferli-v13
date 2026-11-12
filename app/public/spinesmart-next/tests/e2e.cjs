'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const BASE=process.env.SPINESMART_TEST_URL||'http://127.0.0.1:8080/spinesmart-next/';
const out='/tmp/spinesmart-e2e';
fs.mkdirSync(out,{recursive:true});
let passed=0,failed=0;const failures=[];
let browser;
async function withPage(fn,{oldData}={}){
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 if(oldData)await context.addInitScript(data=>{if(!localStorage.getItem('spinesmart-gym-v1'))localStorage.setItem('spinesmart-gym-v1',JSON.stringify(data))},oldData);
 const page=await context.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.locator('#tabTrain').waitFor({state:'visible'});
 try{await fn(page);assert.deepEqual(errors,[], 'uncaught browser errors')}finally{await context.close()}
}
async function run(name,fn,opts){
 try{await withPage(fn,opts);console.log('PASS '+name);passed++}
 catch(e){console.log('FAIL '+name+' :: '+e.message);failures.push({name,error:e.stack});failed++}
}
async function gate(page){
 for(const [name,val] of [['nerve','no'],['cord','no'],['pain','0'],['ready','yes']]) await page.locator('[data-gate="'+name+'"][data-val="'+val+'"]').click();
 await page.locator('#routineWrap').waitFor({state:'visible'});
}
async function save(page){
 await page.locator('[data-after="fine"]').click();
 await page.getByRole('button',{name:'Save this session'}).click();
 await page.getByText('Session saved', {exact:false}).first().waitFor({state:'visible'});
}
(async()=>{
 browser=await chromium.launch({headless:true});
 try{
 await run('Initial load, titles, navigation, week list',async page=>{
  assert.match(await page.title(),/SpineSmart/);
  assert.equal(await page.locator('#train').isVisible(),true);
  await page.locator('#tabWeek').click();assert.equal(await page.locator('#week').isVisible(),true);assert.equal(await page.locator('#train').isVisible(),false);
  await page.locator('#tabGuide').click();assert.equal(await page.locator('#guide').isVisible(),true);
  await page.locator('#tabTrain').click();assert.equal(await page.locator('#train').isVisible(),true);
 });
 await run('Safety answers open or block workouts correctly',async page=>{
  await page.locator('[data-gate="nerve"][data-val="yes"]').click();
  for(const [name,val] of [['cord','no'],['pain','0'],['ready','yes']]) await page.locator('[data-gate="'+name+'"][data-val="'+val+'"]').click();
  assert.equal(await page.locator('#routineWrap').isVisible(),false);
  await page.locator('[data-gate="nerve"][data-val="no"]').click();
  assert.equal(await page.locator('#routineWrap').isVisible(),true);
  await page.locator('[data-gate="pain"][data-val="3"]').click();
  assert.equal(await page.locator('#routineWrap').isVisible(),false);
 });
 await run('Workout A/B/C switch and render distinct equipment',async page=>{
  await gate(page);
  assert.match(await page.locator('#workoutTitle').innerText(),/Lower-body/);
  await page.getByRole('button',{name:/Workout B/}).click();await gate(page);
  assert.match(await page.locator('#workoutTitle').innerText(),/Upper-body/);
  await page.getByRole('button',{name:/Workout C/}).click();await gate(page);
  assert.match(await page.locator('#workoutTitle').innerText(),/Mixed/);
 });
 await run('Exercise guide: start, finish, compare, diagram and close',async page=>{
  await gate(page);
  await page.locator('#exerciseList .visualBtn').nth(1).click();
  assert.equal(await page.locator('#pictureOverlay').isVisible(),true);
  for(const view of ['finish','compare','diagram','start']){
   await page.locator('.photoTabs [data-view="'+view+'"]').click();
   assert.equal(await page.locator('.photoTabs [data-view="'+view+'"]').getAttribute('aria-pressed'),'true');
  }
  await page.getByRole('button',{name:'Back to workout'}).click();
  assert.equal(await page.locator('#pictureOverlay').isVisible(),false);
 });
 await run('Goal and 45 min change the displayed training plan',async page=>{
  await page.locator('#smartMinutes').selectOption('45');
  assert.match(await page.locator('#smartToday').innerText(),/Week/);
  await gate(page);
  assert.match(await page.locator('#workoutSubtitle').innerText(),/45/);
  assert.match(await page.locator('#exerciseList').innerText(),/10 min/);
  await page.locator('#smartGoal').selectOption('fitness');
  await page.getByRole('button',{name:/Workout C/}).click();await gate(page);
  assert.match(await page.locator('#workoutTitle').innerText(),/Mixed/);
  assert.equal(await page.locator('#smartGoal').inputValue(),'fitness');
 });
 await run('Selecting two days hides workout C and updates weekly goal',async page=>{
  await page.locator('#smartDays').selectOption('2');
  assert.equal(await page.getByRole('button',{name:/Workout C/}).count(),0,'Workout C should not be displayed in 2-day mode');
  await page.locator('#tabWeek').click();
  assert.match(await page.locator('#weekScore').innerText(),/\/ 2/);
  assert.equal(await page.locator('#weeklyLogs').getByRole('button',{name:'Open'}).count(),2);
 });
 await run('Cardio selector changes Workout C to bike and picture controls',async page=>{
  await page.locator('#smartCardio').selectOption('bike');
  await page.getByRole('button',{name:/Workout C/}).click();
  await gate(page);
  assert.match(await page.locator('#exerciseList article.ex').first().innerText(),/bike/i);
  await page.locator('#exerciseList .visualBtn').first().click();
  assert.match(await page.locator('#pictureBody').innerText(),/Bike resistance/i);
  await page.locator('#pictureOverlay .close').click();
 });
 await run('Week navigation advances phase, future sessions cannot be saved',async page=>{
  await page.getByRole('button',{name:/Next/}).click();
  assert.match(await page.locator('#weekLabel').innerText(),/–/);
  assert.match(await page.locator('#gateResult').innerText(),/Upcoming|future/i);
  assert.equal(await page.locator('#routineWrap').isVisible(),false);
  await page.getByRole('button',{name:/Prev/}).click();
  await gate(page);
 });
 await run('Set, weight, reps and effort record; save and reload persist',async page=>{
  await gate(page);
  const card=page.locator('#exerciseList article.ex').filter({hasText:'Seated hamstring curl'}).first();
  await card.locator('.set').nth(0).click();await card.locator('.set').nth(1).click();
  await card.locator('input.weight').fill('12.5');await card.locator('input.weight').press('Tab');
  await card.locator('input[aria-label="Repetitions completed"]').fill('10');await card.locator('input[aria-label="Repetitions completed"]').press('Tab');
  await card.locator('select').last().selectOption('6');
  await save(page);
  await page.reload();await gate(page);
  const again=page.locator('#exerciseList article.ex').filter({hasText:'Seated hamstring curl'}).first();
  assert.equal(await again.locator('input.weight').inputValue(),'12.5');
  assert.equal(await again.locator('input[aria-label="Repetitions completed"]').inputValue(),'10');
  assert.equal(await again.locator('select').last().inputValue(),'6');
  await page.locator('#tabWeek').click();
  assert.match(await page.locator('#weeklyLogs').innerText(),/Saved/);
  assert.match(await page.locator('#smartRecovery').innerText(),/Recovery next day/i);
  await page.locator('#smartRecovery button').filter({hasText:'Comfortable'}).first().click();
  assert.match(await page.locator('#smartRecovery').innerText(),/No pending/i);
 });
 await run('Workout cannot be unlocked with nerve or cord red flags',async page=>{
  for(const [name,val] of [['nerve','no'],['cord','yes'],['pain','0'],['ready','yes']])await page.locator('[data-gate="'+name+'"][data-val="'+val+'"]').click();
  assert.equal(await page.locator('#routineWrap').isVisible(),false);
  assert.match(await page.locator('#gateResult').innerText(),/Hold/);
 });
 await run('Rest timer start, pause and reset buttons',async page=>{
  await page.locator('#timerButton').click();assert.match(await page.locator('#timerButton').innerText(),/Pause/);
  await page.locator('#timerButton').click();assert.match(await page.locator('#timerButton').innerText(),/Start/);
  await page.getByRole('button',{name:'Reset'}).click();assert.equal(await page.locator('#timer').innerText(),'01:15');
 });
 await run('Download historical CSV shows actual logged exercises and measures',async page=>{
  await gate(page);
  const card=page.locator('#exerciseList article.ex').filter({hasText:'Seated hamstring curl'}).first();
  await card.locator('input.weight').fill('17.5');await card.locator('input.weight').press('Tab');
  await card.locator('input[aria-label="Repetitions completed"]').fill('11');await card.locator('input[aria-label="Repetitions completed"]').press('Tab');
  await card.locator('select').last().selectOption('7');
  await save(page);
  await page.locator('#tabWeek').click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:/Export revised-plan log/}).click();
  const download=await downloadPromise,loc=await download.path(),csv=fs.readFileSync(loc,'utf8');
  assert.match(csv,/Seated hamstring curl/);assert.match(csv,/17.5/);
  assert.match(csv,/11/);assert.match(csv,/Next.day|Recovery/i);
 });
 await run('Profile persists across browser refresh',async page=>{
  await page.locator('#smartGoal').selectOption('muscle');
  await page.locator('#smartMinutes').selectOption('45');
  await page.locator('#smartDays').selectOption('2');
  await page.reload();
  assert.equal(await page.locator('#smartGoal').inputValue(),'muscle');
  assert.equal(await page.locator('#smartMinutes').inputValue(),'45');
  assert.equal(await page.locator('#smartDays').inputValue(),'2');
 });
 await run('Previous v1 records are preserved but not falsely marked as new completed sessions',async page=>{
  const v2=await page.evaluate(()=>JSON.parse(localStorage.getItem('spinesmart-gym-v2')||'{}'));
  assert.equal(v2.records['2026-11-09_A'],undefined);
 },{oldData:{records:{'2026-11-09_A':{checks:{curl_0:true,curl_1:true},finished:true,weights:{curl:'20'}}},previousRecords:{'2026-11-02_A':{finished:true}},startDate:'2026-11-02'}});
 await run('Cycle restart disabled until week eight',async page=>{
  await page.locator('#tabWeek').click();
  assert.equal(await page.locator('#restartSmartCycle').isDisabled(),true);
 });

 await run('45-minute mode adds distinct exercises without reusing set IDs',async page=>{
  await page.locator('#smartMinutes').selectOption('45');
  const seq=await page.evaluate(()=>Object.fromEntries(Object.entries(routines).map(([d,r])=>[d,r.items.map(e=>e.id)])));
  for(const d of ['A','B','C']){
   assert.equal(seq[d].length,new Set(seq[d]).size,'Duplicate exercise ID in workout '+d);
   assert.ok(seq[d].length>=6,'45-minute workout '+d+' should be longer than baseline');
  }
 });
 await run('Every goal changes the active workout or visible personalisation',async page=>{
  await gate(page);
  const balanced=await page.locator('#exerciseList article.ex h3').allInnerTexts();
  await page.locator('#smartGoal').selectOption('muscle');
  const muscle=await page.locator('#exerciseList article.ex h3').allInnerTexts();
  assert.notDeepEqual(muscle,balanced,'Muscle goal should change Week 1 Workout A');
  assert.match(await page.locator('#smartToday').innerText(),/More supported strength/);
  await page.locator('#smartGoal').selectOption('fitness');
  assert.match(await page.locator('#exerciseList article.ex').first().innerText(),/10 min/);
  assert.match(await page.locator('#smartToday').innerText(),/Longer low-impact cardio/);
 });
 await run('Two-day setting changes target label and switches away from hidden C',async page=>{
  await page.getByRole('button',{name:/Workout C/}).click();
  await page.locator('#smartDays').selectOption('2');
  assert.equal(await page.getByRole('button',{name:/Workout C/}).count(),0);
  assert.match(await page.locator('#daySelector .day.active').innerText(),/Workout A/);
  await page.locator('#tabWeek').click();
  assert.match(await page.locator('#adaptiveTarget').innerText(),/2 sessions/);
 });
 await run('Machine visualization stepper changes displayed settings',async page=>{
  await gate(page);
  await page.locator('#exerciseList .visualBtn').first().click();
  const old=await page.locator('#visual_speed').innerText();
  await page.locator('#visual_speed').locator('..').locator('button').last().click();
  const next=await page.locator('#visual_speed').innerText();
  assert.notEqual(next,old,'Speed plus does not work');
  await page.locator('#visual_speed').locator('..').locator('button').first().click();
  assert.equal(await page.locator('#visual_speed').innerText(),old);
  await page.locator('#pictureOverlay .close').click();
  await page.locator('#smartCardio').selectOption('bike');
  await page.getByRole('button',{name:/Workout C/}).click();await gate(page);
  await page.locator('#exerciseList .visualBtn').first().click();
  const prev=await page.locator('#visual_bike').innerText();
  await page.locator('#visual_bike').locator('..').locator('button').last().click();
  assert.notEqual(await page.locator('#visual_bike').innerText(),prev);
 });
 await run('Export uses the saved routine even after changing profile',async page=>{
  await gate(page);
  await save(page);
  await page.locator('#smartGoal').selectOption('muscle');
  await page.locator('#tabWeek').click();
  const dlPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:/Export revised-plan log/}).click();
  const dl=await dlPromise,csv=fs.readFileSync(await dl.path(),'utf8');
  assert.match(csv,/Supported hip abduction/);
  assert.doesNotMatch(csv,/Supported seated leg extension/);
 });
 await run('Backup downloads historical v1 logs separately',async page=>{
  await page.locator('#tabWeek').click();
  const dlPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:/Backup previous-plan entries/}).click();
  const dl=await dlPromise,data=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  assert.ok(data.previousRecords['2026-11-09_A'],'Legacy history was not retained');
 },{oldData:{records:{'2026-11-09_A':{weights:{curl:'10'},finished:true}},startDate:'2026-11-09'}});
 await run('Worsening symptoms after training redirect to safety guide',async page=>{
  await gate(page);
  await page.locator('[data-after="bad"]').click();
  await page.getByRole('button',{name:'Save this session'}).click();
  assert.equal(await page.locator('#guide').isVisible(),true);
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('spinesmart-gym-v2')));
  assert.equal(Object.values(state.records)[0].nextDay,'worse');
 });
 await run('Programme stays within mobile and desktop screen widths',async page=>{
  for(const width of [360,390,768,1280]){
   await page.setViewportSize({width,height:850});
   const dims=await page.evaluate(()=>({body:document.documentElement.scrollWidth,view:window.innerWidth}));
   assert.ok(dims.body<=dims.view+3,'Unexpected horizontal overflow on '+width+'px viewport');
  }
 });

 }finally{await browser.close()}
 console.log('\nRESULT '+passed+' passed, '+failed+' failed');
 if(failures.length){fs.writeFileSync(out+'/failures.json',JSON.stringify(failures,null,2));console.log(JSON.stringify(failures,null,2));process.exitCode=1}
})().catch(e=>{console.error(e);process.exitCode=1});
