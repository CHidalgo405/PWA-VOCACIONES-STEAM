import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/auth.service';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule, LucideIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName = 'Carlos Ignacio';
  userProfile?: Usuario;
  avatarUrl = '';

  // User state
  hasTakenTest = false;

  // Mocked stats
  steamScore = 87;
  streakDays = 12;
  testsTaken = 3;
  compatibility = 94;

  // Modal State
  showWelcomeModal = false;

  // Profile Areas
  profileAreas = [
    { name: 'Tecnología', percentage: 92, color: '#F27405' },
    { name: 'Ingeniería', percentage: 78, color: '#4CAF50' },
    { name: 'Ciencia', percentage: 61, color: '#00BCD4' },
    { name: 'Artes', percentage: 45, color: '#F44336' },
    { name: 'Matemáticas', percentage: 38, color: '#424242' } // Use grey/black for math to match mockup
  ];

  recommendedCareers = [
    { title: 'Ing. en Software', category: 'technology' },
    { title: 'Ciencia de Datos', category: 'technology' },
    { title: 'Ciberseguridad', category: 'technology' },
    { title: 'Mecatrónica', category: 'engineering' },
    { title: 'IA', category: 'technology' }
  ];

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.authService.obtenerPerfil().subscribe(usuario => {
      this.userProfile = usuario;
      this.userName = usuario.nombre || this.userName;
      if (usuario.fotoUrl) {
        this.avatarUrl = usuario.fotoUrl;
      } else {
        const initials = this.userName.split(' ').map(n => n[0]).join('').substring(0, 2);
        this.avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=E53935&color=fff`; // Red avatar like mockup
      }

      if (usuario.id) {
        const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${usuario.id}`);
        if (!hasSeenWelcome) {
          this.showWelcomeModal = true;
          document.body.style.overflow = 'hidden';
        }

        // Mock test completion state for now
        const hasTakenTest = localStorage.getItem(`hasTakenTest_${usuario.id}`);
        this.hasTakenTest = this.hasTakenTestMock; // Let's use a local toggle for easy testing
      }
    });
  }

  // Helper toggle for the mockups (so user can switch easily in UI for demo purposes)
  public get hasTakenTestMock(): boolean {
    return localStorage.getItem('mockHasTakenTest') === 'true';
  }

  public toggleMockState() {
    const isTaken = this.hasTakenTestMock;
    localStorage.setItem('mockHasTakenTest', (!isTaken).toString());
    this.hasTakenTest = !isTaken;
  }

  startTest() {
    this.router.navigate(['/vocation-test']);
  }

  closeWelcomeModal() {
    this.showWelcomeModal = false;
    document.body.style.overflow = '';
    if (this.userProfile?.id) {
      localStorage.setItem(`hasSeenWelcome_${this.userProfile.id}`, 'true');
    }
  }
}