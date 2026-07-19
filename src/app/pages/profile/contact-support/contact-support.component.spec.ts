import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupportService } from '../../../core/services/support.service';
import { ContactSupportComponent } from './contact-support.component';

describe('ContactSupportComponent', () => {
  it('creates the ticket through the API and renders the returned reference', () => {
    const ticket: any = {
      id: 'ticket-1',
      reference: 'SUP-20260719-ABC123',
      category: 'bug',
      subject: 'El mapa no carga',
      message: 'El mapa permanece vacío después de conceder ubicación.',
      status: 'open',
      hasAttachment: false,
      createdAt: '2026-07-19T12:00:00Z',
      updatedAt: '2026-07-19T12:00:00Z',
    };
    const support = {
      getOwnTickets: jasmine.createSpy().and.returnValue(of([])),
      createTicket: jasmine
        .createSpy()
        .and.returnValue(of({ ticket, emailDelivered: true })),
    };
    TestBed.configureTestingModule({
      imports: [ContactSupportComponent],
      providers: [{ provide: SupportService, useValue: support }],
    });
    const fixture = TestBed.createComponent(ContactSupportComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.contactForm = {
      category: 'bug',
      subject: 'El mapa no carga',
      message: 'El mapa permanece vacío después de conceder ubicación.',
      attachment: null,
    };

    component.submitTicket();

    expect(support.createTicket).toHaveBeenCalled();
    expect(component.pastTickets[0].reference).toBe('SUP-20260719-ABC123');
    expect(component.toastMessage).toContain('SUP-20260719-ABC123');
  });
});
