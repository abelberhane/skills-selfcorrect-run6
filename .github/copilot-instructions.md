# Repository Copilot instructions

## Maintainer-controlled rules

Automation MUST NOT modify this section.

- Follow least-privilege security practices.
- Keep learner-facing instructions concise and action-oriented.
- Use Node.js 20 for repository automation.

<!-- learned-rules:start -->
## Learned rules

Rules below are managed only through reviewed candidate pull requests.

### RULE-TEST-PARSER-001

- **Category:** TEST
- **State:** active
- **Rule:** Always add or update unit tests when parser behavior changes.
- **Rationale:** Parser changes require regression coverage.
- **Scope:** repository
- **Provenance:** bootstrap example; approved by repository maintainers

### RULE-TEST-FAA1C2FD43E0

- **Category:** TEST
- **State:** active
- **Rule:** Always add unit tests for new exported functions.
- **Rationale:** applyDiscount shipped without any test coverage.
- **Scope:** path:src/
- **Provenance:** [PR #2 comment 5702740799](https://github.com/abelberhane/skills-selfcorrect-run6/pull/2#issuecomment-5702740799) by @abelberhane

<!-- learned-rules:end -->
