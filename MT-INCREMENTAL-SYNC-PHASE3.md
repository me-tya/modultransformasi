# MT Firebase phase 3 — development only (2026-11-26)

Backup: branch 261126-MT-19 at 2053a3d23a73b5e48cf9cc55be05468b91f96395. Do not deploy or merge.
P0: Non-ISTK retry now stores the most recent 64 import job receipts in the existing year document, checks quota and session on every transaction attempt, and does not resurrect a pending draft cleared in another tab. Existing import document structure/rules remain otherwise unchanged. The receipt limit is bounded; older receipts can be evicted. No new collection or migration. Does not solve concurrent queue creation in two simultaneous tabs or full offline login.
Local validation: 7 mock tests passed against manually extracted functions using Node 22. Actual repo tests are included for rerun. Emulator and actual browser Ctrl+F5 are NOT verified in this environment (network and Firebase/XLSX dependencies unavailable).

Run without production credentials, from repository root:
- node --test tests/mt-nonistk-recovery.test.cjs
- npm install --no-save firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10 xlsx@0.18.5
- npx firebase emulators:exec --only firestore --project demo-mt --config firebase.phase3.json "node tests/mt-nonistk-recovery.emu.mjs"
- Existing rules tests: npx firebase emulators:exec --only firestore --project demo-mt --config firebase.phase3.json "node tests/firestore-rules.emu.mjs"

The emulator integration creates dummy XLSX bytes, uses the real SDK with loopback-only settings and emulated users, and simulates browser storage reload via a fresh VM. Full browser test and actual Pusakti workbook remain pending. No real quota savings claimed.
P1/P2: cross-session incremental reads (including deletion tracking), further lazy collections, offline authorization, and actual quota measurement require separate design/validation. Main is 7 commits ahead of the original common ancestor; reconcile before any release, without losing unrelated changes.
