'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('Aktivitas: pembaruan ringkasan lampiran tidak memicu mutasi DOM berulang',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const start=source.indexOf('  const slSum=()=>');
  const end=source.indexOf("\n  ATT['one-und'].cb",start);
  assert.ok(start>0&&end>start,'Implementasi slSum ditemukan');
  assert.match(source,/new MutationObserver\(upd\)\.observe\(ov\.querySelector\('\.sw-bd'\),/);
  let countWrites=0,labelWrites=0;
  const count={
    _text:'',
    get textContent(){return this._text},
    set textContent(v){countWrites++;this._text=v}
  };
  const label={
    dataset:{},
    set innerHTML(v){labelWrites++}
  };
  const status={value:'',hidden:false};
  const el={
    dataset:{slid:'one-und',sl:'und'},
    querySelector(sel){
      return sel==='[data-slc]'?count:sel==='[data-sls]'?label:
        sel==='#one-undStatus'?status:null;
    },
    classList:{toggle(){}}
  };
  const ov={
    querySelectorAll(sel){return sel==='.sl'?[el]:[]},
    querySelector(sel){return sel==='#at-no-one-und'?{value:''}:null}
  };
  const ATT={'one-und':{items:[{nama:'surat.pdf'}]}};
  const context=vm.createContext({ov,ATT,esc:s=>String(s)});
  vm.runInContext(source.slice(start,end)+'\nslSum(); slSum();',context);
  assert.equal(countWrites,1,'Teks jumlah dokumen hanya berubah sekali');
  assert.equal(labelWrites,1,'Label lampiran hanya berubah sekali');
});
