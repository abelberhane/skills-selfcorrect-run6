# Rollback and lifecycle

Do not erase accepted history. Revoke a harmful rule by proposing `action: revoke` with its `target_id`; supersede an obsolete rule with `action: supersede`. Both operations require human review. If an instruction PR must be reverted, use a normal revert pull request, retain its candidate and audit records, and add a revocation entry explaining the rollback.
