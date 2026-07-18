import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

describe('AdminService contracts', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads complete simulators from the protected admin route', () => {
    service.getAdminSimulators().subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/admin/career-simulators`,
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('uses the separate admin route for all vocational questions', () => {
    service.getAllQuestions().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/admin/questions`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('loads the system overview without exposing a database connection string', () => {
    service.getSystemOverview().subscribe();

    const request = http.expectOne(
      `${environment.apiUrl}/admin/system/overview`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.url).not.toContain('postgresql://');
    request.flush({});
  });

  it('creates managed users through the protected users collection', () => {
    service.createUser({
      email: 'admin@example.com',
      fullname: 'Admin STEAM',
      password: 'temporary-password',
      role: 'admin',
      isEmailVerified: true,
    }).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.role).toBe('admin');
    request.flush({});
  });
});
