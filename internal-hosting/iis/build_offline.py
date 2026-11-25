"""Build an isolated IIS staging web root. Network is required only on build host."""
import re, shutil, pathlib, urllib.request, hashlib, json
root=pathlib.Path(__file__).resolve().parents[2]
out=root/'internal-hosting/iis/wwwroot'
out.mkdir(parents=True,exist_ok=True)
vendor=out/'vendor';vendor.mkdir(exist_ok=True)
manifest={}
def fetch(url,name=None):
    name=name or hashlib.sha256(url.encode()).hexdigest()[:12]+'-'+url.rsplit('/',1)[-1].split('?')[0]
    path=vendor/name;path.parent.mkdir(parents=True,exist_ok=True)
    if not path.exists():
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 OfflineBuild'})
        with urllib.request.urlopen(req,timeout=90) as r: data=r.read()
        if not data: raise ValueError('Empty dependency '+url)
        path.write_bytes(data)
    manifest[url]={'file':'vendor/'+name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    return 'vendor/'+name
def exactly(s,a,b):
    if s.count(a)!=1: raise ValueError('Patch anchor changed: '+a[:90])
    return s.replace(a,b,1)
def block(s,a,b,replacement):
    i=s.index(a);j=s.index(b,i)
    return s[:i]+replacement+'\n'+s[j:]
def patch_index(s):
    s=block(s,'const FIREBASE_CONFIG=','const FS_ARR=', 'const FIREBASE_CONFIG={projectId:"ModulTransformasi"};\nconst RULES="Otorisasi API internal";')
    s=block(s,'async function fbInit(){','function demoUsers()', 'async function fbInit(){FB.db=MTLocal.db;FB.auth=MTLocal.auth;FB.cfg=FIREBASE_CONFIG;FB.on=true;return true}')
    s=block(s,'function bootstrapUI(email)','function splashOn(txt)', 'function bootstrapUI(){renderLogin("Database belum diimpor. Hubungi administrator server.")}\nasync function fbCreateAuth(){throw Error("Administrator server harus menetapkan kata sandi lokal melalui MT.exe set-password.")}')
    s=block(s,'function viewDb(){','/* ======== Import charter', '''function viewDb(){return vh('DB','adm','Database','SQL Server Express lokal · IIS')+
      '<div class="card"><div class="ch"><h3>Status koneksi</h3></div><div class="pad"><p>'+esc(FB.st||'Belum tersambung')+'</p><p>Data disimpan di SQL Server; lampiran di folder server.</p>'+
      (mtBackupAllowed()?'<button class="btn pri" data-act="mtBackupAll">Backup All (JSON)</button>':'')+'</div></div>'}
      ACT.fbsave=ACT.fboff=ACT.cprules=ACT.fbaccts=()=>toast('Pengaturan dikelola administrator server.');''')
    s=block(s,'async function mtBuildFullBackup(includeFiles,progress){','function mtBackupFileName()', '''async function mtBuildFullBackup(includeFiles,progress){mtBackupAssert();if(!FB.ready||FB.err||/Menyimpan/i.test(FB.st||''))throw Error('Selesaikan sinkronisasi sebelum backup.');await FB.db.waitForPendingWrites();return MTLocal.backup(includeFiles,progress)}''')
    s=block(s,'async function mtBackupReadCollection(name,progress){','async function mtBackupLocalFiles','')
    s=re.sub(r'<div class="demo"><h4>Pilih akun uji.*?</div></form>','</form>',s,count=1)
    s=block(s,' '+chr(36)+'{FB.on?'+chr(96)+'<div class="proto"',' '+chr(36)+'{err?',' <div class="proto"><b>Login lokal</b> · SQL Server Express / IIS. Gunakan kata sandi aplikasi yang diberikan administrator.</div>')
    s=exactly(s,"const PW='Transformasi2026';","const PW='';")
    s=exactly(s,"if(!fbCfg()){load();","if(false){load();")
    s=exactly(s,"S=fsBlank();readHash();const sp=splashOn('Menghubungkan ke Firestore…');","S=fsBlank();FB.on=true;readHash();const sp=splashOn('Menghubungkan ke SQL Server…');")
    s=s.replace("FB.auth.currentUser.updatePassword(v).then(","MTLocal.req('password',{oldPassword:prompt('Kata sandi saat ini')||'',password:v},'POST').then(")
    s=s.replace("Minimal 8 karakter.","Minimal 12 karakter.").replace("if(v.length<8)","if(v.length<12)").replace("min. 8 karakter","min. 12 karakter")
    s=s.replace("Firestore","SQL Server").replace("Firebase Authentication","login lokal").replace("Firebase","server internal")
    s=s.replace('const cl=fsClean(cur[c][id])','const cl=cur[c][id]').replace('const FS_MAX=1000000;','const FS_MAX=8000000;')
    s=re.sub(r'<script src="mt-dcm-activity-sync\.js[^"]*"></script>','',s)
    s=re.sub(r'<iframe class="mt-cm-frame" src="dashboard-cm-shared\.html[^>]*></iframe>','<div class="note w">Modul Dashboard CM tertanam belum dimigrasikan. Integrasi eksternal dinonaktifkan pada build offline.</div>',s)
    s=s.replace("createWorker('ind+eng',1,{logger:", "createWorker('ind+eng',1,{workerPath:'vendor/ocr-worker.min.js',corePath:'vendor/ocr-core',langPath:'vendor/ocr-lang',workerBlobURL:false,logger:")
    s=s.replace('Mesin OCR tidak dapat dimuat (perlu koneksi internet).','Mesin OCR lokal tidak dapat dimuat.')
    s=re.sub(r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>','',s)
    return '<script src="mt-local.js"></script>\n'+s
urls=re.compile(r'https://(?:cdnjs\.cloudflare\.com/ajax/libs|cdn\.jsdelivr\.net/npm|unpkg\.com)/[A-Za-z0-9@_./+-]+')
for p in root.iterdir():
    if p.suffix not in ('.js','.css','.html') or p.name in ('index2.html','dashboard-cm-shared.html','mt-dcm-activity-sync.js'):continue
    s=p.read_text(encoding='utf-8')
    if p.name=='index.html': s=patch_index(s)
    if p.name=='mt-dcm-report.js':
        s=block(s,'function cmAiWorkerUrl(){','\n', 'function cmAiWorkerUrl(){return ""}')
        s=s.replace("https://cm-assistant.ristya-onlineshop.workers.dev","")
    if p.name=='mt-activity-reports.js': s=block(s,'function aiWorker(){','\n','function aiWorker(){return ""}')
    def local(m):
        url=m.group()
        if url.endswith('.js') or url.endswith('.css'):
            if '/pdf.js/3.11.174/' in url: url='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/'+url.rsplit('/',1)[-1]
            return fetch(url)
        raise ValueError('Unrecognized dependency '+url)
    s=urls.sub(local,s)
    (out/p.name).write_text(s,encoding='utf-8')
shutil.copy(root/'internal-hosting/iis/mt-local.js',out/'mt-local.js')
fetch('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js','ocr-worker.min.js')
for n in ('tesseract-core.wasm.js','tesseract-core.wasm','tesseract-core-simd.wasm.js','tesseract-core-simd.wasm','tesseract-core-lstm.wasm.js','tesseract-core-lstm.wasm','tesseract-core-simd-lstm.wasm.js','tesseract-core-simd-lstm.wasm'):
    fetch('https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/'+n,'ocr-core/'+n)
for l in ('ind','eng'): fetch('https://tessdata.projectnaptha.com/4.0.0_fast/'+l+'.traineddata.gz','ocr-lang/'+l+'.traineddata.gz')
(out/'offline-assets.json').write_text(json.dumps(manifest,indent=2))
print('Local dependency assets:',len(manifest))
