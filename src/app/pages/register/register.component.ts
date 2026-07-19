import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { POLICY_VERSION } from '../../core/legal/legal.constants';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterModule, FormsModule, LucideIconComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  email = '';
  fullname = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  acceptedTerms = false;

  isVerificationStep = false;

  // Loading state during registration request
  isRegistering = false;
  isVerifying = false;
  isResending = false;
  resendCooldown = 0;
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  verificationCode = '';
  otpFailedAttempts = 0;
  readonly MAX_OTP_ATTEMPTS = 3;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  simularLoginGoogle(event: Event) {
    event.preventDefault();
    if (!this.acceptedTerms) {
      this.toastService.showToast('Debes aceptar el Aviso de Privacidad y los Términos para continuar.', 'warning');
      return;
    }
    this.authService.loginWithGoogle(this.rememberMe);
  }

  onSubmit() {
    if (!this.email || !this.fullname || !this.password) {
      this.toastService.showToast('Por favor, completa todos los campos.', 'warning');
      return;
    }

    if (!this.acceptedTerms) {
      this.toastService.showToast('Debes aceptar el Aviso de Privacidad y los Términos para crear tu cuenta.', 'warning');
      return;
    }

    this.isRegistering = true;

    this.authService
      .register(this.email, this.fullname, this.password)
      .pipe(
        catchError(err => {
          this.isRegistering = false;
          if (err.status === 409) {
            this.toastService.showToast('El correo electrónico ya se encuentra registrado.', 'warning');
          } else if (err.status === 429) {
            const message = err.error?.message || 'Espera antes de solicitar otro código.';
            const seconds = Number(message.match(/(\d+)\s*segundo/i)?.[1] || 60);
            // Ya hay una cuenta y un OTP vigentes: permitir que el usuario lo
            // capture aunque haya recargado la página durante el cooldown.
            this.isVerificationStep = true;
            this.startResendCooldown(seconds);
            this.toastService.showToast(message, 'warning');
          } else if (err.status === 400) {
            this.toastService.showToast('Datos inválidos. Verifica tu información.', 'error');
          } else if (err.status === 0) {
            this.toastService.showToast('No se pudo conectar al servidor.', 'error');
          } else {
            this.toastService.showToast(err.error?.message || 'Error al completar el registro.', 'error');
          }
          return of(null);
        })
      )
      .subscribe(res => {
        this.isRegistering = false;
        if (res) {
          this.toastService.showToast('Registro exitoso. Ingresa el código enviado.', 'success');
          // Mostrar la pantalla de verificación OTP
          this.isVerificationStep = true;
          this.startResendCooldown(res.retryAfterSeconds || 60);
        }
      });
  }

  onVerifyOTP() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.toastService.showToast('Por favor, ingresa el código de 6 dígitos.', 'warning');
      return;
    }

    this.isVerifying = true;

    this.authService
      .verifyOtp(
        this.email,
        this.verificationCode,
        'register',
        this.rememberMe
      )
      .pipe(
        catchError(err => {
          this.isVerifying = false;

          if (err.status === 401 || err.status === 400 || err.status === 403) {
            this.otpFailedAttempts++;
            const remaining = this.MAX_OTP_ATTEMPTS - this.otpFailedAttempts;

            if (this.otpFailedAttempts >= this.MAX_OTP_ATTEMPTS) {
              this.toastService.showToast('Has superado el límite de intentos. El código ha sido invalidado.', 'error', 'Código Agotado');
              // La cuenta ya existe: permanecer aquí permite solicitar un OTP
              // nuevo sin caer en el ciclo de "correo ya registrado".
              this.verificationCode = '';
            } else if (remaining === 1) {
              this.toastService.showToast('Código incorrecto. ¡Cuidado! Te queda solo 1 intento.', 'warning', 'Aviso de Seguridad');
            } else {
              this.toastService.showToast(err.error?.message || 'El código es incorrecto o ha expirado.', 'error', 'Código Incorrecto');
            }
          } else if (err.status === 0) {
            this.toastService.showToast('No se pudo conectar al servidor.', 'error');
          } else {
            this.toastService.showToast(err.error?.message || 'Error al verificar el código.', 'error');
          }
          return of(null);
        })
      )
      .subscribe(res => {
        this.isVerifying = false;
        if (res) {
          this.otpFailedAttempts = 0;
          this.toastService.showToast('¡Cuenta verificada y activada con éxito!', 'success');
          // El usuario ya está autenticado: registramos su consentimiento en la
          // API (versión + fecha). Es best-effort; la compuerta lo reintenta.
          this.userService.acceptTerms(POLICY_VERSION).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/dashboard'])
          });
        }
      });
  }

  resendVerificationCode() {
    if (this.isResending || this.resendCooldown > 0 || !this.email) return;

    this.isResending = true;
    this.authService.resendRegistrationOtp(this.email).subscribe({
      next: res => {
        this.isResending = false;
        this.otpFailedAttempts = 0;
        this.verificationCode = '';
        this.startResendCooldown(res?.retryAfterSeconds || 60);
        this.toastService.showToast('Enviamos un nuevo código a tu correo.', 'success');
      },
      error: err => {
        this.isResending = false;
        const message = err.error?.message || 'No se pudo reenviar el código.';
        const seconds = Number(message.match(/(\d+)\s*segundo/i)?.[1] || 0);
        if (seconds > 0) this.startResendCooldown(seconds);
        this.toastService.showToast(message, 'error');
      }
    });
  }

  editRegistrationEmail() {
    this.isVerificationStep = false;
    this.verificationCode = '';
    this.otpFailedAttempts = 0;
    this.clearResendTimer();
    this.resendCooldown = 0;
  }

  ngOnDestroy() {
    this.clearResendTimer();
  }

  private startResendCooldown(seconds: number) {
    this.clearResendTimer();
    this.resendCooldown = Math.max(1, Math.ceil(seconds));
    this.resendTimer = setInterval(() => {
      this.resendCooldown = Math.max(0, this.resendCooldown - 1);
      if (this.resendCooldown === 0) this.clearResendTimer();
    }, 1000);
  }

  private clearResendTimer() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
