// Uji aturan Firestore koleksi `oneonone` (Aktivitas & Kalender) di Firebase Emulator.
// Dijalankan oleh .github/workflows/uji-rules-firestore.yml:
//   firebase emulators:exec --only firestore --project demo-mt "node tests/firestore-rules.emu.mjs"
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, setLogLevel } from 'firebase/firestore';

setLogLevel('error');
const env = await initializeTestEnvironment({
  projectId: 'demo-mt',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

const U = {
  pmok: { role: 'PMOK', unit: 'BaTii' },
  cmok: { role: 'CMOK', unit: 'BaTii' },
  ketua: { role: 'KETUA', unit: 'BaTii' },
  kapus: { role: 'KAPUS', unit: 'BaTii' },
  sekpim: { role: 'SEKPIM', unit: 'BaTii' },
  pmouDjkn: { role: 'PMOU', unit: 'DJKN' },
  cmouDjkn: { role: 'CMOU', unit: 'DJKN' },
  pmouDjp: { role: 'PMOU', unit: 'DJP' },
  tim: { role: 'TIM', unit: 'Pusilki', modules: ['M1'] },
  timLain: { role: 'TIM', unit: 'Pusdatin', modules: ['M9'] },
  nonaktif: { role: 'PMOU', unit: 'DJKN', aktif: false },
};
const mail = k => `${k.toLowerCase()}@kemenkeu.go.id`;

await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'config/akses'), { v: {} });
  for (const [k, v] of Object.entries(U)) await setDoc(doc(db, 'users', mail(k)), { email: mail(k), aktif: true, modules: [], ...v });
  const A = (id, d) => setDoc(doc(db, 'oneonone', id), { id, kind: 'akt', nama: id, ...d });
  await A('pusat1', { ownGrp: 'pusat', ownUnit: '', ownMods: [], modKeys: [] });
  await A('pusatM1', { ownGrp: 'pusat', ownUnit: '', ownMods: [], modKeys: ['M1'], program: 'SIPN' });
  await A('djkn1', { ownGrp: 'unit', ownUnit: 'DJKN', ownMods: [], modKeys: [] });
  await A('djp1', { ownGrp: 'unit', ownUnit: 'DJP', ownMods: [], modKeys: [] });
  await A('tim1', { ownGrp: 'tim', ownUnit: '', ownMods: ['M1'], modKeys: ['M1'] });
  await setDoc(doc(db, 'oneonone', 'pub-tim'), { id: 'pub-tim', kind: 'cfg', ownGrp: 'cfg', pub: { units: {} } });
  await setDoc(doc(db, 'oneonone', 'cfg-kp-djkn'), { id: 'cfg-kp-djkn', kind: 'cfg', ownGrp: 'unit', ownUnit: 'DJKN', ownMods: [], modKeys: [], kp: { nama: 'Kontak', unit: 'DJKN' } });
  await setDoc(doc(db, 'oneonone', 'cfg-kp-x'), { id: 'cfg-kp-x', kind: 'cfg', ownGrp: 'cfg', kp: { nama: 'Pegawai', nip: '1990' } });
});

const as = k => env.authenticatedContext(k, { email: mail(k) }).firestore();
const col = db => collection(db, 'oneonone');
let pass = 0, fail = 0;
async function t(name, p) {
  try { await p; pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '—', e.message.split('\n')[0]); }
}

console.log('Pusat');
await t('PMOK membaca seluruh koleksi', assertSucceeds(getDocs(col(as('pmok')))));
await t('Ketua membaca seluruh koleksi', assertSucceeds(getDocs(col(as('ketua')))));
await t('Ketua tidak dapat menulis', assertFails(setDoc(doc(as('ketua'), 'oneonone', 'k1'), { ownGrp: 'pusat' })));
await t('CMOK membuat kegiatan Pusat', assertSucceeds(setDoc(doc(as('cmok'), 'oneonone', 'c1'), { ownGrp: 'pusat', ownUnit: '', ownMods: [], modKeys: [] })));
await t('PMOK menstempel dokumen lama', assertSucceeds(updateDoc(doc(as('pmok'), 'oneonone', 'pusat1'), { modKeys: ['M1'] })));

console.log('Ka. Pusmantap & Sekretaris');
await t('Ka. Pusmantap membaca seluruh koleksi', assertSucceeds(getDocs(col(as('kapus')))));
await t('Ka. Pusmantap tidak dapat menulis', assertFails(setDoc(doc(as('kapus'), 'oneonone', 'kp1'), { ownGrp: 'pusat' })));
await t('Sekretaris membaca seluruh koleksi', assertSucceeds(getDocs(col(as('sekpim')))));
await t('Sekretaris menulis agenda pimpinan', assertSucceeds(setDoc(doc(as('sekpim'), 'oneonone', 'cfg-agpim'), { id: 'cfg-agpim', kind: 'cfg', ownGrp: 'cfg', agpim: [] })));
await t('Sekretaris mengubah agenda pimpinan', assertSucceeds(updateDoc(doc(as('sekpim'), 'oneonone', 'cfg-agpim'), { agpim: [{ nama: 'Rapim' }] })));
await t('Sekretaris tidak bisa menulis kegiatan lain', assertFails(setDoc(doc(as('sekpim'), 'oneonone', 's1'), { ownGrp: 'pusat' })));
await t('Sekretaris tidak bisa mengubah data tim', assertFails(updateDoc(doc(as('sekpim'), 'oneonone', 'pub-tim'), { pub: {} })));

console.log('PMO/CMO Unit');
const qUnit = (db, u) => query(col(db), where('ownGrp', '==', 'unit'), where('ownUnit', '==', u));
await t('PMOU DJKN query kegiatan DJKN', assertSucceeds(getDocs(qUnit(as('pmouDjkn'), 'DJKN'))));
await t('CMOU DJKN ikut membaca kegiatan DJKN', assertSucceeds(getDoc(doc(as('cmouDjkn'), 'oneonone', 'djkn1'))));
await t('PMOU DJKN tidak bisa query unit DJP', assertFails(getDocs(qUnit(as('pmouDjkn'), 'DJP'))));
await t('PMOU DJKN tidak bisa membaca seluruh koleksi', assertFails(getDocs(col(as('pmouDjkn')))));
await t('PMOU DJKN tidak bisa membaca dokumen DJP', assertFails(getDoc(doc(as('pmouDjkn'), 'oneonone', 'djp1'))));
await t('PMOU DJKN tidak bisa membaca kegiatan Pusat', assertFails(getDoc(doc(as('pmouDjkn'), 'oneonone', 'pusat1'))));
await t('PMOU DJKN tidak bisa membaca data pribadi Tim Unit', assertFails(getDoc(doc(as('pmouDjkn'), 'oneonone', 'cfg-kp-x'))));
await t('PMOU DJKN membaca ringkasan pendamping (pub-tim)', assertSucceeds(getDoc(doc(as('pmouDjkn'), 'oneonone', 'pub-tim'))));
await t('PMOU DJKN tidak bisa mengubah pub-tim', assertFails(updateDoc(doc(as('pmouDjkn'), 'oneonone', 'pub-tim'), { pub: {} })));
await t('CMOU DJKN membaca kontak unitnya', assertSucceeds(getDoc(doc(as('cmouDjkn'), 'oneonone', 'cfg-kp-djkn'))));
await t('CMOU DJKN mengubah kontak unitnya', assertSucceeds(updateDoc(doc(as('cmouDjkn'), 'oneonone', 'cfg-kp-djkn'), { kp: { nama: 'Kontak 2', unit: 'DJKN' } })));
await t('PMOU DJP tidak bisa membaca kontak DJKN', assertFails(getDoc(doc(as('pmouDjp'), 'oneonone', 'cfg-kp-djkn'))));
await t('PMOU DJP tidak bisa menulis agenda pimpinan', assertFails(setDoc(doc(as('pmouDjp'), 'oneonone', 'cfg-agpim'), { agpim: [] })));
await t('CMOU DJKN membuat kegiatan DJKN', assertSucceeds(setDoc(doc(as('cmouDjkn'), 'oneonone', 'u1'), { ownGrp: 'unit', ownUnit: 'DJKN', ownMods: [], modKeys: [] })));
await t('PMOU DJKN tidak bisa membuat atas nama DJP', assertFails(setDoc(doc(as('pmouDjkn'), 'oneonone', 'u2'), { ownGrp: 'unit', ownUnit: 'DJP' })));
await t('PMOU DJKN tidak bisa membuat kegiatan Pusat', assertFails(setDoc(doc(as('pmouDjkn'), 'oneonone', 'u3'), { ownGrp: 'pusat' })));
await t('PMOU DJKN mengubah kegiatan DJKN', assertSucceeds(updateDoc(doc(as('pmouDjkn'), 'oneonone', 'djkn1'), { nama: 'ubah' })));
await t('PMOU DJKN tidak bisa memindahkan pemilik ke DJP', assertFails(updateDoc(doc(as('pmouDjkn'), 'oneonone', 'djkn1'), { ownUnit: 'DJP' })));
await t('PMOU DJKN tidak bisa menimpa kegiatan Pusat', assertFails(setDoc(doc(as('pmouDjkn'), 'oneonone', 'pusat1'), { ownGrp: 'unit', ownUnit: 'DJKN' })));
await t('PMOU DJP tidak bisa menghapus kegiatan DJKN', assertFails(deleteDoc(doc(as('pmouDjp'), 'oneonone', 'djkn1'))));
await t('Akun nonaktif ditolak', assertFails(getDocs(qUnit(as('nonaktif'), 'DJKN'))));

console.log('Tim Pengelola Proyek');
const qTim = (db, m) => query(col(db), where('modKeys', 'array-contains-any', m));
await t('Tim M1 query kegiatan modulnya', assertSucceeds(getDocs(qTim(as('tim'), ['M1']))));
await t('Tim M1 membaca kegiatan Pusat ber-Program modulnya', assertSucceeds(getDoc(doc(as('tim'), 'oneonone', 'pusatM1'))));
await t('Tim M1 tidak bisa query modul lain', assertFails(getDocs(qTim(as('tim'), ['M9']))));
await t('Tim M1 tidak bisa membaca kegiatan unit', assertFails(getDoc(doc(as('tim'), 'oneonone', 'djkn1'))));
await t('Tim M1 membuat kegiatan tim', assertSucceeds(setDoc(doc(as('tim'), 'oneonone', 't2'), { ownGrp: 'tim', ownUnit: '', ownMods: ['M1'], modKeys: ['M1'] })));
await t('Tim M1 tidak bisa mengubah kegiatan Pusat', assertFails(updateDoc(doc(as('tim'), 'oneonone', 'pusatM1'), { nama: 'x' })));
await t('Tim lain tidak bisa mengubah kegiatan tim M1', assertFails(updateDoc(doc(as('timLain'), 'oneonone', 'tim1'), { nama: 'x' })));

await t('Tim M1 membaca ringkasan pendamping (pub-tim)', assertSucceeds(getDoc(doc(as('tim'), 'oneonone', 'pub-tim'))));

console.log('Tanpa login');
await t('Tanpa login ditolak', assertFails(getDocs(col(env.unauthenticatedContext().firestore()))));
await t('Tanpa login tidak bisa membaca pub-tim', assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'oneonone', 'pub-tim'))));

await env.cleanup();
console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
