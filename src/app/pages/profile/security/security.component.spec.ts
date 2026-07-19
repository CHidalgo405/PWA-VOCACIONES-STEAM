import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityComponent } from './security.component';
import { provideAppTestDependencies } from '../../../../testing/app-test-providers';

describe('SecurityComponent', () => {
  let component: SecurityComponent;
  let fixture: ComponentFixture<SecurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
