import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTestComponent } from './manage-test.component';
import { provideAppTestDependencies } from '../../../../testing/app-test-providers';

describe('ManageTestComponent', () => {
  let component: ManageTestComponent;
  let fixture: ComponentFixture<ManageTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageTestComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(ManageTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
