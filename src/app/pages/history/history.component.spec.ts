import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { HistoryComponent } from './history.component';
import { VocationTestService } from '../../core/services/test.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: VocationTestService,
          useValue: {
            getTestHistory: () => of([]),
            updateTestName: () => of({}),
            deleteTest: () => of({})
          }
        },
        {
          provide: UserService,
          useValue: {
            getSavedUniversities: () => of([])
          }
        },
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({ id: 'test-user', nombre: 'Test User', email: 'test@example.com', role: 'student' })
          }
        },
        {
          provide: ToastService,
          useValue: {
            showToast: () => undefined
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
