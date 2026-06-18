import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent {
  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  twoFactorEnabled: boolean = false;

  activeSessions = [
    { device: 'iPhone 13 Pro', location: 'Ciudad de México', time: 'En línea', current: true, icon: 'smartphone' },
    { device: 'MacBook Pro (Chrome)', location: 'Ciudad de México', time: 'Hace 2 horas', current: false, icon: 'laptop' },
    { device: 'Windows PC (Edge)', location: 'Guadalajara', time: 'Ayer', current: false, icon: 'monitor' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  savePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showSuccessToast("Las contraseñas no coinciden.");
      return;
    }
    
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.showSuccessToast("Por favor completa todos los campos.");
      return;
    }

    this.isSubmitting = true;
    
    this.userService.updatePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.showSuccessToast('Contraseña cambiada con éxito.');
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Error al cambiar contraseña', err);
        const detail = typeof err.error?.message === 'string' ? err.error.message : 'Error al actualizar contraseña';
        this.showSuccessToast(`Error: ${detail}`);
      }
    });
  }

  toggle2FA() {
    this.twoFactorEnabled = !this.twoFactorEnabled;
    this.showSuccessToast(this.twoFactorEnabled ? '2FA Activado simulado' : '2FA Desactivado');
  }

  logoutAllSessions() {
    if (confirm('¿Estás seguro de cerrar sesión en todos los demás dispositivos?')) {
      this.showSuccessToast('Sesiones cerradas correctamente.');
      this.activeSessions = [this.activeSessions[0]]; // Solo mantener la actual
    }
  }

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
