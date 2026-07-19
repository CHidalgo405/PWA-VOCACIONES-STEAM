import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AboutAppComponent } from './about-app.component';

describe('AboutAppComponent', () => {
  let component: AboutAppComponent;
  let fixture: ComponentFixture<AboutAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutAppComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes real official and legal destinations', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.ios-toggle-row')
    ) as HTMLAnchorElement[];

    expect(links[0].href).toBe('https://vocaciones-steam-landing.vercel.app/');
    expect(links[1].getAttribute('href')).toBe('/legal/terminos');
    expect(links[2].getAttribute('href')).toBe('/legal/privacidad');
    expect(links.every(link => link.getAttribute('href') !== '#')).toBeTrue();
  });
});
