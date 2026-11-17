#!/usr/bin/env python3
"""Safely integrate PM/CM WBS into the existing Modul Transformasi activity wizard."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'activity-wbs-mt.js' in s:
    print('Already integrated; no changes')
    raise SystemExit(0)
def change(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f'{label}: expected one anchor, found {n}')
    s=s.replace(old,new,1)
s=s.replace('</head>',
       '<link rel="stylesheet" href="activity-wbs.css">\n<script defer src="activity-wbs.js"></script>\n<script defer src="activity-wbs-mt.js"></script>\n</head>',
       1)
change('    <div class="sw-g2" data-one><div class="fld"><label for="one-tw">Triwulan</label>',
       '    '+chr(36)+'{window.ActivityWBS.formHTML(item)}\n    <div class="sw-g2" data-one><div class="fld"><label for="one-tw">Triwulan</label>',
       'put classification after program in existing wizard')
change('document.body.appendChild(ov);actHydrateThumbs(ov);setTimeout(()=>oneUicEnhance(ov),0);',
       'document.body.appendChild(ov);window.ActivityWBS.wire(ov);actHydrateThumbs(ov);setTimeout(()=>oneUicEnhance(ov),0);',
       'wire stage dropdowns')
change('  const collect=(into,withAtt)=>{',
       """  const collect=(into,withAtt)=>{
   const w=ov.querySelector('[data-wbs-form]'),g=w?.querySelector('input[name="wbsGroup"]:checked')?.value||'';
   into.wbsGroup=g;
   into.wbsLevel4=g==='CM'?'Manajemen Perubahan':w?.querySelector('[name="wbsLevel4"]')?.value||'';
   into.wbsLevel5=w?.querySelector('[name="wbsLevel5"]')?.value||'';
""",
       'persist WBS in activity source entity')
change('  const doSave=(andClose)=>{',
       """  const doSave=(andClose)=>{
   const w=ov.querySelector('[data-wbs-form]'),g=w?.querySelector('input[name="wbsGroup"]:checked')?.value||'';
   const k=g==='CM'?'Manajemen Perubahan':w?.querySelector('[name="wbsLevel4"]')?.value||'';
   const stage=w?.querySelector('[name="wbsLevel5"]')?.value||'';
   if(!window.ActivityWBS.valid(g,k,stage)){toast('Pilih PM/CM, WBS Level 4, dan WBS Level 5 sebelum menyimpan aktivitas.');go(1);return false}
""",
       'validate WBS before saving activity')
change('&&(!qq||actHay(x).includes(qq)));',
       "&&(!qq||actHay(x).includes(qq))&&window.ActivityWBS.mtMatch(x,U));",
       'apply WBS to activity table filters')
change("  const editable=actCanEdit(),canDel=lv('wbs').includes('D'),hari=",
       "  window.ActivityWBS.mtLastFiltered=rows.slice();\n  const editable=actCanEdit(),canDel=lv('wbs').includes('D'),hari=",
       'export same filtered activity rows')
change("const nAct=[tw,kat,sf,pf,qq,U.actProg,U.actUnit,U.actLay,U.actFrom,U.actTo].filter(Boolean).length",
       "const nAct=[tw,kat,sf,pf,qq,U.actProg,U.actUnit,U.actLay,U.actFrom,U.actTo,U.actWbsGroup,U.actWbsLevel4,U.actWbsLevel5].filter(Boolean).length",
       'count WBS selected filters')
change("fsel('actKat','Semua Kategori',M.kat,kat)+fsel('actProg',",
       "fsel('actKat','Semua Kategori',M.kat,kat)+window.ActivityWBS.mtFilterHtml(U,fsel)+fsel('actProg',",
       'add three compact cascade filters')
change("'<span class=\"sp\"></span><button type=\"button\" class=\"act-cmpb\"",
       "'<span class=\"sp\"></span><button type=\"button\" class=\"act-repb\" data-wbs-export title=\"Ekspor daftar data dukung IKU aktivitas PM/CM sesuai filter\">⇩ IKU CSV</button><button type=\"button\" class=\"act-cmpb\"",
       'add direct IKU CSV export')
change("'<td>'+inv+'<div class=\"table-title\">'+esc(nm)+'</div>'",
       "'<td>'+inv+'<div class=\"table-title\">'+esc(nm)+'</div>'+(x.wbsGroup?'<div class=\"wbs-table-tag\">'+window.ActivityWBS.badge(x)+'</div>':'')",
       'show WBS labels in rows')
p.write_text(s,encoding='utf-8')
print('PM/CM WBS integrated in Modul Transformasi:',len(s),'bytes')
