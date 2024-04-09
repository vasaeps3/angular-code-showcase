import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, merge } from 'rxjs';

@Component({
  selector: 'app-form-control-errors-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-control-errors-wrapper.component.html',
  styleUrl: './form-control-errors-wrapper.component.scss',
})
export class FormControlErrorsWrapperComponent implements OnInit, OnDestroy {
  @Input({ required: true }) public control!: AbstractControl | null;
  @Input() public errors: { [name: string]: string } | undefined;

  private subscriptions: Subscription[] = [];
  public preparedMessages: Observable<string>[] = [];

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.renderPreparedMessages();
    if (!this.control) {
      return;
    }

    this.subscriptions.push(
      merge(this.control.valueChanges, this.control.statusChanges).subscribe(
        () => this.renderPreparedMessages()
      )
    );
  }

  private renderPreparedMessages(): void {
    if (!this.errors) {
      return;
    }
    const preparedMessagesTpl = this.getErrors();

    this.preparedMessages = preparedMessagesTpl.map((tpl) =>
      this.translateService.get(tpl)
    );
  }

  private getErrors(): string[] {
    return Object.keys(this.errors || {}).filter((key) =>
      this.control?.hasError(key)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
