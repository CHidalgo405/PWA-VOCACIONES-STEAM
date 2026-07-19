import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { OfflineSyncService } from './offline-sync.service';
import { ToastService } from './toast.service';

describe('OfflineSyncService', () => {
  let service: OfflineSyncService;
  let http: HttpTestingController;
  let originalOnline: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalOnline = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    localStorage.clear();
    const user = { id: 'user-1' };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser$: new BehaviorSubject(user),
            getCurrentUser: () => user,
          },
        },
        { provide: ToastService, useValue: { showToast: jasmine.createSpy() } },
      ],
    });
    service = TestBed.inject(OfflineSyncService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    if (originalOnline)
      Object.defineProperty(navigator, 'onLine', originalOnline);
  });

  it('retries an offline result with the same idempotency id and removes it on success', async () => {
    let initialError: HttpErrorResponse | undefined;
    service
      .submit('profile', '/profile/compute', {
        theoreticalAnswers: { q1: 'A' },
      })
      .subscribe({ error: (error) => (initialError = error) });

    const first = http.expectOne(`${environment.apiUrl}/profile/compute`);
    const submissionId = first.request.body.clientSubmissionId;
    expect(submissionId).toMatch(/^[0-9a-f-]{36}$/);
    first.error(new ProgressEvent('offline'));

    expect(initialError?.status).toBe(0);
    expect(service.pendingCount()).toBe(1);

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    const flush = service.flushPending();
    const retry = http.expectOne(`${environment.apiUrl}/profile/compute`);
    expect(retry.request.body.clientSubmissionId).toBe(submissionId);
    retry.flush({ steamScores: {}, profileVersion: '1.0.0' });
    await flush;

    expect(service.pendingCount()).toBe(0);
    expect(localStorage.getItem('steam_offline_sync_queue_user-1')).toBeNull();
  });
});
