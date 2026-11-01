import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { PageResponse } from '../../../core/models/page.model';

/**
 * Previous / next pager for any {@link PageResponse}. Emits the zero-based page to load.
 * Hidden when the list is empty.
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (page().totalElements > 0) {
      <nav class="pager" aria-label="Pagination">
        <span class="pager__summary">Showing {{ range().from }}–{{ range().to }} of {{ page().totalElements }}</span>
        <div class="pager__controls">
          <button type="button" class="btn btn--secondary btn--sm" [disabled]="page().first || disabled()"
                  (click)="pageChange.emit(page().page - 1)">Previous</button>
          <span class="pager__position">Page {{ page().page + 1 }} of {{ page().totalPages }}</span>
          <button type="button" class="btn btn--secondary btn--sm" [disabled]="page().last || disabled()"
                  (click)="pageChange.emit(page().page + 1)">Next</button>
        </div>
      </nav>
    }
  `,
})
export class PaginatorComponent {
  readonly page = input.required<PageResponse<unknown>>();
  /** Disables the buttons, e.g. while a page is loading. */
  readonly disabled = input(false);
  readonly pageChange = output<number>();

  protected readonly range = computed(() => {
    const p = this.page();
    const from = p.page * p.size + 1;
    return { from, to: from + p.content.length - 1 };
  });
}
