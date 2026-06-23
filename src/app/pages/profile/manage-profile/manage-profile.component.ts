import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-manage-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './manage-profile.component.html',
  styleUrls: ['./manage-profile.component.scss']
})
export class ManageProfileComponent implements OnInit {
  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  avatarError: string | null = null;

  profileForm = {
    firstName: '',
    lastName: '',
    avatar: '',
    bio: '',
    birthDate: '',
    phone: '',
    location: '',
    github: '',
    linkedin: ''
  };

  originalAvatar: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario: any) => {
        const names = usuario.nombre ? usuario.nombre.split(' ') : [''];
        this.profileForm.firstName = names[0] || '';
        this.profileForm.lastName = names.slice(1).join(' ') || '';
        
        if (usuario.fotoUrl) {
          this.profileForm.avatar = usuario.fotoUrl;
          this.originalAvatar = usuario.fotoUrl;
        } else {
          const initials = usuario.nombre ? usuario.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'U';
          this.profileForm.avatar = `https://ui-avatars.com/api/?name=${initials}&background=07B1C9&color=fff&size=128`;
          this.originalAvatar = this.profileForm.avatar;
        }

        // Simulando carga de datos adicionales
        this.profileForm.bio = 'Apasionado por la tecnología y la ciencia.';
        this.profileForm.location = 'México';
      },
      error: (err: any) => {
        console.error('Error al cargar perfil:', err);
        if (err.status === 401) {
          this.profileForm.firstName = 'Sesión expirada';
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.handleAvatarError('Solo se permiten imágenes PNG, JPG o JPEG.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.handleAvatarError('La imagen es demasiado grande. El límite es 5MB.');
      return;
    }

    this.avatarError = null;

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
        this.profileForm.avatar = compressedBase64;
      };
    };
    reader.onerror = () => this.handleAvatarError('Error al leer el archivo.');
    reader.readAsDataURL(file);
  }

  handleAvatarError(msg: string) {
    this.avatarError = msg;
    this.showSuccessToast(msg);
  }

  saveProfile() {
    this.isSubmitting = true;
    const fullname = `${this.profileForm.firstName} ${this.profileForm.lastName}`.trim();

    this.userService.updateProfile({ fullname }).subscribe({
      next: () => {
        if (this.profileForm.avatar && this.profileForm.avatar !== this.originalAvatar) {
          this.userService.updateAvatar(this.profileForm.avatar).subscribe({
            next: () => {
              this.originalAvatar = this.profileForm.avatar;
              this.finalizeSaveProfile();
            },
            error: (err: any) => {
              console.error('Error actualizando avatar', err);
              this.finalizeSaveProfile(true);
            }
          });
        } else {
          this.finalizeSaveProfile();
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Error actualizando perfil', err);
        this.showSuccessToast('Hubo un error al actualizar el perfil.');
      }
    });
  }

  private finalizeSaveProfile(withAvatarError: boolean = false) {
    this.isSubmitting = false;
    if (withAvatarError) {
      this.showSuccessToast('Perfil actualizado, pero hubo un error con la foto.');
    } else {
      this.showSuccessToast('¡Perfil actualizado con éxito!');
    }
  }

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
