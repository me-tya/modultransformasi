const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../project-selection-kka.js'),'utf8');
const start=source.indexOf('const nk=s=>'),end=source.indexOf('/* Usulan non-ISTK:',start);
if(start<0||end<=start)throw Error('KKA import functions not found');
const code=source.slice(start,end);
function setup(shared={storage:new Map(),doc:null,writes:0,reads:0},options={}){
 let serial=0,hook,deny=false,quota=false,lose=false,removeFail=false,modalCallback;const data={},messages=[];
 const db=options.db||{collection:c=>({doc:id=>({c,id})}),runTransaction:async cb=>{if(deny)throw Error('permission denied');let staged;const result=await cb({get:async()=>{shared.reads++;if(hook)await hook();return {exists:!!shared.doc,data:()=>structuredClone(shared.doc)}},set:(_,v)=>{staged=structuredClone(v)}});if(staged){shared.doc=staged;shared.writes++}if(lose)throw Error('ack lost');return result}};
 const c={FB:{on:true,ready:true,cfg:{projectId:'demo-mt'},auth:{currentUser:{uid:'u1',email:'test@example.invalid'}},last:{},db},T:v=>String(v??'').trim(),E:v=>String(v??''),uid:()=>options.uid?options.uid():String(++serial),Date,TextEncoder,canCfg:()=>!deny,fsQuotaBlocked:()=>quota,fsQuotaAssert:()=>{if(quota)throw Error('quota')},NONK:y=>'non-'+y,stab:JSON.stringify,store:()=>data,say:m=>messages.push(m),render(){},localStorage:{getItem:k=>shared.storage.get(k)??null,setItem:(k,v)=>shared.storage.set(k,v),removeItem:k=>{if(removeFail)throw Error('storage');shared.storage.delete(k)}},year:()=>2027,window:{XLSX:options.XLSX},I:{pickedProgram:()=>null,readonly:()=>false},allProgs:()=>[],nonP:()=>({nonIstk:true,psProjects:[]}),GATES:[['kkaG1'],['kkaG2'],['kkaG3'],['kkaG4']],modal:(_t,_h,_b,cb)=>{modalCallback=cb},ui:()=>({}),save(){},log(){},roP:()=>false};
 vm.createContext(c);vm.runInContext(code,c);
 return {c,shared,data,messages,hook:f=>hook=f,deny:v=>deny=v,quota:v=>quota=v,lose:v=>lose=v,removeFail:v=>removeFail=v,confirm:()=>modalCallback({querySelector:id=>id==='#kka-imp-prog'?{value:'__nonistk'}:{checked:['#kka-imp-add','#kka-imp-est','#kka-imp-desc','#kka-imp-method'].includes(id)}})};
}
module.exports={setup};
