import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../components/header/header.component';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';

  // Agrupado por canales y categorías
  notificationSettings = {
    // Canales Globales
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,

    // Categorías (dependientes de los canales)
    emailMarketing: false,
    weeklySummary: true,
    newCareersAlerts: true,
    testReminders: true,
    achievements: true,
    communityMessages: false
  };

  constructor(private userService: UserService) {}

  toggleSetting(key: keyof typeof this.notificationSettings) {
    this.notificationSettings[key] = !this.notificationSettings[key];
  }

  saveNotifications() {
    this.isSubmitting = true;
    
    // Aquí mapeamos a lo que el backend realmente espera
    // Por ahora simulamos que guarda todo
    this.userService.updateSettings(this.notificationSettings).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessToast('Preferencias de notificación guardadas con éxito.');
      },
      error: (err) => {
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
