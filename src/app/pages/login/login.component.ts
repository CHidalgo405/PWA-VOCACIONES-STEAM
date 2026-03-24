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
  
  // Two-step verification state
  isVerificationStep = false;
  isVerifying = false;
  verificationCode = '';
  otpFailedAttempts = 0;
  readonly MAX_OTP_ATTEMPTS = 3;


  // Rate limiting state
  failedAttempts = 0;
  MAX_ATTEMPTS = 5;
  BLOCK_TIME_MINUTES = 5;

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
          // Account locked — too many failed login attempts (already handled by backend)
          const apiMsg = err.error?.message || 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
          this.toastService.showToast(apiMsg, 'warning', 'Cuenta Bloqueada');
          this.isBlocked = true;

          // Try to parse remaining minutes from the API message to auto-unblock
          const match = apiMsg.match(/(\d+)\s*minuto/i);
          const minutes = match ? parseInt(match[1], 10) : this.BLOCK_TIME_MINUTES;
          setTimeout(() => { this.isBlocked = false; }, minutes * 60 * 1000);

        } else if (err.status === 401 || err.status === 403) {
          this.failedAttempts++;
          const remaining = this.MAX_ATTEMPTS - this.failedAttempts;

          if (this.failedAttempts >= this.MAX_ATTEMPTS) {
            this.isBlocked = true;
            this.toastService.showToast(
              `Has superado el límite de intentos. Por favor, espera ${this.BLOCK_TIME_MINUTES} minutos.`,
              'error',
              'Cuenta Bloqueada'
            );
            setTimeout(() => {
              this.isBlocked = false;
              this.failedAttempts = 0;
            }, this.BLOCK_TIME_MINUTES * 60 * 1000);
          } else if (this.failedAttempts >= 2) {
            this.toastService.showToast(
              `Credenciales incorrectas. ¡Cuidado! Te quedan solo ${remaining} intentos.`,
              'warning',
              'Aviso de Seguridad'
            );
          } else {
            this.toastService.showToast(
              err.error?.message || 'Credenciales incorrectas.',
              'error',
              'Acceso Denegado'
            );
          }
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
        this.failedAttempts = 0; // Reset counter on success
        if (res.accessToken) {
          // Si el servidor envía el token directamente (ej. admin bypass o no requiere 2FA)
          this.toastService.showToast('¡Inicio de sesión exitoso!', 'success', '¡Bienvenido!');
          if (this.authService.isAdmin()) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          // Si el servidor responde con éxito pero no hay token, significa que se envió el OTP
          this.toastService.showToast('Por favor, ingresa el código enviado a tu correo.', 'success');
          this.isVerificationStep = true;
        }
      }
    });
  }

  onVerifyOTP() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.toastService.showToast('Por favor, ingresa el código de 6 dígitos.', 'warning');
      return;
    }

    this.isVerifying = true;

    this.authService.verifyLogin(this.email, this.verificationCode).pipe(
      catchError(err => {
        this.isVerifying = false;
        
        if (err.status === 401 || err.status === 400 || err.status === 403) {
          this.otpFailedAttempts++;
          const remaining = this.MAX_OTP_ATTEMPTS - this.otpFailedAttempts;

          if (this.otpFailedAttempts >= this.MAX_OTP_ATTEMPTS) {
            this.toastService.showToast(
              `Has superado el límite de intentos de verificación. Espera ${this.BLOCK_TIME_MINUTES} minutos para volver a intentarlo.`,
              'error',
              'Cuenta Bloqueada'
            );
            
            this.isBlocked = true;
            this.failedAttempts = this.MAX_ATTEMPTS;

            // Retornamos al inicio de sesión principal pero bloqueado
            setTimeout(() => {
              this.isVerificationStep = false;
              this.otpFailedAttempts = 0;
              this.verificationCode = '';
            }, 2000);

            // Desbloquear después del tiempo estipulado
            setTimeout(() => {
              this.isBlocked = false;
              this.failedAttempts = 0;
            }, this.BLOCK_TIME_MINUTES * 60 * 1000);

          } else if (remaining === 1) {
            this.toastService.showToast(
              'Código incorrecto. ¡Cuidado! Te queda solo 1 intento.',
              'warning',
              'Aviso de Seguridad'
            );
          } else {
            this.toastService.showToast(
              err.error?.message || 'El código es incorrecto o ha expirado.',
              'error',
              'Código Incorrecto'
            );
          }
        } else if (err.status === 0) {
          this.toastService.showToast('No se pudo conectar al servidor.', 'error');
        } else {
          this.toastService.showToast(err.error?.message || 'Error al verificar el código.', 'error');
        }
        return of(null);
      })
    ).subscribe(res => {
      this.isVerifying = false;
      if (res && res.accessToken) {
        this.otpFailedAttempts = 0;
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