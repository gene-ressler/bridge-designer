# App-level functionality

The app component is both a container and the logic for a few important functions.

## Dialogs

Most dialogs are included in the component template. As explained elsewhere, they are decoupled from their uses via
`EventBrokerService`. They're here to ensure rendering placement consistency by making them children of the same
enclosing DOM element.

## Top-level UI elements

The app frame includes menus, toolbars, the drafting area, fly-through animation pane, member table, and rulers.
Visibility control logic is included.

## Session state save logic

Session state is triggered by app window hide events.

## Startup logic

This is a fairly complicated flow that begins at app level, but continues through other components and services. We'll
document it here. At heart it is a state machine, but the state is implicit and spread out. Transitions are by UI
events. I wish there were an easier-to-grok way of implementing this, but don't see one.

A complicating factor is that part of the flow takes place before Angular is bootstrapped. 

The logic might be clearer if depicted as a flow chart, but here it is in all its GOTO glory.

```
<startup>: Entry at app/index.html
  // main.ts
  Browser check
  // browser-checks.ts
  IF browser features are missing THEN
    Check session storage for previously saved browser features
    IF previous browser features match current THEN
      GOTO <continue startup> // Bypass warning; it's already been given
    END IF
    Show confirmation warning dialog including missing features
    IF user wants help THEN
      // main.ts
      Redirect to missing features page
      // public/browserinfo/index.html
      Links
        Back to Bridge Designer: GOTO <startup> // via redirect
        Project home page
    ELSE // user ignores warnings
      Save features to local storage
      GOTO <startup> // via redirect
    END IF
  END IF
<continue startup>: Features are okay or resolved
  Bootstrap angular
  // ui-state.service.ts
  UI state service constructor runs before all others in bootstrap sequence having saved state:
  IF URL search parameters include "reset" THEN
    Clear session storage
  END IF
  Other constructors throughout app restore services and components from session state, if any.
  // app.component.ts
  IF session state was restored THEN
    // missing-feature-disabler-dialog.component
    Disable Bridge Designer features based on missing browser features, if any
    // app.component.ts
    IF session state was NOT from same tab context THEN
      Show dialog allowing restart without saved session state
      // allow-fresh-start-dialog.component.ts
      IF user desires restart THEN
        Add "reset" to URL search parameters
        GOTO <startup> // via redirect
      END IF
      // tip-dialog.component.ts
      Show Tips dialog (skip if disabled by user)
    END IF
  ELSE
    // missing-feature-disabler-dialog.component
    IF missing browser features require disabling Bridge Designer features THEN
      Show dialog warning user about what's disabled.
    END IF
    Disable Bridge Designer features based on missing browser features, if any.
    // tip-dialog.component.ts
    Show Tips dialog (skip if disabled by user)
  END IF
  // contest-welcome-dialog.component.ts
  IF contest parameters are set THEN
    Splash a welcome dialog for a few seconds or until user dismisses.
  END IF
```
