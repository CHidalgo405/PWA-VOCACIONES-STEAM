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
import { VocationTestComponent } from './pages/vocation-test/vocation-test.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: OnboardingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'vocation-test', component: VocationTestComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'explore', component: ExploreComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/users', component: ManageUsersComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/test', component: ManageTestComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/ai-logs', component: AiLogsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/settings', component: SettingsComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', component: Error404Component }
];