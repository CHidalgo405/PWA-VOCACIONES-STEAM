import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { HobbiesTestComponent } from './hobbies-test.component';

describe('HobbiesTestComponent', () => {
  let component: HobbiesTestComponent;
  let fixture: ComponentFixture<HobbiesTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HobbiesTestComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
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
