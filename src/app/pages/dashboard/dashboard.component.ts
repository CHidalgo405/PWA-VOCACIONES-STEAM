import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName = 'Estudiante'; // Esto vendría de tu base de datos
  userProfile?: Usuario;
  avatarUrl = '';

  constructor(private router: Router, private authService: AuthService) { }

  showWelcomeModal = false;

  ngOnInit() {
    this.authService.obtenerPerfil().subscribe(usuario => {
      this.userProfile = usuario;
      this.userName = usuario.nombre;
      if (usuario.fotoUrl) {
        this.avatarUrl = usuario.fotoUrl;
      } else {
        const initials = this.userName.split(' ').map(n => n[0]).join('').substring(0, 2);
        this.avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=07B1C9&color=fff`;
      }

      // Check first-time login
      if (usuario.id) {
        const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${usuario.id}`);
        if (!hasSeenWelcome) {
          this.showWelcomeModal = true;
          document.body.style.overflow = 'hidden';
        }

        // Mock test completion state for now
        const hasTakenTest = localStorage.getItem(`hasTakenTest_${usuario.id}`);
        this.hasTakenTest = hasTakenTest === 'true';
      }
    });
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

  // Estado del usuario: ¿Ya hizo el test?
  hasTakenTest = false;

  // Categorías rápidas (STEAM) con información detallada para el modal
  categories = [
    {
      id: 'science',
      name: 'Ciencia',
      icon: '🧬',
      color: '#07B1C9',
      shortDesc: 'Descubre el universo',
      description: 'La ciencia te permite explorar, investigar y comprender cómo funciona el mundo que nos rodea, desde lo microscópico hasta el cosmos.',
      careers: [
        { name: 'Biología', icon: '🔬' },
        { name: 'Química', icon: '🧪' },
        { name: 'Medicina', icon: '🩺' },
        { name: 'Física', icon: '🔭' }
      ],
      subjects: ['Biología', 'Química', 'Física', 'Anatomía']
    },
    {
      id: 'technology',
      name: 'Tecnología',
      icon: '💻',
      color: '#4DB046',
      shortDesc: 'Crea el futuro',
      description: 'La tecnología es el motor de la innovación. Sumérgete en la programación, el desarrollo de software y las nuevas plataformas digitales para crear soluciones del mañana.',
      careers: [
        { name: 'Ingeniería en Sistemas', icon: '⌨️' },
        { name: 'Desarrollo Web', icon: '🌐' },
        { name: 'Ciberseguridad', icon: '🛡️' },
        { name: 'Ciencia de Datos', icon: '📊' }
      ],
      subjects: ['Programación', 'Matemáticas Discretas', 'Redes', 'Bases de Datos']
    },
    {
      id: 'engineering',
      name: 'Ingeniería',
      icon: '⚙️',
      color: '#F88718',
      shortDesc: 'Construye soluciones',
      description: 'Aplica el ingenio científico y matemático para diseñar y construir estructuras, máquinas y sistemas eficientes que resuelven problemas reales de la sociedad.',
      careers: [
        { name: 'Ingeniería Civil', icon: '🏗️' },
        { name: 'Ingeniería Mecánica', icon: '⚙️' },
        { name: 'Ingeniería Robótica', icon: '🤖' },
        { name: 'Ingeniería Electrónica', icon: '🔌' }
      ],
      subjects: ['Cálculo', 'Física', 'Mecánica', 'Dibujo Técnico']
    },
    {
      id: 'arts',
      name: 'Artes',
      icon: '🎨',
      color: '#E8372D',
      shortDesc: 'Expresa tu visión',
      description: 'El arte aporta creatividad, diseño e innovación humana a los campos técnicos, combinando la estética con la funcionalidad para crear experiencias memorables.',
      careers: [
        { name: 'Diseño Gráfico', icon: '🖌️' },
        { name: 'Animación Digital', icon: '🎬' },
        { name: 'Diseño Industrial', icon: '🛋️' },
        { name: 'Arquitectura', icon: '🏛️' }
      ],
      subjects: ['Historia del Arte', 'Diseño', 'Dibujo', 'Composición']
    },
    {
      id: 'math',
      name: 'Matemáticas',
      icon: '📐',
      color: '#8E44AD',
      shortDesc: 'El lenguaje del universo',
      description: 'Las matemáticas son la base lógica de todo. Descifra patrones fascinantes, optimiza procesos complejos y modela la realidad mediante números y ecuaciones.',
      careers: [
        { name: 'Matemáticas', icon: '➗' },
        { name: 'Estadística', icon: '📈' },
        { name: 'Actuaría', icon: '💼' },
        { name: 'Finanzas', icon: '💰' }
      ],
      subjects: ['Álgebra', 'Estadística', 'Probabilidad', 'Cálculo']
    },
  ];

  // Estado del modal
  selectedArea: any = null;

  openAreaModal(area: any) {
    this.selectedArea = area;
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
  }

  closeAreaModal() {
    this.selectedArea = null;
    document.body.style.overflow = ''; // Restaurar scroll
  }
}