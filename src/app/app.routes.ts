import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { missionUnlockGuard } from './core/guards/mission-unlock.guard';

// Todas las rutas cargan su componente de forma perezosa (loadComponent):
// el bundle inicial solo trae el shell de la app + la ruta visitada, en vez
// de todas las páginas (incluido el panel admin) de una sola vez.
export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent), canActivate: [guestGuard] },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'olvide-contrasena', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'evaluations', loadComponent: () => import('./pages/evaluations/evaluations.component').then(m => m.EvaluationsComponent), canActivate: [authGuard] },
  { path: 'evaluations/calibration/:id', loadComponent: () => import('./pages/evaluations/hobbies-test/hobbies-test.component').then(m => m.HobbiesTestComponent), canActivate: [authGuard, missionUnlockGuard] },
  { path: 'test-result', loadComponent: () => import('./pages/test-result/test-result.component').then(m => m.TestResultComponent), canActivate: [authGuard] },
  { path: 'test-result/:id', loadComponent: () => import('./pages/test-result/test-result.component').then(m => m.TestResultComponent), canActivate: [authGuard] },
  { path: 'history', loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent), canActivate: [authGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'explore', loadComponent: () => import('./pages/explore/explore.component').then(m => m.ExploreComponent), canActivate: [authGuard] },
  { path: 'career-simulator', loadComponent: () => import('./features/career-simulator/career-simulator-catalog/career-simulator-catalog.component').then(m => m.CareerSimulatorCatalogComponent), canActivate: [authGuard] },
  { path: 'career-simulator/:slug', loadComponent: () => import('./features/career-simulator/career-simulator.component').then(m => m.CareerSimulatorComponent), canActivate: [authGuard] },
  { path: 'career-simulator/:slug/result', loadComponent: () => import('./features/career-simulator/career-simulator-result/career-simulator-result.component').then(m => m.CareerSimulatorResultComponent), canActivate: [authGuard] },

  { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'profile/manage', loadComponent: () => import('./pages/profile/manage-profile/manage-profile.component').then(m => m.ManageProfileComponent), canActivate: [authGuard] },
  { path: 'profile/security', loadComponent: () => import('./pages/profile/security/security.component').then(m => m.SecurityComponent), canActivate: [authGuard] },
  { path: 'profile/notifications', loadComponent: () => import('./pages/profile/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },
  { path: 'profile/help', loadComponent: () => import('./pages/profile/help-center/help-center.component').then(m => m.HelpCenterComponent), canActivate: [authGuard] },
  { path: 'profile/contact', loadComponent: () => import('./pages/profile/contact-support/contact-support.component').then(m => m.ContactSupportComponent), canActivate: [authGuard] },
  { path: 'profile/about', loadComponent: () => import('./pages/profile/about-app/about-app.component').then(m => m.AboutAppComponent), canActivate: [authGuard] },
  { path: 'mapa-universidades', loadComponent: () => import('./features/universities-map/universities-map.component').then(m => m.UniversitiesMapComponent), canActivate: [authGuard] },
  { path: 'oauth-callback', loadComponent: () => import('./pages/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent) },
  // Documentos legales — públicos (accesibles desde login/registro sin sesión)
  { path: 'legal/privacidad', loadComponent: () => import('./pages/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
  { path: 'legal/terminos', loadComponent: () => import('./pages/legal/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'admin', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/users', loadComponent: () => import('./pages/admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/test', loadComponent: () => import('./pages/admin/manage-test/manage-test.component').then(m => m.ManageTestComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/simulators', loadComponent: () => import('./pages/admin/manage-simulators/manage-simulators.component').then(m => m.ManageSimulatorsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/calibration', loadComponent: () => import('./pages/admin/manage-calibration/manage-calibration.component').then(m => m.ManageCalibrationComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/catalogs', loadComponent: () => import('./pages/admin/manage-catalogs/manage-catalogs.component').then(m => m.ManageCatalogsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/universities', loadComponent: () => import('./pages/admin/manage-universities/manage-universities.component').then(m => m.ManageUniversitiesComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/ai-logs', loadComponent: () => import('./pages/admin/ai-logs/ai-logs.component').then(m => m.AiLogsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/settings', loadComponent: () => import('./pages/admin/settings/settings.component').then(m => m.SettingsComponent), canActivate: [authGuard, adminGuard] },
  { path: '**', loadComponent: () => import('./pages/error-404/error-404.component').then(m => m.Error404Component) }
];
