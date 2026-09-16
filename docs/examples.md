# Comment examples

## Correction comment

```text
/copilot-learn
category: TEST
rule: Add unit tests when parser behavior changes.
rationale: The original implementation omitted parser regression tests.
scope: path:scripts/
action: add
```

## Candidate pull request comment

> Candidate `RULE-TEST-5EE6E879B20F` passed schema, provenance, safety, duplicate, contradiction, path, and risk checks. Risk: **low**. The learned-rules section is the only instruction content changed.

## Blocked feedback

> This candidate was blocked because it attempts to change governance. Instruction candidates cannot modify workflows, validators, CODEOWNERS, permissions, branch protection, or auto-merge policy. Remove that request and submit a narrowly scoped repository instruction.
