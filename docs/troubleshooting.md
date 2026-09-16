# Troubleshooting

- **Command not recognized:** `/copilot-learn` must be the first line. Use only documented `key: value` fields.
- **Actor rejected:** Confirm the comment author is an OWNER, MEMBER, or explicitly configured trusted login. A label alone is insufficient.
- **Candidate blocked:** Read the stable feedback comment; remove secrets, executable text, ambiguity, contradiction, or governance changes.
- **Auto-merge not enabled:** Confirm policy is enabled, only allowed paths changed, all required labels exist, risk is low, and repository auto-merge is enabled.
- **Auto-merge waits:** This is expected while branch protection, required reviews, or checks are pending. Do not bypass them.
- **Fork workflow lacks secrets:** Expected by design. Validation requires no secrets and fork code is not run with privileged tokens.


## Starting the exercise

- **Nothing happened after copying the exercise:** **Step 0** runs automatically on the first push to `main`. Open the **Actions** tab and confirm the **Step 0** run succeeded, then refresh the repository home page.
- **Step 0 fails with "could not add label":** The exercise labels were not created. Confirm **Settings** > **Actions** > **General** uses **Read and write permissions**, then re-run **Step 0** from the **Actions** tab.
- **A step workflow never runs:** Only one step workflow is enabled at a time. Each step disables itself and enables the next one when it passes. Open the **Actions** tab, confirm the expected **Step N** workflow is enabled, and re-run it with **Run workflow** if needed.
- **Pushing does not trigger the current step:** Step workflows run on pushes to any branch except the automation's own `copilot-instruction/**` branches. If nothing ran, confirm the expected **Step N** workflow is enabled in the **Actions** tab.
- **You want to restart:** Close the exercise issue, revert your changes, then enable and run **Step 0** from the **Actions** tab. Audit entries are append-only, so revoke or supersede rules instead of deleting history.

## Reviewing and teaching

- **No pull request to review in step 2:** The **Add applyDiscount to the cart module** pull request is created when **Step 1** passes. If it is missing, re-run **Step 1** from the **Actions** tab; it will not open a duplicate.
- **Your comment did not change anything:** In step 2 that is the expected result. Ordinary feedback must never modify the instructions file.
- **`/copilot-learn` did nothing:** It must be the first line of the comment, with no backticks, quotes, or leading text. A comment that mentions the command mid-sentence is ignored on purpose.
- **Copilot did not write tests in step 4:** Model output varies. Write the test yourself and continue; the graded artifact is the test file, not the chat.
- **`applyDiscount is not defined` in the tests:** Add it to the `require` line at the top of `test/cart.test.js`.
- **Step 4 says applyDiscount is missing:** Run `git switch add-discount` first. The function only exists on the review branch until that pull request merges.
- **Unsure what your policy allows:** Run `npm run decide` for a table of how each kind of correction would be classified.

## Repository setup problems

- **Candidate PR is not created:** Open **Settings** > **Actions** > **General**, select **Read and write permissions**, enable **Allow GitHub Actions to create and approve pull requests**, and save.
- **Auto-merge option is unavailable:** Open **Settings** > **General** and enable **Allow auto-merge** under **Pull Requests**.
- **Allow auto-merge is greyed out:** The most common cause is a **private repository on GitHub Free**, where auto-merge is unavailable. Make the repository public, upgrade the plan, or use the manual-merge fallback. Select **Why is this option disabled?** to confirm the reason for your repository.
- **Auto-merge unavailable for any reason:** Continue without it. Steps 5–8 grade your policy, evaluator, and instructions file. Verify the evaluator labels a safe candidate `copilot-auto-merge-approved` and an unsafe candidate `copilot-needs-human-review`, then merge manually after checks pass.
- **A pull request is blocked by the required check:** **Evaluate instruction candidate** runs on every pull request and passes immediately without the `copilot-instruction-candidate` label. If it never reports, confirm Actions is enabled and the workflow exists on the default branch.
- **"Evaluate instruction candidate" is not found in Add checks:** The picker only suggests checks that ran recently, and it may not list a check that never ran on the default branch. Type the name exactly, `Evaluate instruction candidate`, and select it. If it still will not save, open any small pull request so the check reports once, then retry within a few minutes.
- **Check name mismatch:** The required check name must match the workflow job name exactly, including capitalization. It is defined by `name: Evaluate instruction candidate` in `.github/workflows/evaluate-instruction.yml`.
- **Required check is not listed:** A check is only selectable after it runs once. Complete Lesson 1, then add **Evaluate instruction candidate** in **Settings** > **Rules** > **Rulesets** (**Require status checks to pass**) or **Settings** > **Branches** (**Require status checks to pass before merging**).
- **"This ruleset does not target any resources":** Add a target under **Target branches** with **Add target** > **Include default branch**.
- **Ruleset shows a Disabled badge:** Set **Enforcement status** to **Active**, then save. Disabled rulesets never apply.
- **Auto-merge merges without waiting:** Confirm the ruleset is active, targets the default branch, has an empty bypass list, and lists **Evaluate instruction candidate** as required.
- **Wording does not match the documentation:** Rulesets say **Require status checks to pass**; classic branch protection says **Require status checks to pass before merging**. Either one works.
- **Organization policy locks a setting:** Ask a repository or organization administrator to enable it. You can still run the local deterministic simulation without these settings.

## "GitHub Actions is not permitted to create or approve pull requests"

New repositories block Actions from opening pull requests. This exercise depends
on automation opening candidate pull requests, so nothing works until it is on.

Step 0 turns this on for you. If your organization restricts the setting, do it
by hand:

1. Go to **Settings → Actions → General**.
2. Under **Workflow permissions**, select **Allow GitHub Actions to create and approve pull requests**.
3. Select **Save**.
4. Re-run the failed job from the **Actions** tab.

Leave **Read repository contents and packages permissions** selected. Every
workflow in this exercise requests the permissions it needs explicitly.

## The candidate pull request shows no checks

GitHub holds workflow runs on pull requests opened by `github-actions[bot]`
until someone approves them, so a check triggered by the candidate pull request
itself would sit pending forever.

The evaluation therefore runs inside **Propose instruction**, the run your own
comment triggered, and reports its verdict as a commit status named
**Evaluate instruction candidate**. That is the status you require in step 6.

If a candidate has no status at all, open the **Propose instruction** run in the
**Actions** tab and read the **Evaluate the candidate** step.
