# Issues

## Master TODO

- Complete help edit
  - @ 60%
- Member details
- Printing, 3D

## Issues

- Help should be its own window. 
  - Maybe not since BD best in full screen mode anyway?
  - Use router to select either help or BD.
- Scenario numbers in Project IDs are inconsistent:
  - Project ID of sample is loading with scenario number in text.
  - Scenario number missing in print views.
- Central texture manager. Should initiate loading all at startup.
- Defer loading of late/intermittent use code: help, print, fly-through.
- Limited hardware resilience? Need more info.

# Fixed issues

- Dirty edit save behavior missing for samples
- Material selector being reset way too often e.g. when changing modes.
- Edit joint should be selected automatically for new designs, file loads, and sample loads.
- Pause button is affecting water. Shouldn't.
- Watermarks on jqWidgets need removal.
- Need "loading..." display during app setup.
- Design conditions in setup wizard incorrectly loaded from root bridge.
- Printing test results.
- Some graphics (help for sure) still say 2016.
- Failed members should be colored in drafting view after test.
- Some sample designs fail.
- Tree view of iteration dialog is not scrolling. 
  - Scolls on reload, but previous failed iteration is missing. 
  - Present in list.
  - Reappears in tree if branch is collapsed and re-opened.
