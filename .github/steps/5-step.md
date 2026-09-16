## Step 5: Decide what can merge itself

> **Lesson 2 of 2 · Let it merge itself** · Step 5 of 8

### 📖 Theory: Not every correction deserves the same scrutiny

Lesson 1 worked, but it asked you to review a pull request whose entire content was four lines you wrote yourself. Do that twenty times and you will start rubber-stamping — which is worse than not reviewing at all, because now the ceremony provides false comfort.

The fix is not "review less carefully." It is to decide **in advance, in writing**, which corrections are boring enough to merge themselves.

That decision lives in `.github/auto-merge-policy.yml`, and it is deliberately mechanical. The same correction always gets the same answer, with no model call and nothing to argue about:

| Signal | Why it matters |
| --- | --- |
| **Category** | `SECURITY`, `ARCH`, and `PROCESS` change how the team operates |
| **Scope** | `path:src/` teaches a corner; `repository` rewrites everything |
| **Length** | A rule too long to skim is too long to approve unread |
| **Action** | Adding is reversible; superseding and revoking change existing guidance |

> [!NOTE]
> Everything that is not provably low risk still goes to a human. The policy narrows what automation may do; it never widens it.

### ⌨️ Activity: Turn on the policy and see what it decides

1. Preview what your policy does right now.

   ```bash
   npm run decide
   ```

   Every row says the policy is disabled. Nothing can merge itself yet.

1. Open `.github/auto-merge-policy.yml` and turn it on.

   ```yaml
   enabled: true
   ```

1. Confirm the guardrails below it. `allowed_risk` must stay `low`, and `blocked_categories` must contain `ARCH`, `PROCESS`, and `SECURITY`.

1. Run the preview again.

   ```bash
   npm run decide
   ```

   Now you should see the split: narrow rules auto-merge, while repository-wide mandates, security rules, and process changes go to human review.

1. Commit and push from your working branch.

   ```bash
   git switch teach-the-repo
   git commit -am "Enable low-risk auto-merge"
   git push
   ```

1. Open a pull request from `teach-the-repo` and merge it.

   Candidate pull requests branch from `main`, so a policy that exists only on your working branch would never apply to them.

1. Mona will check your work and share the next step.

<details>
<summary><b>Having trouble? 🤷</b></summary><br/>

- Change only `enabled`. The other values are already calibrated for this exercise.
- If `npm run decide` still shows everything under human review, check that `allowed_risk` is `low` and that you saved the file.
- Removing a category from `blocked_categories` makes that category eligible for automation. The check will fail if `ARCH`, `PROCESS`, or `SECURITY` is missing.
- The policy file itself is a protected path, so no correction can ever edit it. That is deliberate.
- Merging to `main` matters here. The next step checks that your policy actually landed there.

</details>
