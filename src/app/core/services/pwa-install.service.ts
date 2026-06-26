import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DialogService } from './dialog.service';

// The BeforeInstallPromptEvent is not standard in TS dom library yet
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private canInstallSubject = new BehaviorSubject<boolean>(false);
  private isIosSubject = new BehaviorSubject<boolean>(false);
  private dialogService = inject(DialogService);

  canInstall$ = this.canInstallSubject.asObservable();
  isIos$ = this.isIosSubject.asObservable();

  constructor() {
    this.init();
  }

  private init() {
    // Only run in browser
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent default mini-infobar on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      // Update UI to notify that the app can be installed
      this.canInstallSubject.next(true);
    });

    // Detect iOS devices for PWA manual installation instructions
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Detect if already installed on iOS
    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    // If it's iOS and not already installed, set isIos to true
    if (isIos() && !isInStandaloneMode()) {
      this.isIosSubject.next(true);
    }
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstallSubject.next(false);
      this.isIosSubject.next(false);
      console.log('PWA installed successfully');
    });
  }

  async installApp(): Promise<boolean> {
    // If iOS, show instructions manually
    if (this.isIosSubject.value) {
      await this.dialogService.alert(
        'Instalar en iOS',
        'Para instalar la app en tu iPhone o iPad, toca el ícono de "Compartir" en Safari (el cuadro con una flecha hacia arriba) y luego selecciona "Añadir a la pantalla de inicio".',
        { confirmText: 'Entendido' }
      );
      return false;
    }

    if (!this.deferredPrompt) {
      return false;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, discard it
    this.deferredPrompt = null;
    this.canInstallSubject.next(false);
    
    return outcome === 'accepted';
  }
}
