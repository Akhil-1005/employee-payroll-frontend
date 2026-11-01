import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Simple dialog. Render it with @if in the parent so its content is created fresh on every open.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div class="modal" [class.modal--wide]="wide()" role="dialog" aria-modal="true"
           [attr.aria-label]="title()" (click)="$event.stopPropagation()">
        <header class="modal__header">
          <h2>{{ title() }}</h2>
          <button type="button" class="icon-btn" aria-label="Close" (click)="closed.emit()">&#x2715;</button>
        </header>
        <div class="modal__body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly wide = input(false);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
