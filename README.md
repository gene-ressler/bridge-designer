<!-- Copyright (c) 2025-2026 Gene Ressler
     SPDX-License-Identifier: GPL-3.0-or-later -->

# Bridge Designer, Cloud Edition

This repository contains the Bridge Designer, Cloud Edition sources. It's a single-page Angular client-side application
with no back end.

The source is released under the [GNU Public License, v3](https://www.gnu.org/licenses). See [COPYING](COPYING).

## Releases

Following are subject to change.

- **Official release.** The supported, stable app release is hosted by the American Society of Civil Engineers
  [here](https://www.asce.org/career-growth/pre-college-outreach/bridge-designer). The project team is deeply grateful
  for this support.
- **Official release.** A staging app release with more info than presented in this page is
  [here](https://gene-ressler.github.io/bridge-designer/). This is meant for beta testers. We appreciate the Github
  support that allows this to work.
- **CLI tools.** Compiled command line tools for contest support and development are at
  [`/src/tools/dist`](src/tools/dist). See the [README](src/tools#readme) there.

## Pushes

Since the app is entirely client side, hosts need only serve it as a static page. The backing originals of both releases
are part of this repo. The ASCE release is at [`/app`](app/index.html). ASCE pulls it. The staging release is at
[`/docs`](docs/index.html). We push it via the built-in Github pages publishing hook triggered by pushes to branch
`publish-pages`. Scripts for all above are at [`/scripts`](scripts).

## Additional README docs

There are READMEs sprinkled throughout the source where organization, top level conventions, and non-obvious details
need explanation. Many are design notes that preceded implementation. We've cleaned them up _post hoc_, probably not
perfectly. If you find disconnects with respect to the code, please file an issue or PR. An index follows.

- [Source top level](src#readme)
  - [App container and logic](src/app#readme)
  - General features and shared functions
    - [User workflow management](src/app/features/controls/management#readme)
    - [Browser capability introspection](src/app/features/browser#readme)
    - [Session state](src/app/features/session-state#readme)
    - [Edit commands for undo/redo](src/app/features/controls/edit-command#readme)
    - [Shared services](src/app/shared/services#readme)
  - User features
    - [Drafting cursor actions](src/app/features/drafting/cursor-overlay#readme)
    - [Iterations](src/app/features/iterations#readme)
    - [Fly-thru test animation](src/app/features/fly-thru#readme)
      - [Rendering](src/app/features/fly-thru/rendering#readme)
      - [Shaders](src/app/features/fly-thru/shaders#readme)
      - [View pane](src/app/features/fly-thru/pane#readme)
    - [3d printing](src/app/features/printing-3d#readme)
  - Contest support
    - [Command line tool](src/tools#readme)
