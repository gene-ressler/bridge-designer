# Copyright (c) 2025-2026 Gene Ressler
# SPDX-License-Identifier: GPL-3.0-or-later

#!/bin/bash

branch=$(git branch --show-current)

# Ensure the worktree is in a known good state.
if [[ -n "$(git status --porcelain)" || "$branch" != "main" ]]; then
  echo "Worktree must be clean. Branch must be main."
  exit 1
fi

script_dir="$(dirname "$0")"

# Get git project root dir.
project_dir=$(git rev-parse --show-toplevel)

# Copy the contents of dist to the app directory.
site_source="$project_dir"
rm -rf "$site_source/app"
cp -R "$project_dir/dist/bridge-designer/browser" "$site_source"
mv "$site_source/browser" "$site_source/app"

index_html="$site_source/app/index.html"

# Edit the base URL of the root page to match the sites location.
sed -i 's@base href="/"@base href="/bridge-designer/app/"@' "$index_html"

# Inject Google analytics tag manager blurbs.
"$(dirname "$0")/inject.sh" "$index_html" '<head>' "$script_dir/gtm-head.html" '<body>' "$script_dir/gtm-body.html"

if [[ -z "$(git status --porcelain)" ]]; then
  echo 'No changes to commit. Continue with push anyway? (Y/n)'
  read -sn1 key
  if [[ "$key" == 'n' ]]; then
    exit;
  fi
fi
echo "Commit all changes and push /app to branch main? (Y/n))"
read -sn1 key
if [[ "$key" != 'n' ]]; then
  git add --all
  git commit -m 'Publish app.'
  # git push origin main
fi
