'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'..','index.html'),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(v=>v.includes('function editOneOnOne'));
const slot=html.slice(html.indexOf('const slot=(k,title,cls)=>'),html.indexOf('const mfld=',html.indexOf('const slot=(k,title,cls)=>')));

test('Aktivitas: skrip utama tetap valid',()=>{
 const {Script}=require('node:vm');
 assert.doesNotThrow(()=>new Script(script));
});
test('Dasar surat: ikon interaktif, tombol duplikat terhapus, kontrol ringkas',()=>{
 assert.match(slot,/class="sl-ic \$\{cls\} sl-create" data-gen="\$\{k\}"/);
 assert.doesNotMatch(slot,/mt-docgen/);
 for(const kind of ['link','file','tog'])assert.ok(slot.includes('data-slk="'+kind+'" title='));
 assert.match(html,/const isUnd=el\.dataset\.sl==='und'/);
 assert.match(html,/Hal surat undangan/);
 assert.doesNotMatch(html,/class="sl-tag cur">TERBARU/);
});
test('PIC: pegawai Pusmantap lengkap dan kelompok penugasan dipisahkan',()=>{
 for(const n of ['Arifudin Miftakhul Huda','Atitya Pritasari','Kurniawan Jabar Malik','Sarah Khairina','Dina Septiani','Johan Pandu Asa','Muhammad Nailun Najih','Andos Heriyanto Hutahaean','Meida Embrianto','Winny Irmarooke','Alfarisi Muslim']){
   assert.ok(html.includes(n),'PIC tidak ditemukan: '+n);
 }
 for(const part of ['Tim Change Management','Pegawai Pusmantap Lainnya','Pegawai Sementara'])assert.ok(html.includes(part));
});
test('Notula: kontrol disederhanakan dan dua editor tersimpan',()=>{
 assert.match(html,/class="act-nlbtn" data-gen="notula"/);
 assert.match(html,/class="mt-nlinfo"/);
 assert.match(html,/id="one-rte-sim" contenteditable="true"/);
 assert.match(html,/data-rtefont/);assert.match(html,/data-rtesize/);
 assert.match(html,/data-rteindent/);assert.match(html,/data-cmd="\$\{c\}"/);
 assert.match(html,/into\.notulaSimHtml=/);
 assert.match(html,/simRich=actSimItems/);
 assert.match(html,/actDocxRuns\(\(M\.simRich\[i\]/);
});
test('Notula: pratinjau lebih mendekati kertas Word, DOCX page margin tetap',()=>{
 assert.match(html,/#nl-pv \.nl-pg\{box-sizing:border-box;max-width:none;width:794px/);
 assert.match(html,/padding:48px 76px 74px 94px/);
 assert.match(html,/class="nl-sign-spacer"/);
 assert.match(html,/w:pgMar w:top="720" w:right="1134" w:bottom="/);
 assert.match(html,/w:left="1418"/);
 assert.match(html,/notaIndent=\(M\.fmt\.indent\|\|0\)\*28\.35/);
});
