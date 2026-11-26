/* Modul Transformasi — layanan akun (reset kata sandi). Deploy sebagai Worker terpisah "mt-account" di Cloudflare.
 *
 * Endpoint
 *   GET  /                 status konfigurasi (tanpa rahasia)
 *   POST /reset-request    {email}  publik. Bila email terdaftar, aktif, dan punya Email alternatif,
 *                          tautan reset kata sandi Firebase dikirim ke Email alternatif. Jawaban selalu sama
 *                          (tidak membocorkan apakah email terdaftar).
 *   POST /admin-reset      {email}  khusus Superadmin aktif (Authorization: Bearer <Firebase ID token>).
 *                          Mengatur kata sandi sementara acak (akun login dibuat bila belum ada) dan
 *                          mengembalikannya sekali ke Superadmin. Bila pengguna punya Email alternatif,
 *                          tautan reset juga dikirim ke sana.
 *
 * Secrets (Settings › Variables and Secrets, tipe Secret)
 *   FIREBASE_SERVICE_ACCOUNT  isi JSON service account Firebase (Project settings › Service accounts › Generate new private key)
 *   RESEND_API_KEY            API key Resend (resend.com) untuk mengirim email
 * Variables (Text)
 *   FIREBASE_PROJECT_ID       modul-transformasi
 *   MAIL_FROM                 mis. "Modul Transformasi <onboarding@resend.dev>" (domain sendiri perlu diverifikasi di Resend
 *                             agar bisa mengirim ke alamat selain pemilik akun Resend)
 *   MT_ORIGIN                 opsional, default https://me-tya.github.io
 * Binding opsional: RESET_RATE_LIMIT (Rate Limiting) — membatasi permintaan per IP.
 */
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const IDT = "https://identitytoolkit.googleapis.com/v1/projects/";
let keyCache = {keys: [], until: 0}, saCache = {token: "", until: 0};

class Failure extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const fail = (s, c, m) => { throw new Failure(s, c, m); };
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uStr = s => b64u(new TextEncoder().encode(s));
const decode64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const decodeJSON = s => JSON.parse(new TextDecoder().decode(decode64(s)));
const safeFetch = (url, init = {}, ms = 15000) => fetch(url, {...init, signal: AbortSignal.timeout(ms)});
const json = (data, status = 200, headers = {}) => Response.json(data, {status, headers: {"Cache-Control": "no-store", ...headers}});
const isKemenkeu = e => typeof e === "string" && /^[^\s/@]+@kemenkeu\.go\.id$/i.test(e);
const isMail = e => typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));

function project(env) {
  const p = String(env.FIREBASE_PROJECT_ID || "").trim();
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(p)) fail(503, "NOT_CONFIGURED", "FIREBASE_PROJECT_ID belum dikonfigurasi pada Worker.");
  return p;
}
/* Token OAuth service account (hak admin Firebase Auth & Firestore). */
async function adminToken(env) {
  if (saCache.token && saCache.until > Date.now()) return saCache.token;
  let sa;
  try { sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT || ""); } catch { fail(503, "NOT_CONFIGURED", "FIREBASE_SERVICE_ACCOUNT belum dikonfigurasi."); }
  if (!sa.client_email || !sa.private_key) fail(503, "NOT_CONFIGURED", "FIREBASE_SERVICE_ACCOUNT tidak lengkap.");
  const now = Math.floor(Date.now() / 1000);
  const head = b64uStr(JSON.stringify({alg: "RS256", typ: "JWT"}));
  const body = b64uStr(JSON.stringify({iss: sa.client_email, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore"}));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", decode64(pem), {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head + "." + body));
  const r = await safeFetch("https://oauth2.googleapis.com/token", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + head + "." + body + "." + b64u(sig)});
  if (!r.ok) fail(503, "ADMIN_AUTH_FAILED", "Service account Firebase ditolak Google (" + r.status + ").");
  const t = await r.json();
  saCache = {token: t.access_token, until: Date.now() + (Number(t.expires_in || 3600) - 120) * 1000};
  return saCache.token;
}
async function gapi(env, url, body) {
  const r = await safeFetch(url, {method: body ? "POST" : "GET", headers: {Authorization: "Bearer " + await adminToken(env), "Content-Type": "application/json"}, body: body ? JSON.stringify(body) : undefined});
  const data = await r.json().catch(() => ({}));
  return {ok: r.ok, status: r.status, data};
}
/* Dokumen users/{email} di Firestore (dibaca dengan hak admin). */
async function userDoc(env, email) {
  const r = await gapi(env, "https://firestore.googleapis.com/v1/projects/" + project(env) + "/databases/(default)/documents/users/" + encodeURIComponent(email));
  if (r.status === 404) return null;
  if (!r.ok) fail(503, "DB_UNAVAILABLE", "Database pengguna tidak dapat dibaca.");
  const f = r.data.fields || {};
  return {role: f.role?.stringValue || "", aktif: f.aktif?.booleanValue === true, nama: f.nama?.stringValue || "", emailAlt: f.emailAlt?.stringValue || ""};
}
async function authUser(env, email) {
  const r = await gapi(env, IDT + project(env) + "/accounts:lookup", {email: [email]});
  if (!r.ok) fail(503, "AUTH_UNAVAILABLE", "Firebase Authentication tidak dapat dibaca.");
  return (r.data.users || [])[0] || null;
}
async function resetLink(env, email) {
  const r = await gapi(env, IDT + project(env) + "/accounts:sendOobCode", {requestType: "PASSWORD_RESET", email, returnOobLink: true});
  if (!r.ok || !r.data.oobLink) fail(503, "LINK_FAILED", "Tautan reset tidak dapat dibuat.");
  return r.data.oobLink;
}
function tempPassword() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", b = crypto.getRandomValues(new Uint8Array(12));
  return "Mt-" + [...b].map(x => abc[x % abc.length]).join("");
}
async function ensureAccount(env, email, password) {
  const u = await authUser(env, email);
  const r = u ? await gapi(env, IDT + project(env) + "/accounts:update", {localId: u.localId, password})
              : await gapi(env, IDT + project(env) + "/accounts", {email, password});
  if (!r.ok) fail(503, "AUTH_UPDATE_FAILED", "Akun login tidak dapat diperbarui.");
  return u ? "diatur ulang" : "dibuat";
}
async function sendMail(env, to, nama, link, loginEmail) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) fail(503, "MAIL_NOT_CONFIGURED", "Pengiriman email belum dikonfigurasi pada Worker.");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1B2436">
<p>Yth. ${esc(nama || loginEmail)},</p>
<p>Ada permintaan atur ulang kata sandi akun <b>Modul Transformasi</b> untuk <b>${esc(loginEmail)}</b>. Email ini dikirim ke alamat alternatif yang terdaftar di profil Anda.</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#12275A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Atur ulang kata sandi</a></p>
<p style="color:#6B7690;font-size:12px">Tautan berlaku sementara dan hanya sekali pakai. Abaikan email ini bila Anda tidak memintanya.</p></div>`;
  const r = await safeFetch("https://api.resend.com/emails", {method: "POST", headers: {Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json"},
    body: JSON.stringify({from: env.MAIL_FROM, to: [to], subject: "Atur ulang kata sandi Modul Transformasi", html})});
  if (!r.ok) fail(502, "MAIL_FAILED", "Email tidak terkirim (layanan email menolak, " + r.status + ").");
}
/* Verifikasi ID token Firebase pemanggil, lalu pastikan ia Superadmin aktif. */
async function callerSA(request, env) {
  const p = project(env), token = (request.headers.get("Authorization") || "").match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token || token.length > 12000) fail(401, "AUTH_REQUIRED", "Login kembali ke Modul Transformasi.");
  let parts, header, claims;
  try { parts = token.split("."); if (parts.length !== 3) throw Error(); header = decodeJSON(parts[0]); claims = decodeJSON(parts[1]); }
  catch { fail(401, "INVALID_TOKEN", "Token login tidak valid."); }
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== "RS256" || claims.aud !== p || claims.iss !== "https://securetoken.google.com/" + p || !(claims.exp > now) || !(claims.iat <= now + 30))
    fail(401, "INVALID_TOKEN", "Sesi login tidak valid atau kedaluwarsa.");
  let jwk = keyCache.until > Date.now() && keyCache.keys.find(k => k.kid === header.kid);
  if (!jwk) {
    const r = await safeFetch(JWKS_URL); if (!r.ok) fail(503, "AUTH_UNAVAILABLE", "Verifikasi Firebase tidak tersedia.");
    const b = await r.json(); keyCache = {keys: b.keys || [], until: Date.now() + 300000}; jwk = keyCache.keys.find(k => k.kid === header.kid);
  }
  let ok = false;
  if (jwk) try {
    const key = await crypto.subtle.importKey("jwk", jwk, {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["verify"]);
    ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decode64(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  } catch {}
  if (!ok) fail(401, "INVALID_TOKEN", "Tanda tangan token tidak valid.");
  const email = String(claims.email || "").toLowerCase();
  if (!isKemenkeu(email)) fail(403, "FORBIDDEN", "Gunakan akun Kemenkeu.");
  const me = await userDoc(env, email);
  if (!me || !me.aktif || me.role !== "SA") fail(403, "FORBIDDEN", "Hanya Superadmin aktif yang dapat mereset akun login.");
  return email;
}
async function readBody(request) {
  if (!/^application\/json\b/i.test(request.headers.get("Content-Type") || "")) fail(415, "INVALID_CONTENT_TYPE", "Gunakan JSON.");
  const raw = await request.text(); if (raw.length > 2000) fail(413, "TOO_LARGE", "Permintaan terlalu besar.");
  try { return JSON.parse(raw); } catch { fail(400, "INVALID_JSON", "JSON tidak valid."); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get("Origin"), allowed = env.MT_ORIGIN || "https://me-tya.github.io";
    const cors = origin === allowed ? {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Vary": "Origin"} : {};
    try {
      if (url.pathname === "/" && request.method === "GET")
        return json({status: "online", service: "Modul Transformasi akun", firebase_project: Boolean(env.FIREBASE_PROJECT_ID), service_account: Boolean(env.FIREBASE_SERVICE_ACCOUNT), mail: Boolean(env.RESEND_API_KEY && env.MAIL_FROM), version: "account-v1"}, 200, cors);
      if (!["/reset-request", "/admin-reset"].includes(url.pathname)) fail(404, "NOT_FOUND", "Endpoint tidak ditemukan.");
      if (origin && origin !== allowed) fail(403, "ORIGIN_FORBIDDEN", "Origin aplikasi tidak diizinkan.");
      if (request.method === "OPTIONS") return new Response(null, {status: 204, headers: cors});
      if (request.method !== "POST") fail(405, "METHOD_NOT_ALLOWED", "Gunakan POST.");

      if (url.pathname === "/reset-request") {
        const ip = request.headers.get("CF-Connecting-IP") || "x";
        if (env.RESET_RATE_LIMIT && !(await env.RESET_RATE_LIMIT.limit({key: ip})).success) fail(429, "RATE_LIMIT", "Terlalu banyak permintaan. Coba lagi nanti.");
        const email = String((await readBody(request)).email || "").trim().toLowerCase();
        if (!isKemenkeu(email)) fail(400, "INVALID_EMAIL", "Masukkan email @kemenkeu.go.id yang dipakai untuk login.");
        const generic = {status: "success", message: "Bila email terdaftar dan memiliki Email alternatif, tautan atur ulang kata sandi telah dikirim ke Email alternatif tersebut."};
        const u = await userDoc(env, email);
        if (!u || !u.aktif || !isMail(u.emailAlt)) return json(generic, 200, cors);
        if (!(await authUser(env, email))) await ensureAccount(env, email, tempPassword());
        await sendMail(env, u.emailAlt, u.nama, await resetLink(env, email), email);
        return json(generic, 200, cors);
      }

      const by = await callerSA(request, env);
      const email = String((await readBody(request)).email || "").trim().toLowerCase();
      if (!isKemenkeu(email)) fail(400, "INVALID_EMAIL", "Email pengguna tidak valid.");
      const u = await userDoc(env, email);
      if (!u) fail(404, "USER_NOT_FOUND", "Email tidak ada di daftar Pengguna. Tambahkan dulu lalu simpan.");
      const pw = tempPassword(), how = await ensureAccount(env, email, pw);
      let mailed = false, mailErr = "";
      if (isMail(u.emailAlt)) { try { await sendMail(env, u.emailAlt, u.nama, await resetLink(env, email), email); mailed = true; } catch (e) { mailErr = e.message; } }
      return json({status: "success", account: how, tempPassword: pw, mailedTo: mailed ? u.emailAlt : "", mailError: mailErr, by}, 200, cors);
    } catch (e) {
      const k = e instanceof Failure;
      return json({status: "error", code: k ? e.code : "INTERNAL_ERROR", error: k ? e.message : "Layanan akun gagal memproses permintaan."}, k ? e.status : 500, cors);
    }
  }
};
