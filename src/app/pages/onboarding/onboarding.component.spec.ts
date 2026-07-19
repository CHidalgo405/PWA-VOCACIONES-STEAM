import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingComponent } from './onboarding.component';
import { provideAppTestDependencies } from '../../../testing/app-test-providers';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
