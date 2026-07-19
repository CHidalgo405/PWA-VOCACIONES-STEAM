import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideAppTestDependencies } from '../../../testing/app-test-providers';
import { AdminLayoutComponent } from './admin-layout.component';

@Component({
  standalone: true,
  template: '<p id="first-admin-screen">Primera pantalla</p>',
})
class FirstAdminScreenComponent {}

@Component({
  standalone: true,
  template: '<p id="second-admin-screen">Segunda pantalla</p>',
})
class SecondAdminScreenComponent {}

describe('AdminLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        ...provideAppTestDependencies(),
        provideRouter([
          {
            path: 'admin',
            component: AdminLayoutComponent,
            children: [
              { path: 'first', component: FirstAdminScreenComponent },
              { path: 'second', component: SecondAdminScreenComponent },
            ],
          },
        ]),
      ],
    }).compileComponents();
  });

  it('keeps one sidebar mounted while child screens change', async () => {
    const harness = await RouterTestingHarness.create('/admin/first');
    const root = harness.fixture.nativeElement as HTMLElement;
    const sidebarBefore = root.querySelector('app-admin-sidebar');

    expect(sidebarBefore).toBeTruthy();
    expect(root.querySelector('#first-admin-screen')).toBeTruthy();

    await harness.navigateByUrl('/admin/second');

    const sidebarAfter = root.querySelector('app-admin-sidebar');
    expect(sidebarAfter).toBe(sidebarBefore);
    expect(root.querySelectorAll('app-admin-sidebar').length).toBe(1);
    expect(root.querySelector('#second-admin-screen')).toBeTruthy();
  });
});
