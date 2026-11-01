import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { LabelPipe } from '../../shared/pipes/label.pipe';

interface NavItem {
  path: string;
  label: string;
  icon: 'users' | 'calendar' | 'leave' | 'wallet';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LabelPipe],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);

  protected readonly navItems = computed<NavItem[]>(() => {
    const admin = this.auth.isAdmin();
    const items: NavItem[] = [
      { path: '/attendance', label: admin ? 'Attendance' : 'My attendance', icon: 'calendar' },
      { path: '/leaves', label: admin ? 'Leave requests' : 'My leave', icon: 'leave' },
      { path: '/payroll', label: admin ? 'Payroll' : 'My payroll', icon: 'wallet' },
    ];
    return admin ? [{ path: '/employees', label: 'Employees', icon: 'users' }, ...items] : items;
  });

  protected readonly initials = computed(() => (this.auth.user()?.username ?? '?').slice(0, 1).toUpperCase());

  protected logout(): void {
    this.auth.logout();
  }
}
