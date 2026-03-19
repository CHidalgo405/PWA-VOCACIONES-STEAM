import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  resetForm: FormGroup;
  isLoading = false;

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom Validator to match passwords
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword && control.get('confirmPassword')?.dirty) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  saveNewPassword() {
    if (this.resetForm.invalid) return;

    const newPassword = this.resetForm.value.password;
    const email = localStorage.getItem('recovery_email');
    const code = localStorage.getItem('recovery_otp_validated');

    if (!email || !code) {
      this.toastService.showToast('Sesión de recuperación inválida o expirada.', 'error');
      this.router.navigate(['/olvide-contrasena']);
      return;
    }

    this.isLoading = true;
    
    this.authService.resetPassword(email, code, newPassword).pipe(
      catchError(err => {
        this.isLoading = false;
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          this.toastService.showToast('El código expiró o es inválido. Intenta de nuevo.', 'error');
        } else if (err.status === 0) {
          this.toastService.showToast('No se pudo conectar al servidor.', 'error');
        } else {
          this.toastService.showToast(err.error?.message || 'Error al restablecer contraseña.', 'error');
        }
        return of(null);
      })
    ).subscribe(res => {
      this.isLoading = false;
      if (res) {
        this.toastService.showToast('¡Contraseña actualizada exitosamente!', 'success');
        
        // Clean up recovery cache
        localStorage.removeItem('recovery_email');
        localStorage.removeItem('recovery_otp_validated');
        
        // Redirect to login after showing the message
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      }
    });
  }
}
