import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

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

  constructor(private router: Router, private authService: AuthService) { }

  login() {
    if (this.email === 'vocaciones@admin.com' || this.email.includes('admin')) {
      this.authService.login(this.email, 'admin', this.rememberMe);
      this.router.navigate(['/admin']);
    } else {
      this.authService.login(this.email, 'student', this.rememberMe);
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

}