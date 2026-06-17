import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HobbiesTestComponent } from './hobbies-test.component';

describe('HobbiesTestComponent', () => {
  let component: HobbiesTestComponent;
  let fixture: ComponentFixture<HobbiesTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HobbiesTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HobbiesTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
