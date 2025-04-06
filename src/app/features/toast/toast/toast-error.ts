/**
 * Kinds of toast error.
 *
 * Thrown in DraftingPanelComponent whenever possible. An exception is tooManyMembersError, where
 * DraftingPanelComponent doesn't have enough state. When throw in deeper calls, take care to clean up.
 */
export type ToastErrorKind =
  | 'duplicateJointError'
  | 'duplicateMemberError'
  | 'highPierError'
  | 'moveJointError'
  | 'tooManyJointsError'
  | 'tooManyMembersError';

export class ToastError extends Error {
  constructor(kind: ToastErrorKind) {
    super(kind);
  }

  public get kind(): ToastErrorKind {
    return this.message as ToastErrorKind;
  }
}
