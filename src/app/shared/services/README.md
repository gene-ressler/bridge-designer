# Shared services

Here are services used by more than one component or other service.

## Bridge sketch service:

This holds algorithms for generating descriptions of the grayed sketches that the UI calls "templates." We avoid that
word for naming BD objects because Angular uses it differently.

### Bridge sketch data service

This is a subordinate to `BridgeSketchService` for holding data descriptions of more sketches. It covers cases where
algorithms would be too complex to be worthwhile. The data were originally constructed using the BD itself in a special
"sketch writing" mode.

TODO: Duplicate this capability in the current edition.

## Event broker

This is just an injectable container for read-only RxJs `Subject`s that serve as internal pubsub channels. You might
argue they all ought not to be in a single place in the source, but I can't come up with a down side.

## Session state service: preserving state through browser reloads

The BD has chunks of state scattered over many services and some components. As is normal practice, we leverage a host
listener at the app level to handle `window:beforeunload`. The handler writes state to local storage. Individual
constructors reload state previously saved, when it exists.

**_How does the handler collect all the data fragments?_** `SessionStateService` manages this task. It uses ngRx
broadcast subject `sessionStateSaveRequest`. Every component and service with state to be persisted subcribes. On
receipt of the request, each marshals the essential state and calls back to the service `recordState` method to position
it for writing to local storage. Arguments include a tag. The service accumulates a map of tag/state object pairs and
writes it when the broadcast is complete. Because it is synchronously scheduled, completion implies the state map is
ready to write, hence it is written.

**_How is saved state restored?_** Each respective constructor queries the service with its tag. The first arriving
query causes the service to look for saved state in local storage, read in the map formerly saved, and cache it.
Subsequent queries are answered with lookups in the cached map.

**_What about service/component dependencies?_** For better or worse, much BD logic depends on `===` equality of object
references. For example, members hold references directly to joints, which must be `===` to the corresponding objects in
the bridge's `joints` array. This means that in some cases, the order of state restoration matters. For example,
`BridgeService` holds the current bridge. Any other service holding references to joints or members must restore those
references with values `===` to respective objects in the bridge. This requires the bridge to be restored first.

**_Happily, injector construction is our friend._** The app-level injector must visit the tree of injection dependencies
in post order: a class's injections must be constructed before its own can complete. We can exploit this algorithm to
restore state to services and components in a valid order. In the `BridgeService` example, any service that injects it
is guaranteed to see the restored bridge before its own restore commences because the `BridgeService` injector - along
with its state restoration - has already run.

**_Is injection order a valid proxy for restoration order?_** Yes. If a class holds a reference R to some object O that
has `===` dependencies, it must save a representation of O to local storage, not the reference itself. An example is
saving a joint index rather than the joint. When the representation is to be used for restoration, translating it back
to an object with the correct `===` reference value invariably means querying the service that owns it. In our example,
it must look up `joints[index]`. To query it, the service must be injected. And, Bob's your uncle!

## UI State service

Implements the feature where multiple jqxWidget controls have the same function, hence all should

- invoke the same handler
- have identical disable/enable behavior
- TODO: have common tool tip text

Java Swing provided all this for the previous version. `UiStateService` workign with `EventBrokerService duplicate it,
but with a very different pattern. They also support "UI mode" disablement. The modes are e.g. initial (no visible
bridge), design, and animation. For each widget, we need to override normal enablement with disable. E.g. we want most
but not all widgets disabled while in "initial" mode. This was provided by a seperate class in Java.

The implementation uses `EventBroker` `Subject`s as keys to group respective widgets.
