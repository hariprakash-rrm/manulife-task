import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private queryCount = 0;
  private mutateCount = 0;

  readonly queryLoading = signal(false);
  readonly mutateLoading = signal(false);

  showQuery(): void {
    this.queryCount++;
    this.queryLoading.set(true);
  }

  hideQuery(): void {
    this.queryCount = Math.max(0, this.queryCount - 1);
    if (this.queryCount === 0) {
      this.queryLoading.set(false);
    }
  }

  showMutate(): void {
    this.mutateCount++;
    this.mutateLoading.set(true);
  }

  hideMutate(): void {
    this.mutateCount = Math.max(0, this.mutateCount - 1);
    if (this.mutateCount === 0) {
      this.mutateLoading.set(false);
    }
  }
}
