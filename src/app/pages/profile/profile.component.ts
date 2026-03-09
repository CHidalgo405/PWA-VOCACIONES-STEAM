import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { BaseChartDirective } from 'ng2-charts'; // Importante para el gráfico
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BaseChartDirective],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  constructor(private router: Router, private authService: AuthService) { }

  user = {
    name: 'Alex Estudiante',
    title: 'Explorador STEAM',
    level: 5,
    avatar: 'https://ui-avatars.com/api/?name=Alex+E&background=07B1C9&color=fff&size=128'
  };

  // --- CONFIGURACIÓN DEL GRÁFICO DE RADAR ---
  public radarChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        pointLabels: {
          font: { size: 12, family: 'Poppins' },
          color: '#2C3E50' // Color del texto (S, T, E, A, M)
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: { legend: { display: false } } // Ocultamos la leyenda para que se vea limpio
  };

  public radarChartLabels: string[] = ['Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas'];

  public radarChartDatasets: ChartConfiguration<'radar'>['data']['datasets'] = [
    {
      data: [85, 90, 70, 60, 80],
      label: 'Aptitudes',
      fill: true,
      backgroundColor: 'rgba(7, 177, 201, 0.2)',
      borderColor: '#07B1C9',
      pointBackgroundColor: '#07B1C9',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#07B1C9'
    }
  ];

  // --- INSIGNIAS (GAMIFICATION) ---
  badges = [
    { icon: '🚀', name: 'Pionero', unlocked: true },
    { icon: '🧠', name: 'Cerebrito', unlocked: true },
    { icon: '🎨', name: 'Creativo', unlocked: false },
    { icon: '🤝', name: 'Social', unlocked: false }
  ];

  // --- SECCIONES PREMIUM DE AJUSTES ---
  accountSettings = [
    { icon: '🔒', title: 'Contraseña y Seguridad', action: 'security' },
    { icon: '🔔', title: 'Notificaciones', action: 'notifications' },
    { icon: '👤', title: 'Administrar Perfil', action: 'manage' }
  ];

  preferencesSettings = [
    { icon: '🌙', title: 'Tema (Modo Oscuro)', action: 'theme', isToggle: true, toggleState: false },
    { icon: '🌐', title: 'Idioma', action: 'language', value: 'Español' }
  ];

  supportSettings = [
    { icon: '❓', title: 'Centro de ayuda', action: 'help' },
    { icon: '🎧', title: 'Contactar soporte', action: 'contact' },
    { icon: 'ℹ️', title: 'Acerca de la app', action: 'about', value: 'v1.0.0' }
  ];

  handleAction(action: string) {
    console.log(`Ejecutando acción: ${action}`);
    // Aquí puedes manejar la navegación o modales dependiendo de la acción
  }

  togglePreference(setting: any) {
    setting.toggleState = !setting.toggleState;
    console.log(`Ajuste ${setting.title} cambiado a ${setting.toggleState}`);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
    console.log('Cerrando sesión...');
  }
}