import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PayrollBreakdown } from '../../../core/models/payroll.model';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Full salary breakdown for one employee and month. */
@Component({
  selector: 'app-payroll-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, LabelPipe],
  templateUrl: './payroll-breakdown.component.html',
})
export class PayrollBreakdownComponent {
  readonly breakdown = input.required<PayrollBreakdown>();
}
