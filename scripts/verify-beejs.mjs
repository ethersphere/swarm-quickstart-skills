#!/usr/bin/env node
// Verifies the bee-js / Bee API facts the swarm-skills rely on (issues #25/#26/#27/#28
// and the version notes in setup-bee + CLAUDE.md). Asserts the API *surface*, not a live
// node — re-run after any bee-js bump to catch drift (renamed Utils helpers, changed
// types, capacity changes) before it lands in the skills.
//
// Usage (from the repo root):
//   npm i @ethersphere/bee-js@12
//   node scripts/verify-beejs.mjs
//
// Exits 0 if every check passes, 1 otherwise.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import * as B from '@ethersphere/bee-js'

// Resolve the installed bee-js package dir (cwd-independent) so we can read its
// package.json and bundled type declarations.
const entry = fileURLToPath(import.meta.resolve('@ethersphere/bee-js'))
const marker = join('node_modules', '@ethersphere', 'bee-js')
const PKG = entry.slice(0, entry.indexOf(marker) + marker.length)

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  console.log(`${cond ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  cond ? pass++ : fail++
}
const mb = n => (n / 1e6).toFixed(2) + ' MB'

const ver = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8')).version
console.log(`\n# bee-js ${ver}\n`)

// --- versions / warning note (CLAUDE.md, setup-bee) ---
ok('bee-js is 12.x', /^12\./.test(ver), ver)
ok('SUPPORTED_BEE_VERSION is 2.7.x (=> 2.8.0 warning is expected)', B.SUPPORTED_BEE_VERSION.startsWith('2.7'), B.SUPPORTED_BEE_VERSION)

// --- #26: stamp helpers live under Utils with the 12.x names ---
const utilsExpected = ['getDepthForSize', 'getStampEffectiveBytes', 'getStampTheoreticalBytes', 'getStampCost', 'getStampUsage', 'getStampDuration', 'getAmountForDuration']
for (const fn of utilsExpected) ok(`Utils.${fn} exists`, typeof B.Utils?.[fn] === 'function')
// the pre-12.x names must be gone entirely (top-level AND under Utils)
const goneNames = ['getDepthForCapacity', 'getAmountForTtl', 'getStampTtlSeconds', 'getStampMaximumCapacityBytes']
for (const fn of goneNames) ok(`old name '${fn}' is absent`, B[fn] === undefined && B.Utils?.[fn] === undefined)
ok('stamp helpers are NOT top-level exports', B.getStampCost === undefined && B.getStampEffectiveBytes === undefined)

// --- #25: capacity numbers ---
const d17 = B.Utils.getStampEffectiveBytes(17)
const d18 = B.Utils.getStampEffectiveBytes(18)
ok('getStampEffectiveBytes(17) ~ 40 KB (NOT ~7 MB)', d17 > 30_000 && d17 < 50_000, `${d17} bytes`)
ok('getStampEffectiveBytes(18) ~ 6 MB (the old "7 MB" was depth 18)', d18 > 5e6 && d18 < 7.5e6, mb(d18))
const caps = [17, 18, 19, 20, 21, 22].map(d => B.Utils.getStampEffectiveBytes(d))
ok('effective capacity is monotonic increasing 17->22', caps.every((v, i) => i === 0 || v > caps[i - 1]), caps.map(mb).join(' < '))

// capacityBreakpoints table (the numbers CLAUDE.md's depth 19-24 table uses)
const bp = B.capacityBreakpoints.ENCRYPTION_OFF[0]
const eff = d => bp.find(x => x.batchDepth === d)?.effectiveVolume
ok('capacityBreakpoints depth 20 ~ 680 MB', /6\d\d.* MB/.test(eff(20) || ''), eff(20))
ok('capacityBreakpoints depth 22 ~ 7.7 GB', /7\.\d+ GB/.test(eff(22) || ''), eff(22))

// --- exports used across examples ---
for (const x of ['Bee', 'Size', 'Duration', 'Topic', 'PrivateKey', 'PublicKey', 'EthAddress', 'NULL_IDENTIFIER']) ok(`export ${x} exists`, typeof B[x] !== 'undefined')

// --- #27: ACT — getNodeAddresses (publisher key source) + Optional unwrap ---
ok('Bee.getNodeAddresses exists (source of publisher PublicKey)', typeof B.Bee.prototype.getNodeAddresses === 'function')

// --- Bee methods the skills call (upload/download, stamps, ACT, feeds, messaging) ---
const methods = ['uploadFile', 'downloadFile', 'uploadData', 'downloadData', 'uploadFiles', 'uploadFilesFromDirectory', 'buyStorage', 'createPostageBatch', 'topUpBatch', 'diluteBatch', 'getPostageBatches', 'createGrantees', 'getGrantees', 'patchGrantees', 'gsocMine', 'gsocSend', 'gsocSubscribe', 'pssSend', 'pssSubscribe', 'pssReceive', 'makeFeedWriter', 'makeFeedReader', 'createFeedManifest', 'isConnected']
for (const m of methods) ok(`Bee.${m} exists`, typeof B.Bee.prototype[m] === 'function')

// --- #28: onClose is a REQUIRED field on the subscribe handler types ---
try {
  const dts = readFileSync(join(PKG, 'dist/types/types/index.d.ts'), 'utf8')
  ok('subscribe handler types declare onClose as required (no `?`)', /onClose:\s*\(/.test(dts) && !/onClose\?:/.test(dts))
} catch (e) {
  ok('read handler .d.ts for onClose', false, e.message)
}

// --- #27: Optional (cafe-utility) unwraps via getOrThrow() and .value ---
try {
  const cafe = await import('cafe-utility')
  const opt = cafe.Optional?.of?.('x')
  ok('Optional.getOrThrow() unwraps (used for historyAddress)', !!opt && typeof opt.getOrThrow === 'function' && opt.getOrThrow() === 'x')
  ok('Optional exposes .value (alternate unwrap)', !!opt && 'value' in opt && opt.value === 'x')
} catch (e) {
  ok('cafe-utility Optional import', false, e.message)
}

console.log(`\n# ${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
