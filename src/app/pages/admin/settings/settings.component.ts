import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { DialogService } from '../../../core/services/dialog.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  private dialogService = inject(DialogService);

  // --- MODELO DE CONFIGURACIÓN ---
  settings = {
    // General
    appName: 'Vocaciones STEAM',
    supportEmail: 'soporte@vocacionessteam.com',
    timezone: 'America/Mexico_City', // Zona horaria local (Córdoba, Veracruz)

    // IA Integration
    aiProvider: 'groq',
    apiKey: '************************',
    aiTemperature: 0.7, // Creatividad de la IA (0 a 1)

    // Sistema
    maintenanceMode: false,
    enableSignups: true
  };

  // Variable para mostrar un mensaje de éxito al guardar
  showSuccessToast = false;
  toastMessage = '';
  isSubmitting = false;

  saveSettings() {
    // Basic validation logic is handled via ngForm in HTML, checking empty values here just in case.
    if (!this.settings.appName.trim() || !this.settings.supportEmail.trim() || !this.settings.apiKey.trim()) {
      this.displayToast('Por favor, completa los campos obligatorios correctamente.', true);
      return;
    }

    this.isSubmitting = true;

    setTimeout(() => {
      this.isSubmitting = false;
      this.displayToast('¡Configuración guardada exitosamente!');
    }, 800);
  }

  displayToast(message: string, isError: boolean = false) {
    this.toastMessage = message;
    this.showSuccessToast = true;
    setTimeout(() => this.showSuccessToast = false, 3000);
  }

  async clearCache() {
    const confirmed = await this.dialogService.confirm(
      'Limpiar Caché',
      '¿Estás seguro de limpiar la caché del sistema? Esto puede cerrar la sesión de algunos usuarios.',
      { confirmText: 'Sí, limpiar caché', isDanger: true }
    );
    
    if (confirmed) {
      await this.dialogService.alert('Caché Liberada', 'Caché del sistema liberada con éxito.');
    }
  }
}