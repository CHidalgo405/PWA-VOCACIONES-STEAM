import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BaseChartDirective, LucideIconComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService, private userService: UserService) { }

  user = {
    name: 'Cargando...',
    email: '',
    role: '',
    title: 'Explorador STEAM',
    level: 5,
    avatar: 'https://ui-avatars.com/api/?name=C&background=07B1C9&color=fff&size=128'
  };

  ngOnInit() {
    this.authService.obtenerPerfil().subscribe(usuario => {
      this.user.name = usuario.nombre;
      this.user.email = usuario.email;
      this.user.role = usuario.role;
      this.user.title = usuario.title || 'Explorador STEAM';
      this.user.level = usuario.level || 5;

      if (usuario.fotoUrl) {
        this.user.avatar = usuario.fotoUrl;
      } else {
        const initials = usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
        this.user.avatar = `https://ui-avatars.com/api/?name=${initials}&background=07B1C9&color=fff&size=128`;
      }
    });
  }

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
    { icon: 'rocket', name: 'Pionero', unlocked: true },
    { icon: 'brain', name: 'Cerebrito', unlocked: true },
    { icon: 'palette', name: 'Creativo', unlocked: false },
    { icon: 'users', name: 'Social', unlocked: false }
  ];

  // --- SECCIONES PREMIUM DE AJUSTES ---
  accountSettings = [
    { icon: 'lock', title: 'Contraseña y Seguridad', action: 'security' },
    { icon: 'bell', title: 'Notificaciones', action: 'notifications' },
    { icon: 'user', title: 'Administrar Perfil', action: 'manage' }
  ];

  preferencesSettings = [
    { icon: 'moon', title: 'Tema (Modo Oscuro)', action: 'theme', isToggle: true, toggleState: false },
    { icon: 'globe', title: 'Idioma', action: 'language', value: 'Español' }
  ];

  supportSettings = [
    { icon: 'help-circle', title: 'Centro de ayuda', action: 'help' },
    { icon: 'headphones', title: 'Contactar soporte', action: 'contact' },
    { icon: 'info', title: 'Acerca de la app', action: 'about', value: 'v1.0.0' }
  ];

  // --- ESTADO Y VARIABLES DE LOS MODALES ---
  activeModal: 'editProfile' | 'security' | 'notifications' | 'help' | 'logout' | 'badge' | null = null;
  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  selectedBadge: any = null;
  avatarError: string | null = null;

  // Modelos de Formularios Simulados
  profileForm = {
    firstName: '',
    lastName: '',
    title: '',
    avatar: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  notificationSettings = {
    pushEnabled: true,
    emailMarketing: false,
    weeklySummary: true
  };

  handleAction(action: string) {
    if (action === 'manage') this.openModal('editProfile');
    else if (action === 'security') this.openModal('security');
    else if (action === 'notifications') this.openModal('notifications');
    else if (action === 'help' || action === 'contact') this.openModal('help');
    else console.log(`Función no soportada por el momento: ${action}`);
  }

  togglePreference(setting: any) {
    setting.toggleState = !setting.toggleState;
    this.showSuccessToast(`Ajuste guardado: ${setting.title}`);
  }

  logout() {
    this.openModal('logout');
  }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }

  // --- LÓGICA DE LOS MODALES ---
  openModal(type: 'editProfile' | 'security' | 'notifications' | 'help' | 'logout') {
    this.activeModal = type;
    if (type === 'editProfile') {
      // Cargar datos actuales en el formulario
      const names = this.user.name.split(' ');
      this.profileForm.firstName = names[0] || '';
      this.profileForm.lastName = names.slice(1).join(' ') || '';
      this.profileForm.title = this.user.title;
      this.profileForm.avatar = this.user.avatar;
      this.avatarError = null;
    } else if (type === 'security') {
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
  }

  openBadgeModal(badge: any) {
    this.selectedBadge = badge;
    this.activeModal = 'badge';
  }

  // Método para abrir el correo desde el modal de ayuda
  openSupportMailer() {
    this.showSuccessToast('Abriendo cliente de correo...');
    setTimeout(() => {
      window.location.href = 'mailto:soporte@steamvocations.app';
      this.closeModal();
    }, 1500);
  }

  closeModal() {
    this.activeModal = null;
    this.selectedBadge = null;
    this.avatarError = null;
  }

  // --- LÓGICA DE SUBIDA DE IMAGEN ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.handleAvatarError('Solo se permiten imágenes PNG, JPG o JPEG.');
      return;
    }

    // Validar tamaño inicial (máximo 5MB antes de comprimir)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.handleAvatarError('La imagen es demasiado grande. El límite inicial es 5MB.');
      return;
    }

    this.avatarError = null;

    // Leer el archivo para comprimirlo
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

        // Comprimir a JPEG con calidad 0.7 para asegurar un base64 muy ligero
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        this.profileForm.avatar = compressedBase64;

        if (this.activeModal !== 'editProfile') {
          // Si se seleccionó desde la vista principal, guardar directamente
          this.quickSaveAvatar(compressedBase64);
        }
      };
    };
    reader.onerror = () => {
      this.handleAvatarError('Error al leer el archivo. Inténtalo de nuevo.');
    };
    reader.readAsDataURL(file);
  }

  handleAvatarError(msg: string) {
    this.avatarError = msg;
    this.showSuccessToast(msg);
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

  // --- SIMULACIÓN DE GUARDADO ---
  saveProfile() {
    this.isSubmitting = true;
    
    // Simplificado por UI Mock, pero real se haria peticion combinada con UserService
    this.userService.updateAvatar(this.profileForm.avatar).subscribe({
      next: () => {
        this.user.name = `${this.profileForm.firstName} ${this.profileForm.lastName}`;
        this.user.title = this.profileForm.title;
        this.user.avatar = this.profileForm.avatar;
        
        this.isSubmitting = false;
        this.closeModal();
        this.showSuccessToast('¡Perfil actualizado con éxito!');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error actualizando perfil', err);
        const detail = typeof err.error?.message === 'string' ? err.error.message : 
                       (err.error?.message?.join(', ') || err.message || 'Error desconocido');
        this.showSuccessToast(`Hubo un error al actualizar: ${detail}`);
      }
    });
  }

  savePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.closeModal();
      this.showSuccessToast('Contraseña cambiada con éxito.');
    }, 1500);
  }

  saveNotifications() {
    this.isSubmitting = true;
    
    this.userService.updateSettings(this.notificationSettings).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.showSuccessToast('Preferencias de notificación guardadas.');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error guardando ajustes', err);
        this.showSuccessToast('Hubo un error al guardar');
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