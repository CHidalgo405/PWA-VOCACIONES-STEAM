import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestResultComponent } from './test-result.component';
import { provideAppTestDependencies } from '../../../testing/app-test-providers';

describe('TestResultComponent', () => {
  let component: TestResultComponent;
  let fixture: ComponentFixture<TestResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestResultComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(TestResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
