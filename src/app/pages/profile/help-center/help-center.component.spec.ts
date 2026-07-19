import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { HelpCenterComponent } from './help-center.component';

describe('HelpCenterComponent', () => {
  it('filters FAQs by search text and clickable category', () => {
    TestBed.configureTestingModule({
      imports: [HelpCenterComponent],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        { provide: UserService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
    });
    const component =
      TestBed.createComponent(HelpCenterComponent).componentInstance;

    component.searchQuery = 'ubicación';
    expect(component.filteredFaqs.length).toBe(1);
    expect(component.filteredFaqs[0].question).toContain('mapa');

    component.searchQuery = '';
    component.selectCategory('account');
    expect(
      component.filteredFaqs.every((faq) => faq.category === 'account'),
    ).toBeTrue();
  });
});
