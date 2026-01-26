# Copyright (c) 2025-2026 Gene Ressler
# SPDX-License-Identifier: GPL-3.0-or-later

#!/bin/bash

# Build without changing version and push to all targets
if [[ "$1" == "--bump-version" ]]; then
  npm run build
else
  ng build
fi

firebase deploy
./publish-pages.sh
