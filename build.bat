@echo off
set project=first-to-n-template
set version=2.0.0
set name=%project%-%version%

git archive HEAD --worktree-attributes -o build/%name%.zip
