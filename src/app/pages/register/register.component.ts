import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  email = '';
  fullname = '';
  password = '';
  showPassword = false;
  rememberMe = false;

  isVerificationStep = false;
  codigoIngresado = '';

  private router = inject(Router);
  private authService = inject(AuthService);

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  generarOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async enviarPruebaResend(email: string, codigo: string) {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, codigo })
      });

      if (response.ok) {
        localStorage.setItem('temp_otp', codigo);
        this.isVerificationStep = true;
      } else {
        let errorMessage = 'No se pudo enviar el correo de prueba.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) { }
        console.error('Error en el servidor de OTP:', errorMessage);
        alert('No se pudo enviar el código al correo. Revisa la consola para más detalles.');
      }
    } catch (error) {
      console.error('Error enviando correo:', error);
      alert('Hubo un problema de red al intentar enviar el correo de prueba.');
    }
  }

  onSubmit() {
    if (!this.email || !this.fullname || !this.password) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    const codigo = this.generarOTP();
    this.enviarPruebaResend(this.email, codigo);
  }

  verificarCodigo() {
    const codigoGuardado = localStorage.getItem('temp_otp');

    if (this.codigoIngresado === codigoGuardado) {
      alert('✅ ¡Correo validado con éxito!');
      localStorage.removeItem('temp_otp');

      // Log the user in with AuthService
      this.authService.login(this.email, 'student', this.rememberMe);

      this.router.navigate(['/dashboard']);
    } else {
      alert('❌ Código incorrecto. Intenta de nuevo.');
      this.codigoIngresado = '';
    }
  }
}
