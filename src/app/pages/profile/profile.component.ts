import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { BaseChartDirective } from 'ng2-charts'; // Importante para el gráfico
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BaseChartDirective],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  constructor(private router: Router) { }

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
      data: [85, 90, 70, 60, 80], // Aquí irían los datos reales de la BD
      label: 'Aptitudes',
      fill: true,
      backgroundColor: 'rgba(7, 177, 201, 0.2)', // Azul STEAM con transparencia
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
    { icon: '🎨', name: 'Creativo', unlocked: false }, // Bloqueada
    { icon: '🤝', name: 'Social', unlocked: false }
  ];

  logout() {
    this.router.navigate(['/welcome']);
    console.log('Cerrando sesión...');
  }
}