# Architecture

A trusted maintainer comment on a Copilot-associated pull request is parsed as data, never executed. `propose-instruction.yml` creates a deterministic candidate, validates it, renders only the bounded learned-rules section, records provenance, and opens a pull request. `evaluate-instruction.yml` revalidates every update, checks changed paths and risk, and either requests human review or enables native GitHub auto-merge.

```mermaid
flowchart LR
  C[Trusted /copilot-learn comment] --> P[Strict parser]
  P --> V[Schema and safety validators]
  V -->|blocked| H[Targeted feedback]
  V --> R[Candidate + fingerprint + audit]
  R --> PR[Instruction update PR]
  PR --> E[Revalidate paths and risk]
  E -->|medium/high/ambiguous| H
  E -->|deterministic low risk| A[Enable native auto-merge]
  A --> B[Branch protection and required checks]
```
