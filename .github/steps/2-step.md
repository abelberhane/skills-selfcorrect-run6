## Step 2: Watch good feedback disappear

> **Lesson 1 of 2 · Teach the repository something** · Step 2 of 8

### 📖 Theory: Review is where knowledge is born, and lost

Code review is the moment a team's standards actually get expressed. Someone reads a change and says "we don't do it that way here." That sentence is valuable, specific, and hard-won.

It is also written into a comment box that nothing ever reads again.

Copilot will not remember it. The next contributor will not see it. The same correction gets made in the next pull request, and the one after that. The knowledge never compounds.

A pull request is waiting for you. Look at it the way you would look at a teammate's work.

> [!NOTE]
> The pull request is titled **Add applyDiscount to the cart module**. Find it under the **Pull requests** tab.

### ⌨️ Activity: Review the pull request and leave ordinary feedback

1. Open the **Pull requests** tab and open **Add applyDiscount to the cart module**.

1. Select **Files changed** and read the new function. Compare it to the rest of `src/cart.js`.

1. Notice what is missing: every other exported function in this module has a test in `test/cart.test.js`. This one does not.

1. Confirm the automated checks do not catch it. The test suite passes, because passing tests say nothing about the tests nobody wrote.

   ```bash
   npm test
   ```

1. Leave a review comment the way you normally would. Anything in your own words, such as:

   ```md
   Please add tests for applyDiscount before we merge this.
   ```

1. Now open `.github/copilot-instructions.md` and look at the **Learned rules** section.

   Nothing changed. Your feedback was correct, clear, and completely forgotten. That is the problem you are about to fix.

1. Mona will check your work and share the next step.

<details>
<summary><b>Having trouble? 🤷</b></summary><br/>

- Comment on the pull request itself, not on the exercise issue.
- Write the comment in your own words. Do **not** use `/copilot-learn` yet — that is the next step, and this check expects an ordinary comment.
- If you cannot find the pull request, check the **Pull requests** tab. If it is missing, re-run the Step 1 workflow from the **Actions** tab to create it.
- Nothing should change in `.github/copilot-instructions.md` during this step. That is the expected result, not a failure.

</details>
