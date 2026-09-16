## Review

_Congratulations, your repository now corrects itself! :tada:_

<img src="https://octodex.github.com/images/jetpacktocat.png" alt="celebrate" width="200" align="right">

You started with a review comment that would have been forgotten, and ended with a rule Copilot follows on every suggestion.

Here's what you built:

- **A durable correction**: One `/copilot-learn` comment became a permanent rule instead of a comment nobody re-reads
- **A deliberate trigger**: Ordinary feedback changes nothing, so only an explicit command can teach the repository
- **A reviewed change**: Automation proposed a pull request and a human decided, rather than writing to the default branch
- **A rule that works**: Copilot wrote the missing tests without being asked, because your rule was in its context
- **A policy for what merges itself**: Narrow additions land automatically while anything broad reaches a person
- **Guardrails that hold**: A well-formed correction asking to disable required checks was refused anyway

### Key takeaways

- **Instructions are memory.** Correcting Copilot in a review helps once; correcting it in `copilot-instructions.md` helps every time.
- **Explicit beats ambient.** If casual conversation could rewrite your instructions, every offhand remark would become policy.
- **Automation proposes, humans decide.** Auto-merge removed the reviewer only from cases where the reviewer added nothing.
- **Guardrails must be unreachable.** A correction that can edit workflows, validators, or policy is not a guardrail.

> [!NOTE]
> This exercise automated **repository instructions**. It does not train GitHub Copilot or make Copilot self-learning. See [`docs/platform-boundary.md`](../../blob/main/docs/platform-boundary.md) for where that line sits.

### What's next?

- Add a rule from a correction you have actually made in review this month.
- Run `npm run decide` after changing `.github/auto-merge-policy.yml` to see how the boundary moves.
- Read [`docs/rollback.md`](../../blob/main/docs/rollback.md) and practice revoking a rule that stopped being true.
- Learn more about [adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot).
- Check out the other [GitHub Skills exercises](https://learn.github.com/skills).
