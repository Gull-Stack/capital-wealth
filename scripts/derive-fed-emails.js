#!/usr/bin/env node
/**
 * derive-fed-emails.js — turn a list of federal employees (name + agency) into
 * candidate work-email addresses.
 *
 * The name / job title / duty station / agency for federal civilian employees is
 * public record (5 U.S.C. 552) and is published by FedsDataCenter, FederalPay.org,
 * OpenPayrolls, etc. Those sources do NOT publish email addresses — so we derive
 * them from the agency's known email syntax. This is the reusable engine: point it
 * at a CSV from any of those sources and it emits candidate emails + a confidence
 * flag so you can prioritize the high-confidence agencies and verify before sending.
 *
 * Zero dependencies (Node built-ins only). Usage:
 *   node scripts/derive-fed-emails.js <input.csv> [--out emails.csv] [--name-col Name] [--agency-col Agency]
 *
 * Input CSV: must have a name column and an agency column (auto-detected if not
 * specified). Name accepted as "First Last", "First M Last", or "Last, First M".
 *
 * Output CSV columns:
 *   first,last,agency_input,matched_agency,domain,primary_email,alt_emails,confidence,notes
 *
 * IMPORTANT — read before sending anything:
 *   - Derived emails are GUESSES. Expect bounces, especially DOD and DOE (syntax
 *     varies by installation/lab). Verify or send in small batches and watch bounces.
 *   - Do NOT blast .gov addresses from capitalwealth.com — bulk cold mail to .gov
 *     can blacklist the domain and poison ALL company email. Use a separate sending
 *     subdomain/domain + SendGrid, warm it, batch ~50, honor unsubscribes.
 */

'use strict';
const fs = require('fs');

// --- Agency email-syntax map -------------------------------------------------
// format tokens: {first} {last} {f} {l} {m}  (lowercased, punctuation stripped)
// confidence: high = single dominant public syntax; medium = usually but sub-orgs
// vary; low = highly fragmented (verify individually).
// Order matters: more specific sub-agencies are listed BEFORE their parent so
// "Department of the Army" routes to army.mil rather than the generic DOD entry.
const AGENCY_MAP = [
  // --- specific sub-agencies (match before their parent department) ---
  { match: /federal aviation|\bfaa\b/i,             domain: 'faa.gov',     formats: ['{first}.{last}'],               confidence: 'medium', notes: 'FAA (under DOT)' },
  { match: /\barmy\b/i,                             domain: 'army.mil',    formats: ['{first}.{last}','{first}.{m}.{last}'], confidence: 'low', notes: 'Army civilian @army.mil; uniformed addresses differ' },
  { match: /\bnavy\b/i,                             domain: 'navy.mil',    formats: ['{first}.{last}','{first}.{m}.{last}'], confidence: 'low', notes: 'Navy civilian @us.navy.mil / @navy.mil; varies' },
  { match: /air force|space force/i,                domain: 'us.af.mil',   formats: ['{first}.{last}','{first}.{m}.{last}'], confidence: 'low', notes: 'Air/Space Force @us.af.mil; varies' },
  { match: /marine corps|\busmc\b/i,                domain: 'usmc.mil',    formats: ['{first}.{last}'],               confidence: 'low',    notes: 'USMC' },
  // --- the 7 RIF target agencies ---
  { match: /general services|\bgsa\b/i,             domain: 'gsa.gov',     formats: ['{first}.{last}'],               confidence: 'high',   notes: 'First.Last@gsa.gov ~94%' },
  { match: /agriculture|usda|forest service|\bfns\b|\bars\b|\bams\b|nrcs/i, domain: 'usda.gov', formats: ['{first}.{last}'], confidence: 'high', notes: 'USDA consolidated sub-agencies to @usda.gov' },
  { match: /transportation|\bdot\b|highway|\bfhwa\b|\bfra\b|\bfta\b/i, domain: 'dot.gov', formats: ['{first}.{last}'],   confidence: 'medium', notes: 'DOT modal admins mostly @dot.gov; FAA handled separately' },
  { match: /small business|\bsba\b/i,               domain: 'sba.gov',     formats: ['{first}.{last}'],               confidence: 'high',   notes: '' },
  { match: /housing and urban|\bhud\b/i,            domain: 'hud.gov',     formats: ['{first}.{last}'],               confidence: 'high',   notes: '' },
  { match: /energy|\bdoe\b/i,                       domain: 'hq.doe.gov',  formats: ['{first}.{last}'],               confidence: 'low',    notes: 'HQ=@hq.doe.gov; national labs differ (@nrel.gov,@anl.gov,@pnnl.gov,...)' },
  // --- generic DOD last (after service branches) ---
  { match: /defense|\bdod\b|defense logistics|\bdla\b|\bdfas\b|\bdisa\b|\bdcma\b/i, domain: 'mail.mil', formats: ['{first}.{last}','{first}.{m}.{last}'], confidence: 'low', notes: 'Generic DOD civilian often @mail.mil; many sub-orgs differ' },
];

// --- helpers -----------------------------------------------------------------
function stripDiacritics(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function clean(tok) { return stripDiacritics(String(tok || '')).toLowerCase().replace(/[^a-z]/g, ''); }

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);

// Parse "Last, First M" or "First M Last" -> { first, last }
function parseName(raw) {
  let s = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!s) return null;
  let first, last;
  if (s.includes(',')) {
    const [lastPart, firstPart = ''] = s.split(',').map(x => x.trim());
    last = lastPart.split(' ')[0];
    first = (firstPart.split(' ')[0]) || '';
  } else {
    let parts = s.split(' ').filter(Boolean);
    if (parts.length && SUFFIXES.has(clean(parts[parts.length - 1]))) parts = parts.slice(0, -1);
    if (parts.length < 2) return null;
    first = parts[0];
    last = parts[parts.length - 1];
  }
  const f = clean(first), l = clean(last);
  if (!f || !l) return null;
  return { first: f, last: l, m: '' };
}

function lookupAgency(agencyRaw) {
  const a = String(agencyRaw || '');
  return AGENCY_MAP.find(e => e.match.test(a)) || null;
}

function render(format, n) {
  return format.replace(/\{(first|last|f|l|m)\}/g, (_, k) => {
    if (k === 'first') return n.first;
    if (k === 'last') return n.last;
    if (k === 'f') return n.first[0] || '';
    if (k === 'l') return n.last[0] || '';
    if (k === 'm') return n.m || '';
    return '';
  }).replace(/\.\./g, '.').replace(/^\.|\.$/g, '');
}

// minimal CSV parser (handles quotes + commas)
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function findCol(headers, candidates) {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const cand of candidates) {
    const i = lower.findIndex(h => h === cand || h.includes(cand));
    if (i !== -1) return i;
  }
  return -1;
}

// --- main --------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const inPath = args.find(a => !a.startsWith('--'));
  const getFlag = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null; };
  const outPath = getFlag('--out') || 'fed-emails-derived.csv';
  const nameColArg = getFlag('--name-col');
  const agencyColArg = getFlag('--agency-col');

  if (!inPath) {
    console.error('Usage: node scripts/derive-fed-emails.js <input.csv> [--out emails.csv] [--name-col Name] [--agency-col Agency]');
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(inPath, 'utf8'));
  if (rows.length < 2) { console.error('No data rows found.'); process.exit(1); }
  const headers = rows[0];

  const nameIdx = nameColArg ? headers.indexOf(nameColArg) : findCol(headers, ['name', 'employee', 'full name']);
  const agencyIdx = agencyColArg ? headers.indexOf(agencyColArg) : findCol(headers, ['agency', 'department', 'organization', 'org']);
  if (nameIdx === -1) { console.error('Could not find a name column. Pass --name-col "<header>". Headers: ' + headers.join(', ')); process.exit(1); }
  if (agencyIdx === -1) { console.error('Could not find an agency column. Pass --agency-col "<header>". Headers: ' + headers.join(', ')); process.exit(1); }

  const out = [['first', 'last', 'agency_input', 'matched_agency', 'domain', 'primary_email', 'alt_emails', 'confidence', 'notes']];
  const stats = { total: 0, derived: 0, unmatchedAgency: 0, unparsedName: 0, byConf: { high: 0, medium: 0, low: 0 } };

  for (let r = 1; r < rows.length; r++) {
    stats.total++;
    const nm = parseName(rows[r][nameIdx]);
    const agencyRaw = rows[r][agencyIdx];
    if (!nm) { stats.unparsedName++; out.push(['', '', agencyRaw, '', '', '', '', 'none', 'could not parse name']); continue; }
    const ag = lookupAgency(agencyRaw);
    if (!ag) { stats.unmatchedAgency++; out.push([nm.first, nm.last, agencyRaw, '', '', '', '', 'none', 'agency not in map — add it or skip']); continue; }

    const emails = [...new Set(ag.formats.map(fmt => render(fmt, nm) + '@' + ag.domain))];
    const primary = emails[0];
    const alts = emails.slice(1).join('; ');
    stats.derived++;
    stats.byConf[ag.confidence]++;
    out.push([nm.first, nm.last, agencyRaw, ag.domain.replace(/\..*/, ''), ag.domain, primary, alts, ag.confidence, ag.notes]);
  }

  fs.writeFileSync(outPath, out.map(row => row.map(csvEscape).join(',')).join('\n'));

  console.log('\n  Derived federal emails');
  console.log('  ----------------------');
  console.log(`  input rows:        ${stats.total}`);
  console.log(`  emails derived:    ${stats.derived}  (high ${stats.byConf.high} / medium ${stats.byConf.medium} / low ${stats.byConf.low})`);
  console.log(`  agency not mapped: ${stats.unmatchedAgency}`);
  console.log(`  name unparsed:     ${stats.unparsedName}`);
  console.log(`  written to:        ${outPath}`);
  console.log('\n  Reminder: derived emails are guesses (esp. DOD/DOE). Verify or batch-send small');
  console.log('  from a SEPARATE sending domain — never blast .gov from capitalwealth.com.\n');
}

main();
