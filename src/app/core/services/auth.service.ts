import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use a signal for reactive state in Angular 16+
  private readonly USER_KEY = 'steam_pwa_user';

  constructor() { }

  login(email: string, role: 'admin' | 'student', rememberMe: boolean = false) {
    const userData = { email, role, token: 'dummy-jwt-token' };
    if (rememberMe) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    } else {
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    }
  }

  logout() {
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem(this.USER_KEY) || !!localStorage.getItem(this.USER_KEY);
  }

  isAdmin(): boolean {
    const userStr = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'admin';
    } catch {
      return false;
    }
  }

  getCurrentUser() {
    const userStr = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
}
