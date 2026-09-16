const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { parseCorrection, assertTrusted, makeCandidate, validateCandidate, validateWithSchema, evaluateRisk, evaluatePolicy, assertAllowedPaths, updateInstructions, readYaml } = require('../scripts/lib');
const valid = JSON.parse(fs.readFileSync('test/fixtures/valid/correction.json'));
function candidate(event=valid) { assertTrusted(event); return makeCandidate(parseCorrection(event.body), event, '2026-01-01T00:00:00.000Z'); }
test('strictly parses a trusted correction into a deterministic candidate', () => { const c=candidate(); assert.equal(c.id,'RULE-TEST-22321F30FEC5'); assert.equal(validateCandidate(c,[]).valid,true); });
test('low-risk scoped candidate qualifies for policy evaluation', () => { assert.deepEqual(evaluateRisk(candidate()), {risk:'low',reasons:[],autoMergeEligible:true}); });
test('maintainer section is unchanged while learned rule is rendered', () => { const before=fs.readFileSync('.github/copilot-instructions.md','utf8'); const after=updateInstructions(before,candidate()); assert.equal(after.split('<!-- learned-rules:start -->')[0],before.split('<!-- learned-rules:start -->')[0]); assert.match(after,/RULE-TEST-22321F30FEC5/); });
test('candidate pull requests can only change data and instructions', () => { assert.equal(assertAllowedPaths(['.github/copilot-instructions.md','data/candidates/rule.json']),true); assert.throws(()=>assertAllowedPaths(['.github/workflows/pwn.yml']),/forbidden paths/); });
for (const name of fs.readdirSync('test/fixtures/unsafe')) test(`rejects unsafe fixture: ${name}`, () => { const event=JSON.parse(fs.readFileSync(`test/fixtures/unsafe/${name}`)); if (event.drop_provenance) { const c=candidate(event); delete c.provenance; assert.equal(validateCandidate(c,[]).valid,false); return; } assert.throws(() => { const c=candidate(event); const result=validateCandidate(c,[]); if (!result.valid) throw new Error(result.errors.join('; ')); }); });
test('detects duplicate fingerprint', () => { const c=candidate(); assert.match(validateCandidate(c,[{...c,state:'active'}]).errors.join(' '),/Duplicate/); });
test('supersedes and revokes only active learned rules', () => { const before=fs.readFileSync('.github/copilot-instructions.md','utf8'); const c={...candidate(),action:'revoke',target_id:'RULE-TEST-PARSER-001'}; const after=updateInstructions(before,c); assert.match(after,/State:\*\* revoked/); });

test('malformed candidates fail schema validation without crashing', () => { assert.equal(validateCandidate({ rule: 4 }, []).valid, false); });
test('auto-merge requires every policy condition', () => {
  const c=candidate();
  // The template ships with the policy switched off; the learner enables it in step 5.
  const policy={...readYaml('.github/auto-merge-policy.yml'),enabled:true};
  const context={labels:['copilot-instruction-candidate'],paths:['.github/copilot-instructions.md',`data/candidates/${c.id}.json`,`data/audit/${c.id}.jsonl`,`data/fingerprints/${c.id}.json`]};
  assert.equal(evaluatePolicy(c,policy,context).autoMergeEligible,true);
  assert.equal(evaluatePolicy(c,{...policy,enabled:false},context).autoMergeEligible,false);
  assert.equal(evaluatePolicy(c,policy,{...context,paths:[...context.paths,'.github/workflows/pwn.yml']}).autoMergeEligible,false);
  // Raising the ceiling must allow more, not less.
  assert.equal(evaluatePolicy(c,{...policy,allowed_risk:'medium'},context).autoMergeEligible,true);
  // A sensitive category is high risk and can never qualify.
  assert.equal(evaluatePolicy({...c,category:'SECURITY'},policy,context).autoMergeEligible,false);
});
test('candidate and policy schemas are executable', () => { assert.equal(validateWithSchema(candidate(),'schemas/candidate.schema.json').valid,true); assert.equal(validateWithSchema(readYaml('.github/auto-merge-policy.yml'),'schemas/auto-merge-policy.schema.json').valid,true); });
