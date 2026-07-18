import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { VocationTestService } from '../../core/services/test.service';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: VocationTestService,
          useValue: {
            getTestHistory: () => of([]),
            updateTestName: () => of(undefined),
            deleteTest: () => of(undefined),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    tick(400);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  }));
});
