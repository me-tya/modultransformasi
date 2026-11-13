const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('mt-dcm-squad-import.js','utf8');
const browser={},ctx={window:browser};
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'mt-dcm-squad-import.js'});
const api=browser.MT_DCM_SQUAD_IMPORT;
assert(api,'Importer exported');
function plain(x){return JSON.parse(JSON.stringify(x))}
const sample={
 kind:'cm-dashboard-backup',version:3,contactPhotos:{avatar1:'data:image/png;base64,AAAA'},
 resources:[
  {nama:'Pegawai Tim CM',nip:'198501012009012001',jabatan:'Analis',emailKemenkeu:'timcm@kemenkeu.go.id',wfhDays:[5],rencanaCuti:[{mulai:'2026-11-20',selesai:'2026-11-21',jenis:'Cuti Tahunan'}],noHp:'0812345678'},
  {nama:'Pegawai Lain Tim CM',nip:'198501012009012002',jabatan:'Prakom'}
 ],
 contacts:[
  {sheet:'ST CM',squadTeam:'Squad Team Koordinator Pengelola Perubahan',unitEselonI:'Pusat Manajemen Transformasi dan Perubahan, BaTii',nama:'Pegawai Tim CM',nip:'198501012009012001',jabatan:'Analis',peran:'Anggota'},
  {sheet:'ST CM',squadTeam:'Squad Team Koordinator Pengelola Perubahan',unitEselonI:'Pusmantap BaTii',nama:'Baru Dari Squad',nip:'198501012009012003',peran:'Anggota'},
  {sheet:'ST ICS',squadTeam:'Squad Team Koordinator Pengelola Proyek Tingkat Eselon I',unitEselonI:'DJPB',nama:'PIC Bersama',nip:'198501012009012004',jabatan:'Analis',peran:'Ketua',fotoId:'avatar1',email:'kantor@kemenkeu.go.id'},
  {sheet:'ST CM',squadTeam:'Squad Team Koordinator Pengelola Perubahan Tingkat Eselon I',unitEselonI:'DJPB',nama:'PIC Bersama',nip:'198501012009012004',peran:'Anggota'},
  {sheet:'ST CM',squadTeam:'Squad Team Koordinator Pengelola Perubahan Tingkat Eselon I',unitEselonI:'DJPK',nama:'PIC CMO DJPK',nip:'198501012009012005',peran:'Ketua'},
  {sheet:'ST ICS',squadTeam:'Squad Team Perbaikan Proses Bisnis PNBP',unitEselonI:'DJA',nama:'Kandidat Pemilik Probis',nip:'198501012009012006',peran:'Ketua'},
  {sheet:'ST ICS',squadTeam:'Squad Team Perbaikan Proses Bisnis PNBP',unitEselonI:'DJA',nama:'Anggota Probis Bukan Pemilik',nip:'198501012009012007',peran:'Anggota'},
  {sheet:'ST ICS',squadTeam:'Squad Team Pengembangan Data Infrastruktur',unitEselonI:'DJA',nama:'Pegawai Tidak Relevan',nip:'198501012009012008',peran:'Anggota'}
 ]
};
const parsed=api.parseBackup(sample);
assert.equal(parsed.resourcesCount,2);assert.equal(parsed.contactsCount,8);
assert.equal(parsed.entries.length,6,'2 resource + 1 additional CM + 2 unit contacts + 1 owner candidate');
assert.equal(parsed.entries.filter(x=>x.kind==='res').length,2);
assert.equal(parsed.entries.filter(x=>x.kind==='cm').length,1);
assert.equal(parsed.entries.filter(x=>x.kind==='pmo').length,1);
assert.equal(parsed.entries.filter(x=>x.kind==='cmo').length,1);
assert.equal(parsed.entries.filter(x=>x.kind==='candidate').length,1);
assert.equal(parsed.excluded.other,2);
const combined=parsed.entries.find(x=>x.n==='PIC Bersama');
assert.deepEqual(plain(combined.peran).sort(),['cmo','pmo']);
assert.equal(combined.unit,'DJPb');
assert.equal(combined.sourceUnit,'DJPB');
assert.equal(combined.photo,'data:image/png;base64,AAAA');
assert.equal(parsed.entries.find(x=>x.kind==='candidate').selected,false,'inferred owner must be opt-in');
assert.equal(parsed.entries.find(x=>x.n==='Pegawai Tim CM').labels.length,2,'CM resource and Squad must unify');
assert(!parsed.entries.some(x=>x.n==='Pegawai Tidak Relevan'),'Unrelated squads must not import');

let M={pic:[]},k={tims:['Tim DCS','Tim DOA','Tim SPP','Tim SSB','Tim CM'],pt:{}},saved=[],contacts=[],saves=0;
const deps={
 actMaster:()=>M,actMasterSave:x=>{M=x;saves++},kpCfg:()=>k,kpPeople:()=>contacts.map(x=>({...x})),
 kpPersonSave:(p)=>{
  if(p._id){
   let i=contacts.findIndex(x=>x._id===p._id);
   if(i>=0)contacts[i]={...p};else contacts.push({...p});
   return p._id;
  }
  const id='cfg-kp-'+(contacts.length+1);contacts.push({...p,_id:id});return id;
 },mapRes:(r)=>({n:r.nama,nip:r.nip||'',jab:r.jabatan||'',wfhDays:r.wfhDays||[],cuti:r.rencanaCuti||[],emailK:r.emailKemenkeu||'',hp:r.noHp||'',jenis:'Definitif',status:'WFO'}),save:()=>{saves++}
};
const selection=parsed.entries.filter(x=>x.selected);
const stats=api.applySelection(selection,deps);
assert.equal(stats.profilesNew,3);assert.equal(stats.contactsNew,2);
assert.equal(M.pic.length,3);assert.equal(contacts.length,2);
assert.equal(k.pt['Pegawai Tim CM'],'Tim CM');
assert.equal(k.pt['Baru Dari Squad'],'Tim CM');
assert(!k.pt['PIC Bersama'],'Unit PIC must NOT get a Pusmantap team');
assert(M.pic.find(x=>x.n==='Pegawai Tim CM').wfhDays.includes(5));
assert.deepEqual(plain(contacts.find(x=>x.nama==='PIC Bersama').peran).sort(),['cmo','pmo']);
assert.equal(contacts.find(x=>x.nama==='PIC CMO DJPK').unit,'DJPK');
assert.equal(contacts.find(x=>x.nama==='PIC Bersama').unit,'DJPb');
assert.equal(contacts.find(x=>x.nama==='PIC Bersama').foto,'data:image/png;base64,AAAA');
assert(/Unit sumber: DJPB/.test(contacts.find(x=>x.nama==='PIC Bersama').ket));
assert.equal(api.unitCode('Dit. SP DJPB (PMO UE I)'),'DJPb');
const again=api.applySelection(selection,deps);
assert.equal(again.profilesNew,0);assert.equal(again.contactsNew,0);
assert.equal(M.pic.length,3);assert.equal(contacts.length,2);
assert(!contacts.some(x=>x.nama==='Kandidat Pemilik Probis'));
const withOwner=api.applySelection([parsed.entries.find(x=>x.kind==='candidate')],deps);
assert.equal(withOwner.contactsNew,1);assert(contacts.some(x=>x.peran.includes('probis')));

const existingContact=contacts.find(x=>x.nama==='PIC Bersama');
existingContact.ket='Catatan manual tidak boleh ditimpa';
existingContact.email='khusus@kemenkeu.go.id';
api.applySelection(selection,deps);
assert.equal(contacts.find(x=>x.nama==='PIC Bersama').ket,'Catatan manual tidak boleh ditimpa');
assert.equal(contacts.find(x=>x.nama==='PIC Bersama').email,'khusus@kemenkeu.go.id');

assert.throws(()=>api.parseBackup({agendas:[]}),/tidak memiliki resources/);
const unrelated=api.parseBackup({contacts:[sample.contacts[7]]});
assert.equal(unrelated.entries.length,0);

const ui=fs.readFileSync('mt-tim2.js','utf8');
assert(ui.includes('mt-dcm-squad-import.js?v=20261114-01'),'Existing button must load new importer');
assert(ui.includes("if(v==='dcm')impDcm()"),'Existing chooser wiring must remain');
assert(ui.includes('Tim CM + PIC PMO/CMO/Probis'),'Chooser should explain both source categories');
// Verify the filter against the actual bundled Dashboard CM Squad Team fixture.
const sourceHtml=fs.readFileSync('dashboard-cm-shared.html','utf8');
const seed=sourceHtml.match(/<script id="contactSeedJson" type="application\/json">([\s\S]*?)<\/script>/);
assert(seed,'Bundled Squad Team source missing');
const seedContacts=JSON.parse(seed[1]);
const reality=api.parseBackup({kind:'cm-dashboard-backup',contacts:seedContacts});
const groupCounts={};
for(const x of reality.entries)groupCounts[x.kind]=(groupCounts[x.kind]||0)+1;
assert(groupCounts.cm>0&&groupCounts.pmo>0&&groupCounts.cmo>0,'Real Squad data needs Tim CM, PMO Unit, CMO Unit');
assert(groupCounts.candidate>0,'Process-business lead candidates must be surfaced for verification');
assert(reality.excluded.other>0,'Non-target Squad Team members must be excluded');
assert(reality.entries.every(x=>x.kind!=='candidate'||!x.selected),'No inferred business owner can import silently');
assert(reality.entries.every(x=>!x.unit||!x.unit.includes('undefined')),'Unit mapping must be valid');
console.log('PASS real Squad source filters (counts only):',JSON.stringify({total:seedContacts.length,eligible:reality.entries.length,excluded:reality.excluded.other,groups:groupCounts}));
console.log('PASS: Resource, CM Squad, PMO, CMO, owner review; safe IDs, dedup, idempotent merge, unit contacts and existing data');
