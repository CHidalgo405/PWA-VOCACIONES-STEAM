import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);

  isSubmitting = false;
  isLoading = true;
  isConnectingPush = false;
  isSendingTest = false;
  showToast = false;
  toastMessage = '';
  toastIsError = false;
  private originalPushEnabled = false;

  notificationSettings = {
    pushEnabled: false,
    emailEnabled: true,
    emailMarketing: false,
    weeklySummary: true,
    newCareersAlerts: true,
    testReminders: true,
    communityMessages: false,
  };

  ngOnInit(): void {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario: any) => {
        const settings = usuario?.settings;
        if (settings) {
          for (const key of Object.keys(
            this.notificationSettings,
          ) as (keyof typeof this.notificationSettings)[]) {
            if (typeof settings[key] === 'boolean') {
              this.notificationSettings[key] = settings[key];
            }
          }
        }
        this.originalPushEnabled = this.notificationSettings.pushEnabled;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showMessage('No se pudieron cargar tus preferencias.', true);
      },
    });
  }

  toggleSetting(key: keyof typeof this.notificationSettings): void {
    this.notificationSettings[key] = !this.notificationSettings[key];
  }

  async saveNotifications(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    try {
      if (this.notificationSettings.pushEnabled !== this.originalPushEnabled) {
        await this.notificationService.syncPushSubscription(
          this.notificationSettings.pushEnabled,
        );
      }
      await firstValueFrom(
        this.userService.updateSettings(this.notificationSettings),
      );
      this.originalPushEnabled = this.notificationSettings.pushEnabled;
      this.showMessage('Preferencias guardadas y canales sincronizados.');
    } catch (error: any) {
      this.notificationSettings.pushEnabled = this.originalPushEnabled;
      this.showMessage(
        error?.error?.message ||
          error?.message ||
          'No se pudieron guardar las preferencias.',
        true,
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  async connectThisDevice(): Promise<void> {
    if (this.isConnectingPush) return;
    this.isConnectingPush = true;
    try {
      await this.notificationService.syncPushSubscription(true);
      this.notificationSettings.pushEnabled = true;
      await firstValueFrom(
        this.userService.updateSettings({ pushEnabled: true }),
      );
      this.originalPushEnabled = true;
      this.showMessage('Este dispositivo quedó suscrito a Web Push.');
    } catch (error: any) {
      this.showMessage(
        error?.error?.message ||
          error?.message ||
          'No fue posible activar Web Push.',
        true,
      );
    } finally {
      this.isConnectingPush = false;
    }
  }

  sendTestNotification(): void {
    if (this.isSendingTest) return;
    this.isSendingTest = true;
    this.notificationService.sendTest().subscribe({
      next: () => {
        this.isSendingTest = false;
        this.showMessage('Notificación de prueba enviada a tus dispositivos.');
      },
      error: (error) => {
        this.isSendingTest = false;
        this.showMessage(
          error?.error?.message || 'No existe una suscripción push activa.',
          true,
        );
      },
    });
  }

  permissionLabel(): string {
    const permission = this.notificationService.permission;
    if (permission === 'granted') return 'Permiso concedido';
    if (permission === 'denied') return 'Permiso bloqueado en el navegador';
    if (permission === 'default') return 'Permiso aún no solicitado';
    return 'Web Push no compatible';
  }

  private showMessage(message: string, isError = false): void {
    this.toastMessage = message;
    this.toastIsError = isError;
    this.showToast = true;
    window.setTimeout(() => (this.showToast = false), 4500);
  }
}
