#!/bin/bash

# Copyright (c) 2025-2026 Gene Ressler
# SPDX-License-Identifier: GPL-3.0-or-later

# Build without changing version and push to all targets
if [[ "$1" == "--bump-version" ]]; then
  npm run build
else
  ng build
fi

echo 'Deploying to firebase...'
firebase deploy
echo 'Deploying to Github pages...'
./publish-pages.sh
echo 'Deploying to ASCE app server...'
./publish-app.sh
