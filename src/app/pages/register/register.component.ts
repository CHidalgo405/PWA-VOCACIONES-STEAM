import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Auth, createUserWithEmailAndPassword, sendEmailVerification } from '@angular/fire/auth';

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

  // Loading state during registration request
  isRegistering = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private firebaseAuth = inject(Auth);

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (!this.email || !this.fullname || !this.password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    this.isRegistering = true;

    try {
      // 1. Create User in Firebase
      const userCredential = await createUserWithEmailAndPassword(this.firebaseAuth, this.email, this.password);

      // 2. Send the verification email to the user
      await sendEmailVerification(userCredential.user);

      // 3. Optional: Register user locally on your database or keep a session record
      // This is currently handled by your custom authService if needed, but Firebase maintains the real session.
      // this.authService.login(this.email, 'student', this.rememberMe);

      // 4. Show the "Check your inbox" screen
      this.isVerificationStep = true;
      this.isRegistering = false;

    } catch (error: any) {
      console.error('Error registrando usuario:', error);
      this.isRegistering = false;

      // Friendly error handling
      if (error.code === 'auth/email-already-in-use') {
        alert('Este correo electrónico ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        alert('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        alert('El correo electrónico no es válido.');
      } else {
        alert('Ocurrió un error al crear la cuenta. Por favor, intenta de nuevo.');
      }
    }
  }
}
