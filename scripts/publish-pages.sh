# Copyright (c) 2025-2026 Gene Ressler
# SPDX-License-Identifier: GPL-3.0-or-later

#!/bin/bash

old_branch=$(git branch --show-current)

# Ensure the worktree is in a known good state.
if [[ -n "$(git status --porcelain)" || "$old_branch" != "main" ]]; then
  echo "Worktree must be clean. Branch must be main."
  exit 1
fi

# Get git project root dir.
project_dir=$(git rev-parse --show-toplevel)

# Copy the contents of dist to the pages site source.
site_source="$project_dir/docs"
rm -rf "$site_source/app"
cp -R "$project_dir/dist/bridge-designer/browser" "$site_source"
mv "$site_source/browser" "$site_source/app"

# Edit the base URL of the root page to match the sites location.
sed -i 's@base href="/"@base href="/bridge-designer/app/"@' "$site_source/app/index.html"

if [[ -z "$(git status --porcelain)" ]]; then
  echo 'No changes to commit.'
  exit;
fi
echo "Commit changes, switch from branch ${old_branch} to publish-pages, merge, and push? (Y/n))"
read -sn1 key
if [[ "$key" != 'n' ]]
then
  git add --all
  git commit -m 'Publish pages.'
  git switch publish-pages
  git merge main
  # Push to trigger publish
  git push origin publish-pages
fi

# Restore old branch
git switch "$old_branch"
