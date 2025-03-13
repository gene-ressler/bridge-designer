# Iterations

An iteration from the user's point of view is a non-empty series of design changes followed by a test. The BD captures
the bridge at the end of each iteration. At this point, the iteration is considered frozen. The captured bridge is
immutable.

The UI allows the user to jump among iterations. For each jump, the captured bridge is restored, and design continues as
a fresh iteration. To be precise, the fresh iteration begins at the next user action that changes the bridge.

A significant detail is that when a user jumps to a different iteration before performing a test in the current one, the
iteration is considered complete and frozen just as though a test had been peformed. Such an iteration is consided
"abandoned."

## The iteration in progress

For reference, the BD maintains a sequence number for each iteration. The number of the _iteration in progress_, i.e.
the design visible at the moment in the drafting panel, is always displayed to the user. To be precise about the term
"in progress," there are two possibilities:

- The in-progress bridge design hasn't yet been tested. This is an "open iteration."
- A test has been performed, but the design hasn't yet been changed. This is a "closed iteration."

Testing a bridge automatically causes capture of the drafting panel design along with the in-progress iteration number.

Changing a tested design and then performing some edit operation automatically creates a new, open, in-progress
iteration with the next available number. The user sees the diplayed in-progress iteration number advance by one. This
is the only mechanism for creating new iterations. As a consequence, multiple tests of an unchanging design (reasonable
to repeatedly view the truck animation) are all part of the same iteration.

## Iteration objects

In the implementation, an iteration is an object including the bridge model, the status resulting from the corresponding
test, and its cost. The bridge model may be a frozen deep copy (for closed iterations) or a shallow reference to the
bridge currently in the drafting panel (open in-progress iteration). From these, a full description can be drawn:

- Iteration number.
- Test status: Pass, fails load, fails slenderness, unstable. "None" is the pseudo-state for untested iterations.
  - Note the status of the iteration in progress comes directly from analysis validity service.
- Bridge cost.
- Project ID.
- Child iterations. (See below.)

Since the Project ID can be modified at any time, the user can effectively use it to label iterations as desired.

## Iteration jumping

At any time, the user can ask the BD for a dialog with a list of past iterations including the one in progress. A
preview pane shows a sketch of the currently selected one. The user can choose to jump their design to the selected
iteration. This jump can be backward or forward in the iteration sequence. There are three possibilities:

- User chooses the in-progress iteration and...
  - ...it's open. This is a no-op. The user continues the design and test cycle as though the dialog hadn't been
    invoked.
  - ...it's closed. Also a no-op. The iteration remains closed until the user makes a further change.
- User chooses an earlier iteration.

What happens in the second case?

- First we need to deal with the in-progress iteration:
  - If it was open, it is captured and closed without a test. Its status is "no test."
  - If it was closed, no further work is required. Its bridge model was already captured as tested.
- Next, the captured bridge of the chosen iteration is restored to the drafting panel.
- The displayed iteration number becomes the one taken from the restored bridge model.
- The undo manager's commnand buffer is cleared.
- If the bridge's status was pass or fail, the bridge is re-analyzed automatically. "Working" bridges - unstable or
  abandoned - are not.
- Regardless of whether the newly restored bridge was analyzed, it's treated as the end of a closed iteration. Any
  change creates a fresh iteration and increments the displayed number. Testing the bridge as restored does not.

Notes:

- This logic is sufficient to maintain immutability of closed iterations.
- Closing abandoned iterations seems less confusing for users than causing them to be continued after a jump and return
  even though the undo state is gone. (Maintaining undo state would be complex and memory-intense.)

## Parent-child relation of iterations

Every iteration has a natural child relationship with its predecessor. After a jump, the jumped-to iteration becomes the
parent of the next iteration created. Since an iteration can be jumped-to any number of times, parent-child pairs
naturally form an n-ary tree.

The UI widget offers two views of available iterations:

- List in iteration number order.
- Treegrid showing parent-child relatiohships. Each run of parent and successively numbered descendents is shown as a
  single list. Each time an iteration is jumped-to, it gets a new list, which again continues as long as descendents are
  successivel numbered.
  - It's an unfortunate detail that the treegrid view hides some information. If the same iteration is jumped-to
    multiple times, each followed by a sequence of new iterations, these sequences are effectively concatenated into a
    single list in the treegrid view. TODO: It may be possible to give visual cues - via an extra column of iconsor
    similar - where the sublists are separated. This would make the view capable of showing the full multi-tree
    structure.

For the user, it's expected that the list view is superior for going back a small number of iterations, while the
treegrid makes it easier to navigate among major decision points.

## Lifetimes

Iterations persist throughout a user's session until user requests a new bridge, sample bridge, or previously saved
bridge.

Iterations are part of session state, so live between uses of the same browser/machine combination.

## Implementation details

- Dialog component.
- Design iteration service. Container for iteration data.
- Displayed iteration number.
- Interaction with analysis validity service.
- Interaction with session state preservation.

## Data structures

- Array of design iteration records
  - Source data for UI widgets
  - Treegrid uses parent reference option.
- The in-progress iteration refers to the current bridge. So dialog preview reflects current state. A closed bridge gets
  a deep copy snapshot.
- Reference by index including parent pointer.
- State:
  - Iteration array.
  - In-progress iteration index.
  - "In-progress iteration is closed" flag.

## Event handling

- Load bridge. Three cases.
  - New bridge, sample bridge, or user's bridge.
    - Clear iterations.
    - Create open in-progress iteration numbered from the bridge model (already set to 1 for new bridges).
  - Load iteration bridge.
    - Do nothing. (Previously closed iteration is now in-progress.)
- User chooses iteration.
  - If current in-progress, do nothing.
  - Else
    - Close in-progress iteration by deep copy.
    - Change in-progress pointer to closed iteration chosen and load its bridge model.
- Analysis complete.
  - If current iteration is open, close it.
  - Update in-progress iteration status. This is relevant where "working" was set for newly loaded and previously
    abandoned iterations.
- Edit command completion.

  - If in-progress iteration is closed, create a fresh, open iteration with the next sequence number. Drafting panel
    bridge gets sequence number updated to this.
  - Else in-progress iteration is open. Do nothing.

  ## Notes:

  - Undo/redo on a closed iteration behave like any other command. A new in-progress iteration is created.
