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
    const resendApiUrl = '/resend-api/emails';
    const apiKey = 're_2YYoPemz_cpR9Qs5yjFA6rBoEognERb51'; // ⚠️ Solo para pruebas locales

    try {
      const response = await fetch(resendApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'STEAM Vocations <onboarding@resend.dev>',
          // ⚠️ SOLO PARA PRUEBAS: Resend requiere enviar al correo registrado si no tienes dominio verificado.
          // Cambiaremos 'email' (el del input) por tu correo de sandbox.
          to: ['vocaciones.steam0@gmail.com'],
          subject: 'Tu Código de Verificación',
          html: `<strong>Tu código es: ${codigo}</strong> (Enviado a: ${email})`
        })
      });

      if (response.ok) {
        localStorage.setItem('temp_otp', codigo);
        this.isVerificationStep = true;
      } else {
        console.error('Error en Resend:', await response.text());
        alert('No se pudo enviar el correo de prueba. Revisa la consola para más detalles.');
      }
    } catch (error) {
      console.error('Error enviando correo:', error);
      alert('No se pudo enviar el correo de prueba.');
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
