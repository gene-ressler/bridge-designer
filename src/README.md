# Bridge Designer, Cloud Edition (BDCE)

This is a redesign and implementation as a web app of the Engineering Encounters Bridge Designer, formerly the West
Point Bridge Designer. Engineering Encounters no longer exists, so the new app is just "Bridge Designer," and it's the
"Cloud edition" because it no longer relies on a binary installed locally. Earlier versions were desktop apps originally
in Visual Basic for Windows (circa 2000) and then Java (2003 through present) for Windows and Mac OSX. Our purpose is to
make the app useful on many more platforms, particularly Chromebooks, which have grown to be common in K-12 schools.

# Design considerations

BDCE is an Angular app with these goals and characteristics

- **Same UI:** Closely replicate the UI of the old implementations. The old UI works well. Teachers have lesson plans
  and knowledge based on it. We don't want to cause needless disruption.
- **Small devices:** Run well on minimal hardware. Chromebooks in schools are often minimally spec'ed and/or old.
- **Small host:** Put minimal load on the host. Host resources are dear to nil.

# Top-level technical choices

The following are key, top-level design choices:

- [**jQWidgets:**](https://www.jqwidgets.com/) BDCE uses jQWidgets as the primary UI library. It's full-featured,
  reasonably priced, free for development sans tech support, and not many bugs. On the other hand, the APIs are a bit
  quirky, limited, and inconsistent. Documentation is mostly by example rather than explanation. Reverse engineering and
  studying the mostly uncommented code are necessary. The jQWidgets team apparently doesn't have a normal issues
  workflow. Their management tool is a community board with a pay wall. My intent is to pay in for at least one year of
  support once the implementation is as complete as possible without it.

- **Stateful services**: Against common wisdom favoring central stores with pure reduction semantics over immutable
  objects, BDCE provides many services with mutable internal state. This supports "Small devices" above by vastly
  reducing garbage collection pressure. It's also well-aligned with the way state is implemented in other versions. It
  does complicate persistence across browswer refreshes.

- **Decoupling via broadcast messages**: I considered various schemes for allowing one component or service to pass
  information needed by another. Most of them cause "Law of Demeter" violations: nasty dependency webs. I've chosen to
  use RxJ `Subject`s as broadcast event channels. Another way to think of them is in-app pubsub.

# Use of RxJs Subjects

Subject names are nouns. General categories are:

- **Simple click or other kinds of request:** button, menu item, etc.
  - Name of Subject ends in `Request`.
- **Toggle:** button or menu item that toggles on successive clicks.
  - Name of Subject ends in `Toggle`.
- **Select:** groups of buttons and menu items where exactly one is selected.
  - Name of Subject ends in `Select`.
- **Completion:** major mutation or UI state has been updated. I.e., side effect.
  - Name of Subject ends in `Completion`.
- **Change:** a single logical entity has been updated.
  - Name of Subject ends in `Change`.
- **Pending change:** some chunk of state is about to be updated.
  - Name of Subject ends with

`UiStateService` manages flow of events generated and subscribed to by UI widgets. It also handles disabling of UI
elements using subjects as keys. Hence all widges performing the same function are disabled/enabled as a group.

By convention, dialogs always open in response to a Subject event. They often broadcast a different Subject to effect
results: loading a new bridge, users' saved bridge, sample bridge, sketch, etc.

# Subordinate service instances

Most services require only a single instance in the root injector. In several cases, more are required; multiple
versions of the state they contain are needed. A common example is dialogs with preview panes that show bridges. For
these we need to re-use the rendering logic for drafting panel views. But this logic injects e.g. `BridgeService` and
several other containers for the rendered bridge model. We need a different copy. To accomplish this, we use
component-level `providers` for the corresponding dialog. The entire "tree" of injected dependencies must be included.
See `SampleSelectionDialog` for a prototypical example. But there are several similar ones.

Note that within the scope of these component-level providers, the root instance is invisible by default. This is a
problem when the goal of the dialog is to mutate a root instance. Adding a sketch to the root bridge is an example. How
to get access? Injection tokens could work. But the simplest solution seems to be a 2-line `RootBridgeService` which is
just a wrapper for a reference. When injected within component provider scope, it still refers to the root instance we
need.

# Dependencies

Reliance on external libraries is intended to be minimal in order to reduce maintenance forced by others. Yet, some
features were not worth the cost of re-inventing the wheel:

- [**jQWidgets**](https://www.jqwidgets.com/): The UI widget framework discussed above.
- [**Orama (open source version)**](https://docs.orama.com/open-source): Full text search for Bridge Designer help.
- Possible: [**three.js**](https://threejs.org/): An abstraction layer over native WebGL. Adds some useful functions.

We thank the providers now and forever.

# Master TODO

- Animation
- Auto-correct
- Complete help edit
- Dirty for save management
- Legacy animation
- Load and save
- Member details
- Printing, 2D
- Printing, 3D
