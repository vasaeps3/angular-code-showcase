import { AbstractControl } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { FormControlErrorsWrapperComponent } from '../form-control-errors-wrapper/form-control-errors-wrapper.component';

@Component({
  selector: 'app-form-control-wrapper',
  standalone: true,
  imports: [FormControlErrorsWrapperComponent],
  templateUrl: './form-control-wrapper.component.html',
  styleUrl: './form-control-wrapper.component.scss',
})
export class FormControlWrapperComponent {
  @Input({ required: true }) public control!: AbstractControl | null;
  @Input() public errors: { [name: string]: string } | undefined;
}
