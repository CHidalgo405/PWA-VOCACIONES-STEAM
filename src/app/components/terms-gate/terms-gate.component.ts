import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';
import { POLICY_VERSION } from '../../core/legal/legal.constants';

/**
 * Compuerta de consentimiento legal. Se muestra como modal bloqueante cuando
 * un usuario autenticado NO ha aceptado la versión vigente del Aviso de
 * Privacidad y los Términos (cubre cuentas creadas antes de esta función y
 * usuarios que entran con Google, quienes no pasan por el checkbox de registro).
 * Al aceptar, registra el consentimiento en la API (versión + fecha).
 */
@Component({
  selector: 'app-terms-gate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconComponent],
  templateUrl: './terms-gate.component.html',
  styleUrls: ['./terms-gate.component.scss'],
})
export class TermsGateComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  visible = false;
  accepted = false;
  isSubmitting = false;
  readonly version = POLICY_VERSION;

  ngOnInit(): void {
    // Reacciona a cambios del usuario: aparece si la versión aceptada no es
    // la vigente. Se recalcula cuando el dashboard refresca el perfil.
    this.authService.currentUser$.subscribe((user) => {
      this.visible =
        !!user?.id &&
        this.authService.isAuthenticated() &&
        user.acceptedTermsVersion !== POLICY_VERSION;
    });
  }

  confirm(): void {
    if (!this.accepted || this.isSubmitting) return;
    this.isSubmitting = true;

    this.userService.acceptTerms(POLICY_VERSION).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.authService.setAcceptedTermsVersion(POLICY_VERSION);
        this.visible = false;
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.showToast(
          'No se pudo registrar tu aceptación. Revisa tu conexión e inténtalo de nuevo.',
          'error',
        );
      },
    });
  }

  decline(): void {
    // Rechazar equivale a no poder usar el servicio: cerramos sesión.
    this.authService.logout();
    this.visible = false;
  }
}
