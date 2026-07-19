import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HobbiesTestComponent } from './hobbies-test.component';
import { provideAppTestDependencies } from '../../../../testing/app-test-providers';

describe('HobbiesTestComponent', () => {
  let component: HobbiesTestComponent;
  let fixture: ComponentFixture<HobbiesTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HobbiesTestComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(HobbiesTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
