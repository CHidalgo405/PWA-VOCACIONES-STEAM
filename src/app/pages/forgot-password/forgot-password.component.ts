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
  resetForm: FormGroup;

  step: 'email' | 'otp' | 'reset' = 'email';
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

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador para confirmar que las contraseñas coincidan
  passwordMatchValidator(control: any): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password !== confirmPassword && control.get('confirmPassword')?.dirty) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
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
        this.step = 'reset';
      }
    });
  }

  saveNewPassword() {
    if (this.resetForm.invalid) return;

    const newPassword = this.resetForm.value.password;
    const email = localStorage.getItem('recovery_email');
    const code = localStorage.getItem('recovery_otp_validated');

    if (!email || !code) {
      this.toastService.showToast('Sesión expirada. Intenta de nuevo.', 'error', 'Sesión Inválida');
      this.step = 'email';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(email, code, newPassword).pipe(
      catchError(err => {
        this.isLoading = false;
        this.toastService.showToast(err.error?.message || 'Error al restablecer la contraseña.', 'error');
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res) {
        this.toastService.showToast('¡Contraseña actualizada con éxito!', 'success', '¡Completado!');
        localStorage.removeItem('recovery_email');
        localStorage.removeItem('recovery_otp_validated');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      }
    });
  }
}
