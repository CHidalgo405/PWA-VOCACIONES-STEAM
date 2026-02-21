import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  // --- MODELO DE CONFIGURACIÓN ---
  settings = {
    // General
    appName: 'STEAM Vocations',
    supportEmail: 'soporte@steamvocations.com',
    timezone: 'America/Mexico_City', // Zona horaria local (Córdoba, Veracruz)
    
    // IA Integration
    aiProvider: 'gemini',
    apiKey: '************************',
    aiTemperature: 0.7, // Creatividad de la IA (0 a 1)
    
    // Sistema
    maintenanceMode: false,
    enableSignups: true
  };

  // Variable para mostrar un mensaje de éxito al guardar
  showSuccessToast = false;

  saveSettings() {
    console.log('Guardando configuración de la app...', this.settings);
    
    // Simulamos que se guarda en la base de datos y mostramos la notificación
    this.showSuccessToast = true;
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
      this.showSuccessToast = false;
    }, 3000);
  }

  clearCache() {
    if(confirm('¿Estás seguro de limpiar la caché del sistema? Esto puede cerrar la sesión de algunos usuarios.')) {
      console.log('Caché limpiada.');
      alert('Caché del sistema liberada con éxito.');
    }
  }
}