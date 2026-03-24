import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  emailForm: FormGroup;
  otpForm: FormGroup;

  step: 'email' | 'otp' = 'email';
  isLoading = false;
  isBlocked = false;
  otpFailedAttempts = 0;
  readonly MAX_OTP_ATTEMPTS = 3;

  constructor() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  async sendEmail() {
    if (this.emailForm.invalid || this.isBlocked) return;

    this.isLoading = true;
    const email = this.emailForm.value.email;

    this.authService.forgotPassword(email).pipe(
      catchError(err => {
        this.isLoading = false;

        if (err.status === 429) {
          const apiMsg = err.error?.message || 'Demasiadas solicitudes. Por favor, espera antes de intentarlo de nuevo.';
          this.toastService.showToast(apiMsg, 'warning', 'Límite Alcanzado');
          this.isBlocked = true;
          setTimeout(() => { this.isBlocked = false; }, 60 * 1000);
        } else if (err.status === 404) {
          this.toastService.showToast('No existe una cuenta con este correo.', 'error', 'Correo no encontrado');
        } else if (err.status === 0) {
          this.toastService.showToast('No se pudo conectar al servidor.', 'error', 'Sin Conexión');
        } else {
          this.toastService.showToast(
            err.error?.message || 'Error al solicitar el restablecimiento.',
            'error'
          );
        }
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res) {
        this.otpFailedAttempts = 0;
        localStorage.setItem('recovery_email', email);
        this.toastService.showToast('Código enviado. Revisa tu correo.', 'success', 'Código Enviado');
        this.step = 'otp';
      }
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;

    const inputOtp = this.otpForm.value.otp;
    const email = localStorage.getItem('recovery_email');

    if (!email) {
      this.toastService.showToast('Sesión de recuperación expirada. Intenta de nuevo.', 'error', 'Sesión Expirada');
      this.step = 'email';
      return;
    }

    this.isLoading = true;

    this.authService.verifyOtp(email, inputOtp, 'recovery').pipe(
      catchError(err => {
        this.isLoading = false;

        if (err.status === 429) {
          // OTP attempts exhausted — code was deleted, user must request a new one
          const apiMsg = err.error?.message || 'Demasiados intentos incorrectos. El código ha sido eliminado.';
          this.toastService.showToast(apiMsg, 'error', 'Código Agotado');
          this.otpForm.reset();
          this.otpFailedAttempts = 0;
          // Return to email step so user can request a fresh OTP
          setTimeout(() => { this.step = 'email'; }, 1500);
        } else if (err.status === 400 || err.status === 401 || err.status === 403) {
          this.otpFailedAttempts++;
          const remaining = this.MAX_OTP_ATTEMPTS - this.otpFailedAttempts;
          
          if (this.otpFailedAttempts >= this.MAX_OTP_ATTEMPTS) {
             this.toastService.showToast(
              'Has superado el límite de intentos. El código ha sido invalidado.',
              'error',
              'Código Agotado'
            );
            this.otpForm.reset();
            this.otpFailedAttempts = 0;
            setTimeout(() => { this.step = 'email'; }, 1500);
          } else if (remaining === 1) {
            this.toastService.showToast(
              'Código incorrecto. ¡Cuidado! Te queda solo 1 intento.',
              'warning',
              'Aviso de Seguridad'
            );
          } else {
            const attemptsMsg = err.error?.message;
            this.toastService.showToast(
              attemptsMsg || 'El código es incorrecto o ha expirado.',
              'warning',
              'Código Incorrecto'
            );
          }
        } else {
          this.toastService.showToast(
            err.error?.message || 'Error al verificar el código.',
            'error'
          );
        }
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res) {
        this.otpFailedAttempts = 0;
        this.toastService.showToast('Código validado con éxito.', 'success', '¡Verificado!');
        localStorage.setItem('recovery_otp_validated', inputOtp);
        this.router.navigate(['/restablecer-contrasena']);
      }
    });
  }
}
