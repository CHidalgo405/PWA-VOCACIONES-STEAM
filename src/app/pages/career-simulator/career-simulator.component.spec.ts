import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CareerSimulatorComponent } from './career-simulator.component';

describe('CareerSimulatorComponent', () => {
  let component: CareerSimulatorComponent;
  let fixture: ComponentFixture<CareerSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CareerSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CareerSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
