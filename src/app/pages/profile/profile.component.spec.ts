import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { VocationTestService } from '../../core/services/test.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  const darkMode$ = new BehaviorSubject(false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        provideCharts(withDefaultRegisterables()),
        {
          provide: AuthService,
          useValue: {
            obtenerPerfil: () => of({
              id: 'test-user',
              nombre: 'Test User',
              email: 'test@example.com',
              role: 'student',
              level: 5,
              darkMode: false,
              nicheCareers: []
            }),
            getCurrentUser: () => ({
              id: 'test-user',
              nombre: 'Test User',
              email: 'test@example.com',
              role: 'student',
              nicheCareers: []
            }),
            logout: () => undefined
          }
        },
        {
          provide: UserService,
          useValue: {
            getSavedUniversities: () => of([]),
            updateSettings: () => of({}),
            updateAvatar: () => of({}),
            updateProfile: () => of({}),
            updatePassword: () => of({})
          }
        },
        {
          provide: ThemeService,
          useValue: {
            isDark: false,
            isDarkMode$: darkMode$.asObservable(),
            setTheme: () => undefined
          }
        },
        {
          provide: VocationTestService,
          useValue: {
            getTestHistory: () => of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
