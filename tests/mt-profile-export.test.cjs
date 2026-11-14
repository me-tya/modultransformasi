'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('mt-profile-export.js','utf8');
const sandbox={window:{},Blob,URL:{createObjectURL:()=>'/downloaded',revokeObjectURL:()=>{}},setTimeout:fn=>fn(),document:{
 body:{appendChild:()=>{}},
 createElement:()=>({click(){this.clicked=true},remove(){}})
}};
vm.runInNewContext(source,sandbox);
const api=sandbox.window.MT_PROFILE_EXPORT;
assert.equal(typeof api.build,'function');
assert.equal(typeof api.download,'function');
const raw={
 master:{pic:[
  {n:'Contoh Pegawai',nip:'198501012010011001',jab:'Analis',nk:'Contoh',foto:'data:image/png;base64,AAAA',wfhDays:[5],cuti:[{mulai:'2026-12-01',selesai:'2026-12-03',jenis:'Cuti Tahunan'}],emailK:'unit@kemenkeu.go.id'},
  {n:'Contoh Kedua',nip:'198601012010011001',foto:'data:image/jpeg;base64,BBBB'}
 ]},
 cfg:{tims:['Tim CM','Tim SPP'],pt:{'Contoh Pegawai':'Tim CM'},asg:{DJPb:['Contoh Pegawai']},rl:{},stp:{}},
 docs:[
  {id:'cfg-kp-abc123',kind:'cfg',kp:{nama:'Kontak Unit',unit:'DJPb',nip:'199001012010011001',peran:['pmo'],foto:'data:image/png;base64,CCCC'}},
  {id:'cfg-tim',kind:'cfg',tim:{wfhd:[5],rule:{scope:'both',pct:50}}},
  {id:'activity-secret',kind:'act',notes:'Should not export'},
  {id:'cfg-agpim',kind:'cfg',agpim:[{title:'Excluded'}]}
 ]
};
const data=api.build(raw);
assert.equal(data.kind,'mt-tim-pusmantap-profiles');
assert.equal(data.summary.profiles,2);
assert.equal(data.summary.photos,2);
assert.equal(data.summary.embeddedProfilePhotos,2);
assert.equal(data.summary.unitContacts,1);
assert.equal(data.summary.unitContactPhotos,1);
assert.deepEqual([...data.oneonone.map(d=>d.id)],['cfg-master','cfg-kp','cfg-kp-abc123','cfg-tim']);
const imported=JSON.parse(JSON.stringify(data));
assert.equal(imported.oneonone[0].master.pic[0].foto,'data:image/png;base64,AAAA');
assert.equal(imported.oneonone[0].master.pic[0].cuti[0].mulai,'2026-12-01');
assert.equal(imported.oneonone[1].kp.pt['Contoh Pegawai'],'Tim CM');
assert.equal(imported.oneonone[2].kp.foto,'data:image/png;base64,CCCC');
assert.equal(imported.oneonone[3].tim.wfhd[0],5);
assert.ok(!imported.oneonone.some(d=>d.id==='activity-secret'||d.id==='cfg-agpim'));
assert.equal(raw.master.pic.length,2,'Source must remain untouched');
const exportResult=api.download(raw);
assert.ok(/^Tim_Pusmantap_Profil_Foto_\d{8}_\d{4}\.json$/.test(exportResult.filename));
assert.ok(exportResult.size>100);
const page=fs.readFileSync('mt-tim2.js','utf8');
assert(page.includes('data-texportprofiles'), 'Button not wired');
assert(page.includes('window.MT_PROFILE_EXPORT.download({docs:S.oneonone||[],master:actMaster(),cfg:kpCfg()})'));
console.log('PASS: photo/profile JSON retains contacts, team, WFH and leave; excludes unrelated; download wired.');
