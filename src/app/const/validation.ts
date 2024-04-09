import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { web3 } from '../services/web3.service';

export function NoWhitespaceValidator(
  control: AbstractControl
): ValidationErrors | null {
  const isWhitespace = (control.value || '').trim().length === 0;
  const isValid = !isWhitespace;

  return isValid ? null : { whitespace: true };
}

export function importedValidator(
  control: FormControl
): ValidationErrors | null {
  if (control.value !== null) {
    const isImported = !!localStorage.getItem(control.value.toLowerCase());
    if (!isImported) {
      return { isNotImported: true };
    }
  }
  return null;
}

export function addressValidator(
  control: FormControl
): ValidationErrors | null {
  if (!!control.value) {
    if (web3 && web3.utils.isAddress(control.value)) {
      return null;
    } else {
      return { invalidAddress: true };
    }
  } else {
    return null;
  }
}
