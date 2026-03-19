import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  isLoading = false;
  isBlocked = false;

  constructor(private router: Router, private authService: AuthService, private toastService: ToastService) { }

  login() {
    if (!this.email || !this.password) {
      this.toastService.showToast('Por favor, ingresa tu correo y contraseña.', 'warning');
      return;
    }

    if (this.isBlocked) return;

    this.isLoading = true;

    this.authService.login(this.email, this.password).pipe(
      catchError(err => {
        this.isLoading = false;

        if (err.status === 429) {
          // Account locked — too many failed login attempts
          const apiMsg = err.error?.message || 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
          this.toastService.showToast(apiMsg, 'warning', 'Cuenta Bloqueada');
          this.isBlocked = true;

          // Try to parse remaining minutes from the API message to auto-unblock
          const match = apiMsg.match(/(\d+)\s*minuto/i);
          const minutes = match ? parseInt(match[1], 10) : 30;
          setTimeout(() => { this.isBlocked = false; }, minutes * 60 * 1000);

        } else if (err.status === 401 || err.status === 403) {
          const attemptsMsg = err.error?.message;
          this.toastService.showToast(
            attemptsMsg || 'Credenciales incorrectas o acceso denegado.',
            'error',
            'Acceso Denegado'
          );
        } else if (err.status === 0) {
          this.toastService.showToast('No se pudo conectar al servidor.', 'error', 'Sin Conexión');
        } else {
          this.toastService.showToast(
            err.error?.message || 'Ocurrió un error inesperado al iniciar sesión.',
            'error'
          );
        }
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res) {
        this.toastService.showToast('¡Inicio de sesión exitoso!', 'success', '¡Bienvenido!');
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  simularLoginGoogle(event: Event) {
    event.preventDefault();
    this.authService.loginWithGoogle();
  }

}