import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  isSubmitting: boolean = false;
  isLoading: boolean = true;
  showToast: boolean = false;
  toastMessage: string = '';

  // Preferencias reales persistidas en UserSettings (BD)
  notificationSettings = {
    // Canales
    pushEnabled: true,
    emailEnabled: true,
    emailMarketing: false,

    // Categorías
    weeklySummary: true,
    newCareersAlerts: true,
    testReminders: true,
    communityMessages: false
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // Cargar las preferencias guardadas para reflejar el estado real.
    this.authService.obtenerPerfil().subscribe({
      next: (usuario: any) => {
        const s = usuario?.settings;
        if (s) {
          for (const key of Object.keys(this.notificationSettings) as (keyof typeof this.notificationSettings)[]) {
            if (typeof s[key] === 'boolean') this.notificationSettings[key] = s[key];
          }
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  toggleSetting(key: keyof typeof this.notificationSettings) {
    this.notificationSettings[key] = !this.notificationSettings[key];
  }

  saveNotifications() {
    if (this.isSubmitting) return; // anti-spam
    this.isSubmitting = true;

    this.userService.updateSettings(this.notificationSettings).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessToast('Preferencias de notificación guardadas con éxito.');
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Error guardando ajustes', err);
        this.showSuccessToast('Hubo un error al guardar las preferencias.');
      }
    });
  }

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
