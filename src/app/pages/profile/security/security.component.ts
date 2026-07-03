import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../core/services/user.service';

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

  constructor(private userService: UserService) {}

  savePassword() {
    if (this.isSubmitting) return; // anti-spam: evita doble envío

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showSuccessToast('Las contraseñas no coinciden.');
      return;
    }

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.showSuccessToast('Por favor completa todos los campos.');
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

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
