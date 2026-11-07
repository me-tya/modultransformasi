/* Arsip perhitungan WBS 2026, diturunkan dari cached formula:
   - Capaian T-Program: B:H, baris 3–9
   - Capaian per UE1: B:H, baris 2–15
   Sumber: WBS Transformation Program 2026 (8)(1).xlsx.
   Ini snapshot laporan historis TW I–III 2026, BUKAN rumus dinamis untuk 2027+.
   Kegiatan yang masih berjalan tetap dihitung dari item WBS yang tersimpan. */
(function(){
 'use strict';
 const program={"OA":[2610,7185,10399,16753,4113,9589,10767],"CORE":[2197,25213,29669,64062,4860,27389,30555],"TKD":[200,204,204,204,204,204,204],"SP":[329,660,4208,5982,971,4025,4208],"SD":[282,616,797,1195,282,661,797],"SSB":[0,233,727,1616,0,233,727]};
 const unit={"Setjen":[1890,16354,19886,27948,3872,19260,20896],"DJSEF":[1260,4693,8705,12655,4131,9057,9715],"DJA":[1679,8899,16527,30005,5192,16675,17139],"DJP":[1563,4570,10737,15608,3259,10384,11105],"DJBC":[1499,4269,9942,15086,3191,10297,10952],"DJPb":[1264,3876,6403,9592,2318,6325,6771],"DJKN":[2039,7932,15492,25491,5672,15447,15860],"DJPK":[2223,10442,18161,30640,5860,17957,18529],"DJPPR":[1260,11028,15227,25862,4493,15178,15595],"DJSPSK":[3007,16423,26233,40652,7000,23938,26601],"Itjen":[1710,4755,6880,11809,2942,7204,7248],"BaTii":[5618,34111,45974,89660,10430,42101,47228],"BPPK":[1440,4150,6597,8897,2490,6599,6965],"LNSW":[1499,4269,9942,14016,3191,10083,10310]};
 const mk=(v,q)=>{const t=v[q-1],r=v[q+3],a=v[3];return [t,r,a,a?Math.round(r/a*10000)/100:null,null,null,null,null]};
 const s={};
 for(let q=1;q<=3;q++){
   const p={},u={};
   Object.keys(program).forEach(k=>p[k]=mk(program[k],q));
   Object.keys(unit).forEach(k=>u[k]=mk(unit[k],q));
   const participants=q===1?['OA','CORE','TKD','SP','SD']:['OA','CORE','SP','SD','SSB'];
   const annuals=q===1?Object.keys(program):participants;
   const target=participants.reduce((n,k)=>n+program[k][q-1],0);
   const real=participants.reduce((n,k)=>n+program[k][q+3],0);
   const annual=annuals.reduce((n,k)=>n+program[k][3],0);
   const tot=[target,real,annual,annual?Math.round(real/annual*10000)/100:null,null,null,null,null];
   s['2026-'+q]={cut:['2026-03-31','2026-06-30','2026-09-30'][q-1],
     at:'2026-11-07',by:'Rekap workbook WBS 2026',how:'excel-reference',source:'Capaian T-Program / Capaian per UE1',n:null,
     tot,prog:p,ue:u};
 }
 /* Koreksi TW II 2026: tabel Excel terbaru pada gambar pengguna (7 Nov 2026).
    Berbeda dengan workbook (8)(1) terdahulu. Setiap nilai disimpan sebagai
    target, realisasi dan target tahunan; persentase SELALU dihitung saat tampil. */
 const newerTw2={
  OA:[6942,7392,16478],
  CORE:[25213,25688,63757],
  SP:[660,660,9070],
  SD:[616,616,1195],
  SSB:[233,233,5385]
 };
 const q2=s['2026-2'],entry=x=>[x[0],x[1],x[2],x[2]?x[1]/x[2]*100:null,null,null,null,null];
 q2.prog=Object.fromEntries(Object.entries(newerTw2).map(([code,v])=>[code,entry(v)]));
 const rows=Object.values(newerTw2);
 q2.tot=entry([rows.reduce((n,v)=>n+v[0],0),rows.reduce((n,v)=>n+v[1],0),rows.reduce((n,v)=>n+v[2],0)]);
 if(q2.tot[0]!==33664||q2.tot[1]!==34589||q2.tot[2]!==95885)throw Error('Rekap TW II 2026 tidak konsisten');
 q2.ue={}; // Rekap UE I untuk versi TW II terbaru belum diberikan; jangan gunakan UE I versi lama.
 q2.source='Tabel Excel Capaian TW II terbaru (gambar pengguna, 7 November 2026)';
 q2.by='Rekap TW II dari gambar Excel terbaru';
 q2.at='2026-11-07';
 window.WBS_CAP_REFERENSI_2026=s;
})();