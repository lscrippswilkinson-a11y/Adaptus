/**
 * Translation coverage check: `npm run i18n:check`.
 *
 * Scans src/ for every English source string that reaches t()/tp()/tr()/TSplit,
 * then reports what each locale is missing. Run it after editing any user-facing
 * copy — otherwise a reworded English string silently falls back to English in
 * all seven translations, and nothing else in the toolchain would tell you.
 *
 * Exits non-zero when a locale is incomplete or a translation's {placeholders}
 * don't match its source, which is the one class of translation bug that breaks
 * the UI rather than merely reading oddly.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'

const LOCALES = ['es', 'fr', 'de', 'nl', 'it', 'fi', 'zh']
const PARTS = ['ui1', 'ui2', 'coach', 'biz']
const SRC = 'src'
const LOCALE_DIR = join('src', 'i18n', 'locales')

const read = (p) => readFileSync(p, 'utf8')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (!p.includes(LOCALE_DIR)) walk(p, out)
    } else if (/\.tsx?$/.test(p)) {
      out.push(p)
    }
  }
  return out
}

const UNESCAPE = { n: '\n', t: '\t', r: '\r', "'": "'", '"': '"', '\\': '\\' }

/** Yield every simple string literal, skipping comments so their prose is ignored. */
function* strings(src) {
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') {
      const j = src.indexOf('\n', i)
      i = j < 0 ? src.length : j
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const j = src.indexOf('*/', i)
      i = j < 0 ? src.length : j + 1
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      let buf = ''
      let closed = false
      while (j < src.length) {
        if (src[j] === '\\') {
          buf += UNESCAPE[src[j + 1]] ?? src[j + 1]
          j += 2
          continue
        }
        if (src[j] === c) {
          closed = true
          break
        }
        if (src[j] === '\n') break
        buf += src[j++]
      }
      if (closed) {
        yield { start: i, end: j + 1, value: buf }
        i = j
      }
    }
  }
}

const keys = new Set()
const add = (k) => {
  if (k && k.trim()) keys.add(k)
}

// 1. Literal call sites: t('…'), tp('…'), tr('…'), <TSplit source="…">.
const CALL = /\b(?:t|tp|tr)\(\s*$/
const SOURCE = /\bsource=\s*$/
for (const file of walk(SRC)) {
  const src = read(file)
  for (const { start, value } of strings(src)) {
    const head = src.slice(Math.max(0, start - 24), start)
    if (CALL.test(head) || SOURCE.test(head)) add(value)
  }
}

// 2. Data-file literals passed to t() dynamically — stage labels, option lists,
//    business profiles, tips, level pickers. These never sit inside a t() call,
//    so each is collected by an explicit rule.
function byField(file, fields) {
  const src = read(file)
  const pat = new RegExp(`\\b(${fields.join('|')}):\\s*$`)
  for (const { start, value } of strings(src)) {
    if (pat.test(src.slice(Math.max(0, start - 24), start))) add(value)
  }
}

function balanced(src, from, open, close) {
  let depth = 0
  for (let j = from; j < src.length; j++) {
    if (src[j] === open) depth++
    else if (src[j] === close && --depth === 0) return j
  }
  return src.length
}

function byArray(file, names) {
  const src = read(file)
  for (const name of names) {
    const m = new RegExp(`\\b${name}\\b[^=]*=\\s*\\[`).exec(src)
    if (!m) continue
    const open = m.index + m[0].length - 1
    for (const { value } of strings(src.slice(open, balanced(src, open, '[', ']') + 1))) add(value)
  }
}

/** Record<string, string> label maps: only the values are display copy. */
function byRecordValues(file, names) {
  const src = read(file)
  for (const name of names) {
    const m = new RegExp(`\\b${name}\\b[^=]*=\\s*\\{`).exec(src)
    if (!m) continue
    const open = m.index + m[0].length - 1
    const seg = src.slice(open, balanced(src, open, '{', '}') + 1)
    for (const { start, value } of strings(seg)) {
      if (/:\s*$/.test(seg.slice(Math.max(0, start - 4), start))) add(value)
    }
  }
}

byField('src/data/stages.ts', ['label', 'tag'])
byArray('src/data/constants.ts', ['CHANGE_TYPES', 'RISK_CATS', 'LAUNCH_ITEMS', 'SPONSOR_ACTIONS',
  'RESISTANCE_TYPES', 'TRAINING_FORMATS', 'METRIC_UNITS', 'TEST_TYPES', 'DEPENDENCY_TYPES', 'CHANNELS'])
byField('src/data/tips.ts', ['title', 'body'])
byField('src/data/business.ts', ['name', 'blurb', 'best', 'limit', 'statement', 'scope', 'headcount',
  'successLooks', 'whyNow', 'role', 'commitments', 'keyMessages', 'title', 'audience', 'owner', 'message'])
byArray('src/data/business.ts', ['LAW_FIRM_CHANNELS', 'SMB_CHANNELS', 'MEDIUM_CORP_CHANNELS', 'MEDICAL_CHANNELS'])
for (const m of read('src/data/business.ts').matchAll(/(?:suggestedGroups|sponsorActions|trainingFormats):\s*\[[^\]]*\]/gs)) {
  for (const { value } of strings(m[0])) add(value)
}
for (const [file, fields] of [
  ['src/components/stages/GroupsStage.tsx', ['label', 'desc']],
  ['src/components/stages/StakeholdersStage.tsx', ['label', 'desc']],
  ['src/components/stages/TestingStage.tsx', ['label', 'desc']],
  ['src/components/stages/DependenciesStage.tsx', ['label', 'desc']],
  ['src/components/stages/ResistanceStage.tsx', ['label', 'desc']],
  ['src/components/stages/SustainmentStage.tsx', ['label']],
  ['src/components/SecurityPage.tsx', ['title', 'body']],
]) byField(file, fields)
byArray('src/components/stages/RiskStage.tsx', ['LIKELIHOOD', 'IMPACT'])
for (const file of ['src/components/stages/DashboardStage.tsx', 'src/components/StatusBrief.tsx',
  'src/lib/deck.ts', 'src/components/stages/CommsStage.tsx']) {
  byRecordValues(file, ['GROUP_LABELS', 'REPEAT_LABELS'])
}

// Stored enum values that reach the screen through t().
for (const v of ['Low', 'Medium', 'High', 'Advocate', 'Neutral', 'Resistant', 'Unknown', 'Not started',
  'In progress', 'Passed', 'Failed', 'Ready', 'At risk', 'Team', 'System', 'Vendor', 'Other',
  'Editor', 'Viewer']) add(v)

const JUNK = /^[\s{}[\](),:;]*$|^(?:owner|editor|viewer|before|launch|after|guided|summary)$/
const expected = [...keys].filter((k) => !JUNK.test(k)).sort()

/** Parse a `const dict: Dict = { … }` file into key/value pairs. */
function parseDict(path) {
  let src
  try {
    src = read(path)
  } catch {
    return {}
  }
  const out = {}
  let pending = null
  for (const { end, value } of strings(src)) {
    // A literal followed by `:` is a key; the next literal is its value.
    const isKey = /^\s*:/.test(src.slice(end, end + 4))
    if (pending === null && isKey) pending = value
    else if (pending !== null) {
      out[pending] = value
      pending = null
    }
  }
  return out
}

const PLACEHOLDER = /\{(\w+)\}/g
const marks = (s) => [...s.matchAll(PLACEHOLDER)].map((m) => m[1]).sort().join(',')

let failed = false
console.log(`${expected.length} English source strings\n`)
for (const loc of LOCALES) {
  const dict = {}
  for (const part of PARTS) Object.assign(dict, parseDict(join(LOCALE_DIR, loc, `${part}.ts`)))
  const missing = expected.filter((k) => !(k in dict))
  const empty = Object.keys(dict).filter((k) => !dict[k].trim())
  const unused = Object.keys(dict).filter((k) => !expected.includes(k))
  const badPlaceholders = expected.filter((k) => k in dict && marks(k) !== marks(dict[k]))
  const ok = !missing.length && !empty.length && !badPlaceholders.length
  if (!ok) failed = true
  console.log(
    `${ok ? 'OK ' : '!! '}${loc}: ${expected.length - missing.length}/${expected.length}` +
    (missing.length ? `, ${missing.length} missing` : '') +
    (empty.length ? `, ${empty.length} empty` : '') +
    (badPlaceholders.length ? `, ${badPlaceholders.length} placeholder mismatch` : '') +
    (unused.length ? `, ${unused.length} unused` : ''),
  )
  for (const k of missing.slice(0, 20)) console.log(`   missing: ${JSON.stringify(k)}`)
  if (missing.length > 20) console.log(`   …and ${missing.length - 20} more`)
  for (const k of badPlaceholders) console.log(`   placeholder: ${JSON.stringify(k)} -> ${JSON.stringify(dict[k])}`)
  for (const k of unused.slice(0, 10)) console.log(`   unused: ${JSON.stringify(k)}`)
}

if (failed) {
  console.log(`\nAdd the missing keys under ${LOCALE_DIR}${sep}<locale>${sep}.`)
  process.exit(1)
}
