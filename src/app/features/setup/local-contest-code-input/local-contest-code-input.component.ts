import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { DesignConditionsService } from '../../../shared/services/design-conditions.service';

export const enum LocalContestCodeInputState {
  NONE,
  PREFIX,
  COMPLETE,
}

@Component({
  selector: 'local-contest-code-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './local-contest-code-input.component.html',
  styleUrl: './local-contest-code-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalContestCodeInputComponent {
  private static readonly LOCAL_CONTEST_MATCHER = /^[0-9A-Z]{3}\d\d[A-D]$/;
  private static readonly ERROR = { error: 'Oops. Not a local contest code' };
  private static readonly PREFIX = { prefix: 'Looks good so far!' };

  @Input() label: string = 'Enter contest code:';
  @Output() readonly change = new EventEmitter<LocalContestCodeInputState>();
  @ViewChild('localContestCodeInputRef') localContestCodeInputRef!: ElementRef<HTMLInputElement>;

  localContestCodeInput = new FormControl({ value: '', disabled: true }, this.validateLocalContestCode.bind(this));
  private state: LocalContestCodeInputState = LocalContestCodeInputState.NONE;

  constructor(private readonly designConditionsService: DesignConditionsService) {}

  public set disabled(value: boolean) {
    if (value) {
      this.localContestCodeInput.disable();
    } else {
      this.localContestCodeInput.enable();
    }
  }

  /** Returns a valid code, the empty string if none, or undefined if partial.  */
  public get code(): string | undefined {
    const value = this.localContestCodeInput.value;
    switch (value?.length) {
      case 0:
        return '';
      case 6:
        return value.toUpperCase();
      default:
        return undefined;
    }
  }

  public focus(): void {
    this.localContestCodeInputRef.nativeElement.focus();
  }

  private validateLocalContestCode(control: AbstractControl<string, string>): ValidationErrors | null {
    const value = control.value.toUpperCase();
    const result = this.validateLocalContestCodeValue(value);
    if (result === LocalContestCodeInputComponent.ERROR) {
      // Truncate bad suffix. Keep error. Causes a recursive validation on the fixed-up value.
      control.setValue(this.removeError(value)); 
    } else {
      this.emitStateChangeEvent(value.length);
    }
    return result;
  }

  private emitStateChangeEvent(codeLength: number): void {
    const newState = 
      codeLength == 0 
        ? LocalContestCodeInputState.NONE 
        : codeLength == 6 
          ? LocalContestCodeInputState.COMPLETE
          : LocalContestCodeInputState.PREFIX;
    if (newState !== this.state) {
      this.state = newState;
      this.change.emit(newState);
    }
  }

  private validateLocalContestCodeValue(value: string) : ValidationErrors | null {
    if (value.length === 0 || LocalContestCodeInputComponent.LOCAL_CONTEST_MATCHER.test(value)) {
      return null; // No errors. Valid.
    }
    const fakeCompletedValue = value + '00001A'.substring(value.length);
    if (LocalContestCodeInputComponent.LOCAL_CONTEST_MATCHER.test(fakeCompletedValue)) {
      return value.length < 3 || this.designConditionsService.isTagPrefix(value.substring(3))
        ? LocalContestCodeInputComponent.PREFIX
        : LocalContestCodeInputComponent.ERROR;
    }
    return LocalContestCodeInputComponent.ERROR;
  }

  /** Removes characters (normally only one) from the end of the value until it passes validation. */
  private removeError(value: string): string {
    while (value.length > 0) {
      value = value.substring(0, value.length - 1);
      if (this.validateLocalContestCodeValue(value) !== LocalContestCodeInputComponent.ERROR) {
        return value;
      }
    }
    return value;
  }
}
