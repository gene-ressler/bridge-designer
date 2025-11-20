/** Kinds of toast error. Must match id's in toast.component.html (except for 'noError'). */
export type ToastKind =
  | 'autofixInfo'
  | 'duplicateJointError'
  | 'duplicateMemberError'
  | 'fileReadError'
  | 'fileSaveSuccess'
  | 'fileWriteError'
  | 'highPierError'
  | 'moveJointError'
  | 'manifoldBuildFailedError'
  | 'noError' // silent cancellation
  | 'needWebGl2Error'
  | 'noMembersToAddError'
  | 'shaderError'
  | 'tooManyJointsError'
  | 'tooManyMembersError';

/** Exception handled by showing a toast.
 *
 * By convention, thrown in DraftingPanelComponent whenever possible. An exception is e.g. tooManyMembersError,
 * where DraftingPanelComponent doesn't have enough state. When thrown in deeper calls, take care to clean up.
 *
 * Handled in /shared/core/global-error-handler.service.ts.
 *
 * A toast can be shown without throwing (e.g. upon success) using eventBrokerService.toastRequest.
 */
export class ToastError extends Error {
  constructor(kind: ToastKind) {
    super(kind);
  }

  public get kind(): ToastKind {
    return this.message as ToastKind;
  }
}
