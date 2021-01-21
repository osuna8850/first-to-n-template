set project=first-to-n-template
set version=1.0.0
set name=%project%-%version%

git-bash --cd=%~dp0 -c "git archive HEAD --worktree-attributes -o build/%name%.zip"
