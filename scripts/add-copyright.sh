#!/bin/bash

# Copyright (c) 2025-2026 Gene Ressler
# SPDX-License-Identifier: GPL-3.0-or-later

# Add copyright and license notices to source files.
# Ignores those already added.

license='Copyright (c) 2025-2026 Gene Ressler
SPDX-License-Identifier: GPL-3.0-or-later'

c_license="/* $(sed '2,$s@^@   @' <<< $license) */
"

sh_license="$(sed 's@^@# @' <<< $license)
"

html_license="<!-- $(sed '2,$s@^@     @' <<< $license) -->
"

echo C-style comment:
cat <<< $c_license
echo Shell-style comment:
cat <<< $sh_license
echo HTML-style comment:
cat <<< $html_license

skip_ptn='img/|media/|docs/bridge-designer/|\.ico$|\.wasm$'
c_license_file_ptn='\.(ts|js|css|scss)$'
sh_license_file_ptn='\.(sh|py)$'
html_license_file_ptn='\.(html?|md)$'
c_license_ptn='^/* Copyright'
sh_license_ptn='^# Copyright'
html_license_ptn='^<!--Copyright'

project_root="$(git rev-parse --show-toplevel)"

for file in $(git ls-tree --full-tree -r --name-only HEAD); do
  path="$project_root/$file"
  if [[ ! -f "$path" || "$file" =~ $skip_ptn ]]; then
    continue
  fi
  tmp_file="/tmp/add-copyright-temporary-$(basename "$file")"
  first_line="$(head -n 1 $path)"
  if [[ "$file" =~ $c_license_file_ptn && ! "$first_line" =~ $c_license_ptn ]]; then
    cat - $path > "$tmp_file" <<< $c_license  && mv "$tmp_file" "$path"
  elif [[ "$file" =~ $sh_license_file_ptn  && ! "$first_line" =~ $sh_license_ptn ]]; then
    cat - $path > "$tmp_file" <<< $sh_license  && mv "$tmp_file" "$path"
  elif [[ "$file" =~ $html_license_file_ptn  && ! "$first_line" =~ $html_license_ptn ]]; then
    cat - $path > "$tmp_file" <<< $html_license && mv "$tmp_file" "$path"
  else 
    echo Skipped: $path
  fi
done
