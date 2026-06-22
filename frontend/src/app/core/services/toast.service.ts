import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: any, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3500): void {
    let msgStr = '';
    if (Array.isArray(message)) {
      msgStr = message.join(', ');
    } else if (message && typeof message === 'object') {
      msgStr = message.message || JSON.stringify(message);
    } else {
      msgStr = message ? String(message) : '';
    }

    // Deduplicate identical toasts shown within a short interval
    if (this.toasts().some(t => t.message === msgStr && t.type === type)) {
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message: msgStr };
    this.toasts.update(toasts => [...toasts, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  showSuccess(message: string): void {
    this.show(message, 'success');
  }

  showError(message: string): void {
    this.show(message, 'error');
  }

  showInfo(message: string): void {
    this.show(message, 'info');
  }

  showWarning(message: string): void {
    this.show(message, 'warning');
  }

  dismiss(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
