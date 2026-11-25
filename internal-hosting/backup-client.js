/* Internal-hosting client. Opt-in only; no Firebase fallback. */
(function(root){
 'use strict';
 async function backupAll({includeAttachments=true,signal}={}){
  const r=await fetch('/api/v1/backup?attachments='+(includeAttachments?'1':'0'),{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{Accept:'application/json'},signal});
  if(!r.ok)throw Error('Backup database internal gagal (HTTP '+r.status+').');
  const p=await r.json();
  if(p.kind!=='mt-full-backup'||p.version!==1||p.source?.mode!=='internal-api'||!p.source?.databaseId||p.includesAttachments!==includeAttachments||!p.collections||!p.counts)throw Error('Respons backup tidak valid.');
  const names=Object.keys(p.collections);
  if(!names.length||Object.keys(p.counts).length!==names.length||names.some(k=>!Array.isArray(p.collections[k])||p.counts[k]!==p.collections[k].length)||includeAttachments&&!Object.hasOwn(p.collections,'files'))throw Error('Backup tidak lengkap.');
  const blob=new Blob([JSON.stringify(p)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='MT_Backup_All_'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  return p.counts;
 }
 root.MTInternalBackup=Object.freeze({backupAll});
})(window);
