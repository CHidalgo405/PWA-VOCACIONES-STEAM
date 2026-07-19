import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { VocationTestService } from '../../core/services/test.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            obtenerPerfil: jasmine.createSpy().and.returnValue(
              of({
                nombre: 'Student',
                email: 'student@example.com',
                role: 'student'
              })
            ),
            logout: jasmine.createSpy()
          }
        },
        {
          provide: UserService,
          useValue: {
            updateSettings: jasmine.createSpy().and.returnValue(of({})),
            updateAvatar: jasmine.createSpy().and.returnValue(of({}))
          }
        },
        {
          provide: ThemeService,
          useValue: {
            isDark: false,
            isDarkMode$: new BehaviorSubject(false),
            syncFromServer: jasmine.createSpy(),
            setTheme: jasmine.createSpy()
          }
        },
        {
          provide: VocationTestService,
          useValue: {
            getTestHistory: jasmine.createSpy().and.returnValue(of([]))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('routes history and account shortcuts to their real screens', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl');

    component.handleAction('/history');
    component.handleAction('/profile/manage');

    expect(navigateSpy).toHaveBeenCalledWith('/history');
    expect(navigateSpy).toHaveBeenCalledWith('/profile/manage');
  });

  it('shows language as a non-interactive supported value', () => {
    const language = component.preferencesSettings.find(
      setting => setting.title === 'Idioma de la interfaz'
    );

    expect(language).toEqual(
      jasmine.objectContaining({ value: 'Español', isStatic: true })
    );
    expect(language?.action).toBeUndefined();
  });
});
