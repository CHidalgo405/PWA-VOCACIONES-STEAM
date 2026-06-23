import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { VocationTestService } from '../../core/services/test.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconComponent, HeaderComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  private themeSub!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private themeService: ThemeService,
    private testService: VocationTestService
  ) { }

  user = {
    name: 'Cargando...',
    email: '',
    role: '',
    level: 5,
    avatar: 'https://ui-avatars.com/api/?name=C&background=07B1C9&color=fff&size=128'
  };
  
  testCount: number = 0;

  badges = [
    { id: 'first-step', name: 'Primer Paso', icon: 'star', unlocked: false, description: 'Completaste tu primer test vocacional STEAM.' },
    { id: 'steam-explorer', name: 'Explorador STEAM', icon: 'compass', unlocked: false, description: 'Nivel 5 o superior alcanzado en tu cuenta.' },
    { id: 'science-fan', name: 'Afinidad Científica', icon: 'flask-conical', unlocked: false, description: 'Completa al menos 2 tests vocacionales.' },
    { id: 'tech-innovator', name: 'Innovador Digital', icon: 'cpu', unlocked: false, description: 'Completa al menos 4 tests vocacionales.' }
  ];

  updateBadges() {
    this.badges.forEach(badge => {
      if (badge.id === 'first-step') {
        badge.unlocked = this.testCount > 0;
      }
      if (badge.id === 'steam-explorer') {
        badge.unlocked = this.user.level >= 5;
      }
      if (badge.id === 'science-fan') {
        badge.unlocked = this.testCount >= 2;
      }
      if (badge.id === 'tech-innovator') {
        badge.unlocked = this.testCount >= 4;
      }
    });
  }

  ngOnInit() {
    // Sync theme toggle state from ThemeService
    const themeSetting = this.preferencesSettings.find(s => s.action === 'theme');
    if (themeSetting) {
      themeSetting.toggleState = this.themeService.isDark;
    }

    // Subscribe to theme changes
    this.themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      // Keep toggle in sync if changed externally
      const ts = this.preferencesSettings.find(s => s.action === 'theme');
      if (ts) ts.toggleState = isDark;
    });

    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.user.name = usuario.nombre;
        this.user.email = usuario.email;
        this.user.role = usuario.role;
        this.user.level = usuario.level || 5;

        if (usuario.fotoUrl) {
          this.user.avatar = usuario.fotoUrl;
        } else {
          const initials = usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
          this.user.avatar = `https://ui-avatars.com/api/?name=${initials}&background=07B1C9&color=fff&size=128`;
        }

        // Sync theme toggle with user preference from API
        if (usuario.darkMode !== undefined) {
          const themeSetting = this.preferencesSettings.find(s => s.action === 'theme');
          if (themeSetting) {
            themeSetting.toggleState = usuario.darkMode;
          }
          this.themeService.setTheme(usuario.darkMode);
        }
        this.updateBadges();
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        if (err.status === 401) {
          this.user.name = 'Sesión expirada';
        } else {
          this.user.name = 'Error de conexión';
        }
      }
    });

    this.testService.getTestHistory().subscribe({
      next: (history) => {
        this.testCount = history.length;
        this.updateBadges();
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }



  // --- SECCIONES PREMIUM DE AJUSTES ---
  accountSettings = [
    { icon: 'clock', title: 'Historial de Tests', action: '/history' },
    { icon: 'lock', title: 'Contraseña y Seguridad', action: '/profile/security' },
    { icon: 'bell', title: 'Notificaciones', action: '/profile/notifications' },
    { icon: 'user', title: 'Administrar Perfil', action: '/profile/manage' }
  ];

  preferencesSettings = [
    { icon: 'moon', title: 'Tema (Modo Oscuro)', action: 'theme', isToggle: true, toggleState: false },
    { icon: 'globe', title: 'Idioma', action: 'language', value: 'Español' }
  ];

  supportSettings = [
    { icon: 'help-circle', title: 'Centro de ayuda', action: '/profile/help' },
    { icon: 'headphones', title: 'Contactar soporte', action: '/profile/contact' },
    { icon: 'info', title: 'Acerca de la app', action: '/profile/about', value: 'v1.0.0' }
  ];

  // --- ESTADO ---
  showToast: boolean = false;
  toastMessage: string = '';
  
  // Aún mantenemos modales para insignias y logout porque son pequeñas interacciones
  activeModal: 'logout' | 'badge' | null = null;
  selectedBadge: any = null;

  handleAction(action: string) {
    if (action.startsWith('/')) {
      this.router.navigate([action]);
    } else {
      console.log(`Función no soportada por el momento: ${action}`);
    }
  }

  togglePreference(setting: any) {
    if (setting.action === 'theme') {
      const isDark = !this.themeService.isDark;
      this.themeService.setTheme(isDark);
      setting.toggleState = isDark;
      
      this.userService.updateSettings({ darkMode: isDark }).subscribe({
        next: () => {
          this.showSuccessToast(isDark ? 'Modo oscuro activado' : 'Modo claro activado');
        },
        error: () => {
          this.showSuccessToast('Error al guardar preferencia de tema');
        }
      });
    } else {
      setting.toggleState = !setting.toggleState;
      this.showSuccessToast(`Ajuste guardado: ${setting.title}`);
    }
  }

  logout() {
    this.openModal('logout');
  }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }

  // --- LÓGICA DE LOS MODALES RESTANTES ---
  openModal(type: 'logout') {
    this.activeModal = type;
  }

  openBadgeModal(badge: any) {
    this.selectedBadge = badge;
    this.activeModal = 'badge';
  }

  closeModal() {
    this.activeModal = null;
    this.selectedBadge = null;
  }

  // --- LÓGICA DE SUBIDA DE IMAGEN HERO (DIRECTA) ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.showSuccessToast('Solo se permiten imágenes PNG, JPG o JPEG.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showSuccessToast('La imagen es demasiado grande. El límite inicial es 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        this.quickSaveAvatar(compressedBase64);
      };
    };
    reader.onerror = () => {
      this.showSuccessToast('Error al leer el archivo. Inténtalo de nuevo.');
    };
    reader.readAsDataURL(file);
  }

  quickSaveAvatar(base64: string) {
    this.userService.updateAvatar(base64).subscribe({
      next: () => {
        this.user.avatar = base64;
        this.showSuccessToast('¡Foto de perfil actualizada!');
      },
      error: (err) => {
        console.error('Error actualizando foto', err);
        const detail = typeof err.error?.message === 'string' ? err.error.message : 
                       (err.error?.message?.join(', ') || err.message || 'Error desconocido');
        this.showSuccessToast(`No se pudo actualizar la foto: ${detail}`);
      }
    });
  }

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}