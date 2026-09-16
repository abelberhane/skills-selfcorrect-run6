# Threat model

| Threat | Control |
|---|---|
| Command or prompt injection | Exact command grammar; allowed fields only; comment content is never executed |
| Untrusted correction | Verify immutable actor login and author association; labels are contextual only |
| Secret disclosure | No pull-request-target execution of fork code; token/credential patterns are blocked |
| Privilege escalation | Candidates cannot alter workflows, schemas, validators, CODEOWNERS, permissions, or policy |
| Automation loop | Ignore workflow-authored pull requests and candidate PR comments |
| Unsafe merge | Revalidate every update; native auto-merge waits for branch protections and checks |
| History loss | Stable IDs, fingerprints, provenance, audit records, and lifecycle states preserve rollback history |
