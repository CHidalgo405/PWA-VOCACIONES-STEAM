import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/auth.service';
import { TestSubmissionResponse } from '../../core/services/test.service';

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
  dominantTraitsStr = 'Pendiente';

  // Mocked stats
  steamScore = 0;
  streakDays = 12;
  testsTaken = 1;
  compatibility = 94;

  // Modal State
  showWelcomeModal = false;

  // Profile Areas
  profileAreas: { name: string; percentage: number; color: string }[] = [];

  recommendedCareers: { title: string; category: string }[] = [];
  dominantArea: any = null;
  secondaryArea: any = null;

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

        // Load test completion state
        this.loadTestResult(usuario.id);
      }
    });
  }

  loadTestResult(userId: string) {
    const rawResult = localStorage.getItem(`test_result_${userId}`);
    if (rawResult) {
      try {
        const result: TestSubmissionResponse = JSON.parse(rawResult);
        this.hasTakenTest = true;
        
        const scores = result.scores;
        const MAX_SCORE = 20;
        
        const topScore = Math.max(...Object.values(scores));
        this.steamScore = Math.min(Math.round((topScore / MAX_SCORE) * 100), 100);

        const areaColorMap: Record<string, string> = {
          tecnologia: '#F27405',
          ingenieria: '#4CAF50',
          ciencia: '#00BCD4',
          artes: '#F44336',
          matematicas: '#424242'
        };

        const areaNameMap: Record<string, string> = {
          tecnologia: 'Tecnología',
          ingenieria: 'Ingeniería',
          ciencia: 'Ciencia',
          artes: 'Artes',
          matematicas: 'Matemáticas'
        };

        this.profileAreas = Object.entries(scores).map(([key, rawScore]) => {
          return {
            name: areaNameMap[key] || key,
            percentage: Math.min(Math.round((rawScore / MAX_SCORE) * 100), 100),
            color: areaColorMap[key] || '#999999'
          };
        }).sort((a, b) => b.percentage - a.percentage);

        this.dominantTraitsStr = result.dominantTraits || 'Perfil Mixto';

        if (result.recommendations && result.recommendations.length > 0) {
          this.recommendedCareers = result.recommendations.slice(0, 5).map(r => ({
            title: r.suggestedMajor,
            category: 'general'
          }));
        } else {
          this.recommendedCareers = [];
        }

        // Set dominant/secondary areas for the summary widget
        if (this.profileAreas.length > 0) {
            this.dominantArea = this.profileAreas[0];
            this.secondaryArea = this.profileAreas[1] || null;
        }
      } catch (e) {
        console.error('Failed to parse test result', e);
        this.hasTakenTest = false;
      }
    } else {
      this.hasTakenTest = false;
      
      // Default empty state values
      this.profileAreas = [
        { name: 'Tecnología', percentage: 0, color: '#F27405' },
        { name: 'Ingeniería', percentage: 0, color: '#4CAF50' },
        { name: 'Ciencia', percentage: 0, color: '#00BCD4' },
        { name: 'Artes', percentage: 0, color: '#F44336' },
        { name: 'Matemáticas', percentage: 0, color: '#424242' }
      ];
    }
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