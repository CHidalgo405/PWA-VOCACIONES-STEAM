import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: (ToastMessage & { id: number; timeoutId: any })[] = [];
  private subscription!: Subscription;
  private currentId = 0;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toast$.subscribe(toast => {
      const newToast = { ...toast, id: this.currentId++ } as any;
      this.toasts.push(newToast);

      // Auto dismiss after 5 seconds
      newToast.timeoutId = setTimeout(() => {
        this.removeToast(newToast.id);
      }, 5000);
    });
  }

  removeToast(id: number) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      clearTimeout(this.toasts[index].timeoutId);
      this.toasts.splice(index, 1);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getDefaultTitle(type: string): string {
    switch (type) {
      case 'success': return 'Éxito';
      case 'error':   return 'Error';
      case 'warning': return 'Advertencia';
      case 'info':    return 'Información';
      default:        return 'Notificación';
    }
  }
}
