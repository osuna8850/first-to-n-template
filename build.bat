@echo off
set project=first-to-n-template
set version=1.0.1
set name=%project%-%version%

git archive HEAD --worktree-attributes -o build/%name%.zip
