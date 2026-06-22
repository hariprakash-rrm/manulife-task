import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from './core/services/loader.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  readonly loaderService = inject(LoaderService);
  readonly toastService = inject(ToastService);

  getToastClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-white/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10 animate-toast-in';
      case 'error':
        return 'bg-white/95 border-rose-200 text-rose-900 shadow-rose-500/10 animate-toast-in';
      case 'warning':
        return 'bg-white/95 border-amber-200 text-amber-900 shadow-amber-500/10 animate-toast-in';
      default:
        return 'bg-white/95 border-indigo-200 text-indigo-900 shadow-indigo-500/10 animate-toast-in';
    }
  }
}
