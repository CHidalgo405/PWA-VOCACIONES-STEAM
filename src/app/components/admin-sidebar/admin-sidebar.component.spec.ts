import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSidebarComponent } from './admin-sidebar.component';
import { provideAppTestDependencies } from '../../../testing/app-test-providers';

describe('AdminSidebarComponent', () => {
  let component: AdminSidebarComponent;
  let fixture: ComponentFixture<AdminSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSidebarComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the catalog icon registered by the local icon set', () => {
    const catalogLink = fixture.nativeElement.querySelector(
      'a[href="/admin/catalogs"]',
    ) as HTMLAnchorElement;
    const icon = catalogLink?.querySelector('.lucide-icon-wrapper svg');

    expect(catalogLink).toBeTruthy();
    expect(icon).toBeTruthy();
    expect(icon?.classList.contains('lucide-library')).toBeTrue();
  });
});
