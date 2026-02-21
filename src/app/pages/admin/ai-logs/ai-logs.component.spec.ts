import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiLogsComponent } from './ai-logs.component';

describe('AiLogsComponent', () => {
  let component: AiLogsComponent;
  let fixture: ComponentFixture<AiLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
