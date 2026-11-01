import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const DISMISS_AFTER_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastList = signal<Toast[]>([]);

  readonly toasts = this.toastList.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.toastList.update((list) => list.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string): void {
    const id = this.nextId++;
    this.toastList.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS);
  }
}
