import { Routes } from '@angular/router';
import { OnboardingComponent } from './pages/onboarding/onboarding.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ExploreComponent } from './pages/explore/explore.component';

import { ProfileComponent } from './pages/profile/profile.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { ManageUsersComponent } from './pages/admin/manage-users/manage-users.component';
import { ManageTestComponent } from './pages/admin/manage-test/manage-test.component';
import { AiLogsComponent } from './pages/admin/ai-logs/ai-logs.component';
import { SettingsComponent } from './pages/admin/settings/settings.component';
import { Error404Component } from './pages/error-404/error-404.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { OAuthCallbackComponent } from './pages/oauth-callback/oauth-callback.component';
import { EvaluationsComponent } from './pages/evaluations/evaluations.component';
import { TestResultComponent } from './pages/test-result/test-result.component';
import { HistoryComponent } from './pages/history/history.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { missionUnlockGuard } from './core/guards/mission-unlock.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: OnboardingComponent, canActivate: [guestGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'olvide-contrasena', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'evaluations', component: EvaluationsComponent, canActivate: [authGuard] },
  { path: 'evaluations/calibration/:id', loadComponent: () => import('./pages/evaluations/hobbies-test/hobbies-test.component').then(m => m.HobbiesTestComponent), canActivate: [authGuard, missionUnlockGuard] },
  { path: 'test-result', component: TestResultComponent, canActivate: [authGuard] },
  { path: 'test-result/:id', component: TestResultComponent, canActivate: [authGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'explore', component: ExploreComponent, canActivate: [authGuard] },
  { path: 'career-simulator', loadComponent: () => import('./features/career-simulator/career-simulator-catalog/career-simulator-catalog.component').then(m => m.CareerSimulatorCatalogComponent), canActivate: [authGuard] },
  { path: 'career-simulator/:slug', loadComponent: () => import('./features/career-simulator/career-simulator.component').then(m => m.CareerSimulatorComponent), canActivate: [authGuard] },
  { path: 'career-simulator/:slug/result', loadComponent: () => import('./features/career-simulator/career-simulator-result/career-simulator-result.component').then(m => m.CareerSimulatorResultComponent), canActivate: [authGuard] },

  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'mapa-universidades', loadComponent: () => import('./features/universities-map/universities-map.component').then(m => m.UniversitiesMapComponent), canActivate: [authGuard] },
  { path: 'oauth-callback', component: OAuthCallbackComponent },
  { path: 'admin', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/users', component: ManageUsersComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/test', component: ManageTestComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/simulators', loadComponent: () => import('./pages/admin/manage-simulators/manage-simulators.component').then(m => m.ManageSimulatorsComponent), canActivate: [authGuard, adminGuard] },
  { path: 'admin/ai-logs', component: AiLogsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/settings', component: SettingsComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', component: Error404Component }
];