import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CareerSimulatorService } from './career-simulator.service';
import { VocationalProfileService } from './vocational-profile.service';

describe('CareerSimulatorService loading state', () => {
  let service: CareerSimulatorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => ({ id: 'user-1' }) },
        },
        {
          provide: VocationalProfileService,
          useValue: { submitSimulatorSession: jasmine.createSpy() },
        },
      ],
    });
    service = TestBed.inject(CareerSimulatorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('leaves the skeleton and exposes a retryable error when loading fails', () => {
    let latest: any;
    service.currentSession$.subscribe((state) => (latest = state));

    service.startSession('software');
    expect(latest.isLoadingSimulator).toBeTrue();
    const request = http.expectOne(
      `${environment.apiUrl}/career-simulators/software`,
    );
    request.error(new ProgressEvent('offline'));

    expect(latest.isLoadingSimulator).toBeFalse();
    expect(latest.loadError).toContain('No pudimos cargar');
    expect(latest.currentCareerData).toBeNull();
  });
});
