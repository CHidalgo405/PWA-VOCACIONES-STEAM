import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLabComponent } from './error-lab.component';

describe('ErrorLabComponent', () => {
  let component: ErrorLabComponent;
  let fixture: ComponentFixture<ErrorLabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorLabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
