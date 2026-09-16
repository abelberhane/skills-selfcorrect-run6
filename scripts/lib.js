const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const YAML = require('yaml');

const CATEGORIES = ['STYLE', 'CODE', 'ARCH', 'TOOL', 'PROCESS', 'DATA', 'UX', 'TEST', 'SECURITY', 'OTHER'];
const ACTIONS = ['add', 'supersede', 'revoke'];
const ALLOWED_FIELDS = ['category', 'rule', 'rationale', 'scope', 'action', 'target_id'];
const RISK_ORDER = ['low', 'medium', 'high'];
const PROTECTED_PATHS = ['.github/workflows/', 'schemas/', 'scripts/', 'CODEOWNERS', '.github/learning-config.yml', '.github/auto-merge-policy.yml'];

function fail(message) { const error = new Error(message); error.code = 'VALIDATION_FAILED'; throw error; }
function fingerprint(value) { if (typeof value !== 'string') fail('Fingerprint input must be text.'); return crypto.createHash('sha256').update(value.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex'); }
function stableId(category, rule) { return `RULE-${category}-${fingerprint(rule).slice(0, 12).toUpperCase()}`; }

function parseCorrection(body) {
  if (typeof body !== 'string') fail('Comment body must be text.');
  const lines = body.replace(/\r/g, '').split('\n');
  if (lines[0].trim() !== '/copilot-learn') fail('The command must be the first line and exactly /copilot-learn.');
  const fields = {};
  for (const raw of lines.slice(1)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^([a-z_]+):\s+(.+)$/);
    if (!match) fail(`Malformed command line: ${line}`);
    const [, key, value] = match;
    if (!ALLOWED_FIELDS.includes(key)) fail(`Field ${key} is not allowed.`);
    if (Object.hasOwn(fields, key)) fail(`Field ${key} was provided more than once.`);
    fields[key] = value.trim();
  }
  for (const required of ['category', 'rule', 'rationale', 'scope']) if (!fields[required]) fail(`Missing required field: ${required}.`);
  fields.category = fields.category.toUpperCase();
  fields.action = (fields.action || 'add').toLowerCase();
  if (!CATEGORIES.includes(fields.category)) fail(`Unsupported category: ${fields.category}.`);
  if (!ACTIONS.includes(fields.action)) fail(`Unsupported action: ${fields.action}.`);
  if (fields.action !== 'add' && !fields.target_id) fail(`${fields.action} requires target_id.`);
  return fields;
}

function assertTrusted(event, config = {}) {
  const actor = event.actor || {};
  const associations = config.trusted_associations || ['OWNER', 'MEMBER'];
  const logins = config.trusted_logins || [];
  if (!associations.includes(actor.association) && !logins.includes(actor.login)) fail(`Actor ${actor.login || 'unknown'} is not trusted.`);
  if (!event.pull_request || !event.pull_request.labels?.includes('copilot-authored')) fail('The correction must be attached to a Copilot-associated pull request.');
  if (event.pull_request.author === 'github-actions[bot]') fail('Workflow-generated pull requests cannot create new candidates.');
}

const SECRET_PATTERNS = [/gh[pousr]_[A-Za-z0-9]{20,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /(?:password|token|secret)\s*[=:]\s*\S+/i];
const INJECTION_PATTERNS = [/ignore (?:all |any )?(?:previous|prior|maintainer|system) instructions/i, /<script\b/i, /\$\([^)]*\)/, /`[^`]*(?:curl|wget|bash|sh|node|python)[^`]*`/i, /(?:run|execute)\s+(?:this|the following)\s+(?:command|code)/i];
const GOVERNANCE_PATTERNS = [/(?:disable|bypass|remove|change).*(?:branch protection|required check|codeowners|permission|workflow|validator|policy)/i, /(?:grant|write|admin) permissions?/i, /auto-?merge policy/i];

function validateWithSchema(value, schemaFile) {
  const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const valid = ajv.validate(schema, value);
  return { valid, errors: valid ? [] : ajv.errorsText(ajv.errors, { separator: '\n' }).split('\n') };
}

function validateCandidate(candidate, existing = []) {
  const schema = validateWithSchema(candidate, path.join(__dirname, '..', 'schemas', 'candidate.schema.json'));
  if (!schema.valid) return schema;
  const errors = [];
  if (candidate.id !== stableId(candidate.category, candidate.rule)) errors.push('Stable ID does not match rule fingerprint.');
  if (candidate.fingerprint !== fingerprint(candidate.rule)) errors.push('Fingerprint does not match normalized rule.');
  const combined = `${candidate.rule}\n${candidate.rationale}`;
  if (SECRET_PATTERNS.some((pattern) => pattern.test(combined))) errors.push('Potential secret detected.');
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(combined))) errors.push('Prompt injection or executable content detected.');
  if (GOVERNANCE_PATTERNS.some((pattern) => pattern.test(combined))) errors.push('Candidates cannot change governance or security controls.');
  if (existing.some((rule) => rule.fingerprint === candidate.fingerprint && rule.state !== 'revoked')) errors.push('Duplicate active rule.');
  if (/\bnever\b/i.test(candidate.rule) && existing.some((rule) => rule.state === 'active' && opposite(rule.rule, candidate.rule))) errors.push('Candidate contradicts an active rule.');
  if (/\b(always|never)\b/i.test(candidate.rule) && candidate.scope === 'repository' && /\b(this|that|current)\b/i.test(candidate.rule)) errors.push('Rule appears overfit or ambiguous.');
  if (candidate.target_id && !existing.some((rule) => rule.id === candidate.target_id && rule.state === 'active')) errors.push('Target rule is not active or does not exist.');
  return { valid: errors.length === 0, errors };
}

function readYaml(file) { return YAML.parse(fs.readFileSync(file, 'utf8')); }

function parseRules(contents) {
  const start = contents.indexOf('<!-- learned-rules:start -->');
  const end = contents.indexOf('<!-- learned-rules:end -->');
  if (start < 0 || end <= start) fail('Learned-rule boundaries are missing or malformed.');
  const learned = contents.slice(start, end);
  const blocks = learned.split(/^### /m).slice(1);
  return blocks.map((block) => {
    const value = (label) => block.match(new RegExp(`- \\*\\*${label}:\\*\\* (.+)`))?.[1];
    const rule = value('Rule');
    return { id: block.split('\n')[0].trim(), category: value('Category'), state: value('State'), rule, fingerprint: rule ? fingerprint(rule) : undefined };
  }).filter((rule) => rule.id && rule.rule);
}

function evaluatePolicy(candidate, policy, context) {
  const schema = validateWithSchema(policy, path.join(__dirname, '..', 'schemas', 'auto-merge-policy.schema.json'));
  const evaluation = evaluateRisk(candidate, policy);
  const reasons = [...schema.errors, ...evaluation.reasons];
  if (!policy.enabled) reasons.push('Auto-merge policy is disabled.');
  if (RISK_ORDER.indexOf(evaluation.risk) > RISK_ORDER.indexOf(policy.allowed_risk)) reasons.push(`Risk ${evaluation.risk} exceeds the allowed maximum of ${policy.allowed_risk}.`);
  if (policy.blocked_categories.includes(candidate.category)) reasons.push(`Category ${candidate.category} is blocked.`);
  if (candidate.rule.length > policy.max_rule_length) reasons.push('Rule exceeds policy maximum length.');
  const missingLabels = policy.required_labels.filter((label) => !context.labels.includes(label));
  if (missingLabels.length) reasons.push(`Missing required labels: ${missingLabels.join(', ')}.`);
  try { assertAllowedPaths(context.paths, policy.allowed_paths); } catch (error) { reasons.push(error.message); }
  return { risk: evaluation.risk, reasons, autoMergeEligible: schema.valid && reasons.length === 0 };
}
function opposite(a, b) {
  const normalize = (s) => s.toLowerCase().replace(/\b(always|never|do not|don't)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  return normalize(a) === normalize(b) && /\b(always)\b/i.test(a + b) && /\b(never|do not|don't)\b/i.test(a + b);
}

function makeCandidate(fields, event, now = new Date().toISOString()) {
  const ruleFingerprint = fingerprint(fields.rule);
  return {
    id: stableId(fields.category, fields.rule), category: fields.category, rule: fields.rule,
    rationale: fields.rationale, scope: fields.scope, state: 'proposed', action: fields.action || 'add',
    ...(fields.target_id ? { target_id: fields.target_id } : {}),
    provenance: { repository: event.repository, pull_request: event.pull_request.number, comment_id: event.comment_id,
      actor: event.actor.login, actor_association: event.actor.association,
      source_url: `https://github.com/${event.repository}/pull/${event.pull_request.number}#issuecomment-${event.comment_id}` },
    fingerprint: ruleFingerprint, created_at: now
  };
}

function evaluateRisk(candidate, policy = {}) {
  const reasons = [];
  const sensitive = policy.blocked_categories || ['ARCH', 'PROCESS', 'SECURITY'];
  const maxLength = policy.max_rule_length || 180;
  let risk = 'low';
  if (sensitive.includes(candidate.category)) { risk = 'high'; reasons.push(`${candidate.category} requires human review.`); }
  else if (candidate.rule.length > maxLength || candidate.scope === 'repository' || candidate.action !== 'add') { risk = 'medium'; reasons.push('Broad, long, or lifecycle-changing rules require human review.'); }
  if (/\b(always|never|must)\b/i.test(candidate.rule) && candidate.scope === 'repository') { risk = risk === 'high' ? 'high' : 'medium'; reasons.push('Absolute repository-wide wording is not low risk.'); }
  return { risk, reasons, autoMergeEligible: risk === 'low' };
}

function assertAllowedPaths(paths, allowed = ['.github/copilot-instructions.md', 'data/candidates/', 'data/audit/', 'data/fingerprints/']) {
  const invalid = paths.filter((changed) => !allowed.some((prefix) => changed === prefix || changed.startsWith(prefix)) || PROTECTED_PATHS.some((p) => changed === p || changed.startsWith(p)));
  if (invalid.length) fail(`Candidate PR changes forbidden paths: ${invalid.join(', ')}`);
  return true;
}

function renderRule(candidate) {
  return `### ${candidate.id}\n\n- **Category:** ${candidate.category}\n- **State:** active\n- **Rule:** ${candidate.rule}\n- **Rationale:** ${candidate.rationale}\n- **Scope:** ${candidate.scope}\n- **Provenance:** [PR #${candidate.provenance.pull_request} comment ${candidate.provenance.comment_id}](${candidate.provenance.source_url}) by @${candidate.provenance.actor}\n`;
}

function updateInstructions(contents, candidate) {
  const start = '<!-- learned-rules:start -->', end = '<!-- learned-rules:end -->';
  const startAt = contents.indexOf(start), endAt = contents.indexOf(end);
  if (startAt < 0 || endAt < 0 || endAt <= startAt) fail('Learned-rule boundaries are missing or malformed.');
  const protectedBefore = contents.slice(0, startAt + start.length);
  let learned = contents.slice(startAt + start.length, endAt);
  if (candidate.action === 'add') learned = `${learned.trimEnd()}\n\n${renderRule(candidate)}\n`;
  else {
    const state = candidate.action === 'revoke' ? 'revoked' : 'superseded';
    const target = new RegExp(`(### ${candidate.target_id}\\n\\n[\\s\\S]*?- \\*\\*State:\\*\\* )active`);
    if (!target.test(learned)) fail('Target active rule was not found in learned rules.');
    learned = learned.replace(target, `$1${state}`);
    if (candidate.action === 'supersede') learned = `${learned.trimEnd()}\n\n${renderRule(candidate)}\n`;
  }
  return `${protectedBefore}\n${learned.trim()}\n\n${contents.slice(endAt)}`;
}

// Reads the functions a module exports and reports which ones a test file exercises.
// This is how the exercise proves a learned rule such as "always add tests" took effect:
// it inspects the real source and the real tests, not a chat transcript.
function testCoverage(sourceFile, testFile) {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const match = source.match(/module\.exports\s*=\s*\{([^}]*)\}/);
  if (!match) fail(`${sourceFile} does not export a module.exports object.`);
  const exported = match[1].split(',').map((name) => name.split(':')[0].trim()).filter(Boolean);
  if (!exported.length) fail(`${sourceFile} does not export any functions.`);
  const tests = fs.existsSync(testFile) ? fs.readFileSync(testFile, 'utf8') : '';
  const covered = exported.filter((name) => new RegExp(`\\b${name}\\b`).test(tests));
  const uncovered = exported.filter((name) => !covered.includes(name));
  return { exported, covered, uncovered };
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
module.exports = { CATEGORIES, testCoverage, parseCorrection, assertTrusted, makeCandidate, validateCandidate, validateWithSchema, evaluateRisk, evaluatePolicy, assertAllowedPaths, renderRule, updateInstructions, parseRules, fingerprint, stableId, fail, readJson, readYaml };
