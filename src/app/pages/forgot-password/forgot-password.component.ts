import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService) { }

  async onResetPassword() {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Por favor, ingresa tu correo electrónico.';
      return;
    }

    this.loading = true;

    try {
      await this.authService.resetPassword(this.email);
      this.successMessage = 'Se ha enviado un enlace para restablecer tu contraseña a tu correo.';
      this.email = ''; // Clear the input on success
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        this.errorMessage = 'No se encontró una cuenta con este correo.';
      } else if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'El correo electrónico no es válido.';
      } else {
        this.errorMessage = 'Ocurrió un error al intentar enviar el correo. Intenta de nuevo más tarde.';
      }
    } finally {
      this.loading = false;
    }
  }
}
