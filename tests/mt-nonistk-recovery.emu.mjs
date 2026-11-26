// Actual XLSX bytes and SDK against loopback emulator only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc,runTransaction} from 'firebase/firestore';
const require=createRequire(import.meta.url);
const XLSX=require('xlsx'),{setup}=require('./mt-nonistk-harness.cjs');
if(!['127.0.0.1:8080','localhost:8080'].includes(process.env.FIRESTORE_EMULATOR_HOST))throw Error('Local emulator at port 8080 required; refusing to run');
const env=await initializeTestEnvironment({projectId:'demo-mt',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
try{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await setDoc(doc(db,'config','akses'),{v:{}});await setDoc(doc(db,'users','pmo@kemenkeu.go.id'),{role:'PMOK',aktif:true,email:'pmo@kemenkeu.go.id'});await setDoc(doc(db,'users','unit@kemenkeu.go.id'),{role:'PMOU',aktif:true,email:'unit@kemenkeu.go.id'});});
 const db=env.authenticatedContext('pmo',{email:'pmo@kemenkeu.go.id'}).firestore();
 const id='non-2027',ref=doc(db,'psKka',id);
 const wb=XLSX.utils.book_new(),row=Array(25).fill('');row[0]='DUMMY-01';row[1]='Modul dummy Non-ISTK';row[8]='BaTii';row[18]=12;row[19]=3;row[20]=4;row[21]='Ya';
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([...Array.from({length:7},()=>['Header']),row]),'Usulan');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['ID','Nama','Unit','K1','K2','K3','K4','K5','K6','K7'],['DUMMY-01',row[1],'BaTii',4,4,4,4,4,4,4]]),'Penilaian');
 const bytes=XLSX.write(wb,{type:'array',bookType:'xlsx'});
 const shared={storage:new Map(),doc:null,writes:0,reads:0};let ackLost=false,writes=0;
 const adapter={collection:c=>({doc:i=>doc(db,c,i)}),runTransaction:async cb=>{const v=await runTransaction(db,async tx=>cb({get:async r=>{const s=await tx.get(r);return {exists:s.exists(),data:()=>s.data()}},set:(r,d)=>{writes++;tx.set(r,d)}}));if(ackLost)throw Error('Simulated lost acknowledgement after commit');return v}};
 const open=()=>{const x=setup(shared,{db:adapter,XLSX,uid:randomUUID});x.c.FB.auth.currentUser={uid:'pmo',email:'pmo@kemenkeu.go.id'};return x};
 let a=open();a.quota(true);await a.c.importFile({arrayBuffer:async()=>bytes});a.confirm();assert.ok(a.c.pendingImport(2027));assert.equal((await getDoc(ref)).exists(),false);
 let b=open();assert.ok(b.c.pendingImport(2027));ackLost=true;assert.equal(await b.c.syncImport(2027),false);let snap=await getDoc(ref);assert.equal(snap.data().projects.length,1);assert.equal(snap.data().projects[0].estimatedCost,12000000);assert.equal(snap.data().projects[0].kka.K1,4);
 const rows=snap.data().projects;rows[0].kka.K1=5;await updateDoc(ref,{projects:rows});const before=writes;
 ackLost=false;let c=open();assert.equal(await c.c.syncImport(2027),true);assert.equal(writes,before);assert.equal(open().c.pendingImport(2027),null);snap=await getDoc(ref);assert.equal(snap.data().projects.length,1);assert.equal(snap.data().projects[0].kka.K1,5);
 const other=env.authenticatedContext('unit',{email:'unit@kemenkeu.go.id'}).firestore();await assertFails(setDoc(doc(other,'psKka',id),{year:2027,projects:[]}));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'psKka',id)));
 console.log('PASS: XLSX import, durable pending across VM reload, emulator transaction, lost acknowledgement, no duplicate, preserve edit, permission checks.');
}finally{await env.cleanup()}
