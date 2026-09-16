## Step 3: Turn your feedback into a rule

> **Lesson 1 of 2 · Teach the repository something** · Step 3 of 8

### 📖 Theory: Say it once, on purpose

Your last comment changed nothing, and that was correct behavior. If casual conversation could rewrite the instructions that steer Copilot, then every offhand remark, every "hmm, maybe we should…", every quoted snippet would become policy.

So teaching has to be **deliberate**. This repository listens for one exact command, and ignores everything else:

```md
/copilot-learn
category: TEST
rule: Add unit tests for every new exported function.
rationale: applyDiscount shipped without tests and CI did not catch the gap.
scope: path:src/
```

Four fields, each doing a job:

| Field | Why it exists |
| --- | --- |
| `category` | Groups the rule and decides how carefully it is reviewed |
| `rule` | The instruction Copilot will actually follow — write it as a directive |
| `rationale` | The reason, so a future maintainer knows whether it still applies |
| `scope` | Where it applies, so a narrow lesson does not become a global mandate |

When you post this, automation reads the comment **as data** and opens a pull request. It never runs your text, and it never writes to the default branch on its own.

> [!IMPORTANT]
> The command must be on the very first line. A comment that merely mentions `/copilot-learn` in a sentence does nothing, which is what lets you talk *about* the command without triggering it.

### ⌨️ Activity: Post the correction and merge the candidate

1. Go back to the **Add applyDiscount to the cart module** pull request.

1. Post the correction above as a new comment. Copy it exactly, starting with `/copilot-learn` on the first line.

1. Open the **Actions** tab and watch **Propose instruction** run. It parses your comment, validates it, and opens a pull request.

1. Open the new pull request, titled **Instruction candidate: RULE-TEST-…**, and review it in **Files changed**. Confirm that:

   - your rule appears in the **Learned rules** section,
   - the **Maintainer-controlled** section is untouched,
   - the rule carries a **Provenance** link back to your comment.

1. Merge the candidate pull request.

1. Your rule is now on the default branch. Push an empty commit so the check can look at it.

   ```bash
   git commit --allow-empty -m "Teach the repository to require tests"
   git push
   ```

1. Mona will check your work and share the next step.

<details>
<summary><b>Having trouble? 🤷</b></summary><br/>

- **Nothing happened?** The command must be the first line of the comment, spelled exactly `/copilot-learn`. Backticks or quotes around it will stop it.
- **Workflow did not run?** Check **Settings → Actions → General** and confirm workflows are allowed to create pull requests.
- **Validation failed?** Read the workflow log. It names the exact field that was rejected. Missing `rationale` and an unknown category are the two most common causes.
- Keep `scope: path:src/`. A repository-wide absolute rule is treated as higher risk, which matters in Lesson 2.
- This check reads the default branch, so merge the candidate **before** you push.
- **"No learned rule found"** means the candidate was opened but never merged.

</details>
