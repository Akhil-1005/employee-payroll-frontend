import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.model';

interface StoredSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

const SESSION_KEY = 'payroll.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly session = signal<StoredSession | null>(this.restoreSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.user.role === 'ADMIN');

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, request).pipe(
      map((response) => response.data),
      tap((data) => this.saveSession({
        token: data.token,
        user: data.user,
        expiresAt: Date.now() + data.expiresInMs,
      })),
      map((data) => data.user),
    );
  }

  logout(reason?: 'expired'): void {
    this.saveSession(null);
    this.router.navigate(['/login'], reason ? { queryParams: { reason } } : {});
  }

  /** Current token, or null when missing or expired. */
  getToken(): string | null {
    const current = this.session();
    if (!current) {
      return null;
    }
    if (current.expiresAt <= Date.now()) {
      this.saveSession(null);
      return null;
    }
    return current.token;
  }

  private saveSession(session: StoredSession | null): void {
    this.session.set(session);
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode); the in-memory session still works
    }
  }

  private restoreSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw) as StoredSession;
      if (!session.token || session.expiresAt <= Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}
