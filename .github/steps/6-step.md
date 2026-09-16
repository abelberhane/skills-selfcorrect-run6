## Step 6: Put the automation behind branch protection

> **Lesson 2 of 2 · Let it merge itself** · Step 6 of 8

### 📖 Theory: Auto-merge waits in line, it does not skip it

"Auto-merge" sounds like the automation gets to push whenever it likes. It is the opposite. GitHub's auto-merge **queues** a pull request and merges it only once every required check has passed and every rule you set is satisfied.

That distinction is what makes the next step safe. Your policy decides what is *eligible*; branch protection decides what is *possible*. If the two ever disagree, branch protection wins.

So before you let anything merge itself, you make the floor solid:

- **A required check** means no pull request merges until the evaluator has passed on it, including the automation's own.
- **No direct pushes** to `main` means every change — yours and the robot's — arrives through a pull request.

> [!IMPORTANT]
> Never use administrator overrides or `--admin` to force a merge in this exercise. An automation that can bypass its own guardrails has none.

### ⌨️ Activity: Require the evaluator check

1. Go to **Settings → Branches** and select **Add branch ruleset** (or edit an existing one).

1. Target the `main` branch.

1. Enable **Require status checks to pass**, then search for and select **Evaluate instruction candidate**.

1. Enable **Require a pull request before merging**.

1. Save the ruleset.

### ⌨️ Activity: Turn on auto-merge for the repository

1. Go to **Settings → General**.

1. Under **Pull Requests**, select **Allow auto-merge**.

1. Confirm **Allow squash merging** is also selected. The policy specifies `method: squash`.

1. Commit and push from your working branch so the check can run.

   ```bash
   git switch teach-the-repo
   git pull origin main --no-rebase
   git commit --allow-empty -m "Guard auto-merge with branch protection"
   git push
   ```

   `main` no longer accepts direct pushes — that is the protection you just configured doing its job.

1. Mona will check your work and share the next step.

<details>
<summary><b>Having trouble? 🤷</b></summary><br/>

- **Cannot find the status check?** It only appears after it has been reported at least once. Your step 3 candidate already reported it, so search for `Evaluate instruction candidate` and it should be there.
- The check is named exactly **Evaluate instruction candidate**, matching `required_checks` in your policy.
- If pushing to `main` now fails, that is branch protection working. Push to `teach-the-repo` instead.
- **"The auto-merge policy is not enabled on the default branch"** means your step 5 pull request was never merged. Merge it, then `git pull origin main --no-rebase` and push again.
- Do not enable **Allow force pushes** or any bypass list. The next two steps assume the floor holds.

</details>
