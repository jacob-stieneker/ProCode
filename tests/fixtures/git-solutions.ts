export const gitSolutions: Record<string, string> = {
  'git-feature': `git switch -c feature/greeting
git add app.txt
git commit -m "Add greeting"
git push -u origin feature/greeting`,
  'git-stage': `git switch -c feature/docs
git add docs.txt
git commit -m "Update guide"
git push -u origin feature/docs`,
  'git-stash': `git stash push -m "Feature draft"
git switch -c hotfix/login main
practice write login.txt "fixed"
git add login.txt
git commit -m "Fix login"
git push -u origin hotfix/login
git switch feature/work
git stash pop`,
  'git-merge': `git fetch origin
git merge origin/main
practice write app.txt "Hello main and feature"
git add app.txt
git commit -m "Resolve greeting conflict"
git push -u origin feature/greeting`,
  'git-rebase': `git fetch origin
git rebase origin/main
git push -u origin feature/search`,
  'git-pick': `git switch -c release/login main
git cherry-pick c2
git push -u origin release/login`,
  'git-revert': `git switch -c fix/revert-release
git revert c2
git push -u origin fix/revert-release`,
  'git-recover': `git reflog
git switch -c recovery/work HEAD@{1}
git push -u origin recovery/work`,
  'git-lease': `git commit --amend -m "Prepare review feature"
git push --force-with-lease origin feature/review`,
};
