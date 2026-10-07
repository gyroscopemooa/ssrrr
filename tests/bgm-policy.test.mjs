import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBgmSettings} from '../lib/automation/bgm-policy.ts';
const assets=[{id:'unlicensed',type:'bgm',license_note:''},{id:'logo',type:'logo',license_note:'owned'},{id:'first',type:'bgm',license_note:'owned'},{id:'second',type:'bgm',license_note:'owned'}];
test('random BGM resolves an explicit licensed music ID for older render workers',()=>{
 const settings={bgmEnabled:true,bgmRandom:true,bgmId:''};
 assert.equal(resolveBgmSettings(settings,assets,()=>0).bgmId,'first');
 assert.equal(resolveBgmSettings(settings,assets,()=>.99).bgmId,'second');
 assert.equal(settings.bgmId,'');
});
test('humor random selection stays inside its configured pool and excludes issue tracks',()=>{
 const mixed=[...assets,{id:'news',type:'bgm',license_note:'owned'}];
 const settings={bgmEnabled:true,bgmRandom:true,bgmId:'',humorBgmIds:['first','second'],issueBgmIds:['news'],captionTone:'humor'};
 assert.equal(resolveBgmSettings(settings,mixed,()=>0).bgmId,'first');
 assert.equal(resolveBgmSettings(settings,mixed,()=>.99).bgmId,'second');
});
test('manual selection, disabled BGM and empty pools preserve settings',()=>{
 for(const settings of [{bgmEnabled:false,bgmRandom:true},{bgmEnabled:true,bgmRandom:false,bgmId:'manual'}])assert.deepEqual(resolveBgmSettings(settings,assets),settings);
 const settings={bgmEnabled:true,bgmRandom:true,bgmId:''};
 assert.deepEqual(resolveBgmSettings(settings,[]),settings);
});
test('issue and serious tones use the dedicated current-affairs track',()=>{
 const newsA={id:'news-a',type:'bgm',license_note:'owned'},newsB={id:'news-b',type:'bgm',license_note:'owned'};
 for(const captionTone of ['issue','serious']){
  const settings={bgmEnabled:true,bgmRandom:true,bgmId:'old',issueBgmIds:['news-a','news-b'],captionTone};
  assert.equal(resolveBgmSettings(settings,[...assets,newsA,newsB],()=>0).bgmId,'news-a');
  assert.equal(resolveBgmSettings(settings,[...assets,newsA,newsB],()=>.99).bgmId,'news-b');
 }
});
test('issue and serious tones keep rendering with a licensed fallback until their track is uploaded',()=>{
 assert.deepEqual(resolveBgmSettings({bgmEnabled:true,bgmRandom:true,bgmId:'second',issueBgmId:'missing',captionTone:'issue'},assets,()=>0),{bgmEnabled:true,bgmRandom:false,bgmId:'second',issueBgmId:'missing',captionTone:'issue'});
 assert.deepEqual(resolveBgmSettings({bgmEnabled:true,bgmRandom:true,bgmId:'missing',issueBgmId:'',captionTone:'serious'},assets,()=>0),{bgmEnabled:true,bgmRandom:false,bgmId:'first',issueBgmId:'',captionTone:'serious'});
});
