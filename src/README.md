# Bridge Designer, Cloud Edition (BDCE)

This is a redesign and implementation as a web app of the Engineering Encounters Bridge Designer, formerly the West
Point Bridge Designer. Engineering Encounters no longer exists, so the new app is just "Bridge Designer," and it's the
"Cloud edition" becaust it no longer relies on a native binary installed locally. Earlier versions were desktop apps
originally in Visual Basic for Windows (circa 2000) and then Java (2003 through present) for Windows and Mac OSX. Our
purpose is to make the app useful on more platforms, particularly Chromebooks, which are common in K-12 schools.

# Design considerations

BDCE is an Angular app with these goals and characteristics

- **Same UI:** Closely replicate the UI of the old implementations. The old UI works well. Teachers have lesson plans
  and knowledge based on it. We don't want to cause needless disruption.
- **Small devices:** Run well on minimal hardware. Chromebooks in schools are often minimally spec'ed and/or old.
- **Small host:** Put minimal load on the host. Host resources are dear to nil.

# Top-level technical choices

The following are key, top-level design choices:

- [**jqwidgets:**](https://www.jqwidgets.com/) BDCE uses jqwidgets as the primary UI library. It's full-featured,
  reasonably priced, free for development sans tech support, and not many bugs. On the other hand, the APIs are a bit
  quirky, limited and inconsistent. Documentation is mostly by example rather than explanation. This is inadequate when
  no example covers a needed use case. Reverse engineering and studying the mostly uncommented code are the only
  alternatives. The jqwidgets team apparently doesn't have a normal issues workflow. Their management tool is a
  community board.

- **Stateful services**: Against common wisdom favoring central stores with pure reduction semantics, BDCE provides many
  services with mutable internal state. This supports "Small devices" above by reducing garbage collection pressure. It
  does complicate persistence across browswer refreshes. It's also well-aligned with the way state is implemented in
  other versions.

- **Decoupling via broadcast messages**: I considered various schemes for allowing one component or service to pass
  information needed by another. Most of them cause "Law of Demeter" violations: nasty dependency webs. I've chosen to
  use RxJ `Subject`s as broadcast event channels. Another way to think of them is in-app pubsub.

# Use of RxJs Subjects

Subject names are nouns. General categories are:

- **Simple clicks and other kinds of request:** buttons and menu items.
  - Name of Subject ends in `Request`.
- **Toggles:** buttons and menu items that toggle on successive clicks.
  - Name of Subject ends in `Toggle`.
- **Selects:** groups of buttons and menu items.
  - Name of Subject ends in `Select`.
- **Completions:** Some update of state or UI has been completed.
  - Name of Subject ends in `Completion`.
- **Change:** Some chunk of state has been updated.
  - Name of Subject ends in `Change`.

`UiStateService` manages flow of events generated and subscribed to by UI widgets.

By convention, dialogs always open in response to a Subject event. They often broadcast a different Subject to effect
results: loading a new bridge, users' saved bridge, sample bridge, sketch, etc.

# Subordinate service instances

Most services require only a single instance in the root injector. In several cases, more are required; multiple
versions of the state they contain are needed. A common example is dialogs with preview panes that show bridges. For
these we need to re-use the rendering logic for drafting panel views. But this logic injects e.g. `BridgeService` and
several other containers for the rendered bridge model. We need a different copy. To accomplish this, we use
component-level `providers` for the corresponding dialog. The entire "tree" of injected dependencies must be included.
See `SampleSelectionDialog` for a prototypical example. But there are several similar ones.

Note that within the scope of these component-level providers, the root instance is invisible. This is a problem when
the goal of the dialog is to mutate a root instance. Adding a sketch to the root bridge is an example. How to get
access? Games with injection tokens would work. But the simplest solution I could find is `RootBridgeService` which is
just a wrapper for a reference. When injected within component provider scope, it still refers to the root instance we
need.
