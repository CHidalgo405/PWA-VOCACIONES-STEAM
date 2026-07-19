import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageProfileComponent } from './manage-profile.component';
import { provideAppTestDependencies } from '../../../../testing/app-test-providers';

describe('ManageProfileComponent', () => {
  let component: ManageProfileComponent;
  let fixture: ComponentFixture<ManageProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageProfileComponent],
      providers: provideAppTestDependencies(),
    }).compileComponents();

    fixture = TestBed.createComponent(ManageProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
