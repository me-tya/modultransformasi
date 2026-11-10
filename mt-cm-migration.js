/* Modul Transformasi — impor paket ZIP dari Dashboard CM.
   Lampiran disimpan melalui fileStore() ke koleksi files MT; tidak menyimpan Base64 di dokumen aktivitas. */
(function(){
  const parseArray=v=>{if(Array.isArray(v))return v;if(typeof v==='string'){try{const d=JSON.parse(v);return Array.isArray(d)?d:[]}catch(e){return []}}return []};
  const progress=t=>{const node=document.getElementById('act-migration-status');if(node)node.textContent=t};
  const fieldMap={dokumentasi:'dok',notula:'notula',undanganFiles:'und',suratTugasFiles:'st',materiFiles:'materi'};
  async function importZip(file){
    if(!actCanEdit())throw Error('Tidak memiliki izin mengimpor aktivitas.');
    if(!FB.on||!FB.ready)throw Error('Hubungkan Firebase Modul Transformasi terlebih dahulu agar lampiran tersimpan di server, bukan di browser lokal.');
    if(typeof JSZip==='undefined')throw Error('JSZip belum siap.');
    const zip=await JSZip.loadAsync(file);
    const mf=zip.file('manifest.json');
    if(!mf)throw Error('Paket tidak memiliki manifest.json.');
    const manifest=JSON.parse(await mf.async('string'));
    if(manifest.kind!=='cm-mt-activity-bundle'||manifest.version!==1||!Array.isArray(manifest.agendas)||!Array.isArray(manifest.files))throw Error('Format paket migrasi tidak dikenal.');
    if(manifest.agendas.length>10000||manifest.files.length>50000)throw Error('Paket melampaui batas keamanan.');
    const idSet=new Set(),sourceMap=new Map();
    for(const a of manifest.agendas){
      if(!a||typeof a.id!=='string'||!a.id||idSet.has(a.id))throw Error('ID aktivitas tidak valid atau duplikat.');
      idSet.add(a.id);sourceMap.set(a.id,a);
    }
    const valid=manifest.files.filter(v=>v&&typeof v.refId==='string'&&v.path&&!v.error);
    const failed=manifest.files.length-valid.length;
    if(!confirm('Impor '+manifest.agendas.length+' aktivitas dan '+valid.length+' lampiran dari paket Dashboard CM ke Firebase Modul Transformasi? Aktivitas dengan ID sama diperbarui; data sumber tidak dihapus.'))return;
    progress('Mengimpor data aktivitas...');
    const result=actImportDashboardBackup({agendas:manifest.agendas});
    const refs=new Map();
    for(const a of manifest.agendas){
      for(const [source,dest] of Object.entries(fieldMap)){
        for(const item of parseArray(a[source])){
          if(item&&item.refId){
            const arr=refs.get(item.refId)||[];
            arr.push({activityId:a.id,dest,name:item.name||item.fileName||'Lampiran'});
            refs.set(item.refId,arr);
          }
        }
      }
    }
    let stored=0,skipped=0,errors=failed;
    const report=manifest.files.filter(x=>x.error).map(x=>({refId:x.refId,reason:x.error}));
    for(const entry of valid){
      const targets=refs.get(entry.refId)||[];
      if(!targets.length){skipped++;continue;}
      const pending=targets.filter(t=>{
        const x=(S.oneonone||[]).find(z=>z.cmDashboardId===t.activityId);
        if(!x)return false;
        return !(attNorm(x[t.dest]).items||[]).some(i=>i.sourceRefId===entry.refId&&i.t==='f');
      });
      if(!pending.length){skipped++;continue;}
      try{
        const expected='files/'+encodeURIComponent(entry.refId)+'.bin';
        if(entry.path!==expected)throw Error('Path lampiran tidak sesuai ID');
        const zf=zip.file(expected);
        if(!zf)throw Error('File ZIP tidak ada');
        const blob=await zf.async('blob');
        if(!blob.size||blob.size>30*1024*1024)throw Error('Ukuran lampiran tidak sesuai batas (30 MB)');
        const name=String(entry.name||pending[0].name||'Lampiran').replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);
        const upload=new File([blob],name,{type:entry.mime||'application/octet-stream'});
        const saved=await fileStore(upload);
        saved.sourceRefId=entry.refId;
        for(const t of pending){
          const x=(S.oneonone||[]).find(z=>z.cmDashboardId===t.activityId);
          if(!x)continue;
          const att=attNorm(x[t.dest]);
          const existing=att.items.findIndex(i=>i.externalRefId===entry.refId||i.sourceRefId===entry.refId);
          if(existing>=0)att.items.splice(existing,1);
          att.items.push({...saved,nama:t.name||saved.nama});
          x[t.dest]=att;
        }
        stored++;
        if(stored%10===0)save();
      }catch(e){
        errors++;report.push({refId:entry.refId,reason:e?.message||String(e)});
        console.warn('Migrasi berkas gagal',entry.refId,e);
      }
      progress('Memindahkan file '+(stored+skipped+errors-failed)+'/'+valid.length+' · berhasil '+stored+' · gagal '+errors);
    }
    save();render();
    if(report.length){
      const payload={kind:'cm-mt-migration-report',at:new Date().toISOString(),source:manifest.sourceProject||'DashboardCM',failed:report};
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='CM_Migration_Failed_Files.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }
    const final='Impor selesai: '+manifest.agendas.length+' aktivitas (baru '+result.added+', diperbarui '+result.updated+'), '+stored+' file tersimpan, '+skipped+' dilewati, '+errors+' file gagal/tidak tersedia.';
    progress(final);toast(final);
  }
  ACT.actZipImport=()=>{
    if(!actCanEdit())return toast('Tidak berwenang mengimpor aktivitas.');
    const inp=document.getElementById('act-migration-zip');
    if(inp)inp.click();
  };
  document.addEventListener('change',async e=>{
    if(e.target?.id!=='act-migration-zip')return;
    const f=e.target.files&&e.target.files[0];e.target.value='';
    if(!f)return;
    try{await importZip(f)}catch(err){const msg='Gagal mengimpor paket: '+(err?.message||String(err));progress(msg);toast(msg);}
  },true);
})();
