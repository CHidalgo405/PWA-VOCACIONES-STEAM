import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [LucideIconComponent],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; background-color: var(--bg-color);">
      <div style="animation: pulse 1.5s infinite;"><app-lucide-icon name="refresh-cw" [size]="48" color="var(--primary-color)"></app-lucide-icon></div>
      <h2 style="margin-top: 20px; color: var(--text-dark);">Autenticando...</h2>
      <p style="color: var(--text-muted); text-align: center;">Por favor espera, estamos validando tu sesión con Google.</p>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); }
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    // Los tokens viajan en el fragmento (#token=...&refreshToken=...), no en
    // query params: el fragmento nunca se envía al servidor ni queda en sus
    // logs de acceso, a diferencia de un query string.
    this.route.fragment.subscribe(fragment => {
      const params = new URLSearchParams(fragment || '');
      const token = params.get('token');
      const refreshToken = params.get('refreshToken');

      // Limpia el fragmento de la barra de direcciones cuanto antes: los
      // tokens no deben quedar visibles ni en el historial del navegador.
      history.replaceState(null, '', window.location.pathname);

      if (!token) {
        this.router.navigate(['/login']);
        return;
      }

      this.authService.persistOAuthTokens(token, refreshToken || undefined);
      this.authService.obtenerPerfil().subscribe({
        next: (perfil) => {
          // login con token ya se realizó, aqui solo redireccionamos basado en perfil
          if (perfil.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          console.error('Error al obtener el perfil de Google:', err);
          this.router.navigate(['/login']);
        }
      });
    });
  }
}
