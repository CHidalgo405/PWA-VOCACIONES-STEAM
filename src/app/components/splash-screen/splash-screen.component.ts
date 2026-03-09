import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit, OnChanges {
  @Input() loadingText: string = 'Descubriendo tu vocación...';

  // If true, the parent controls visibility manually and no auto-hide logic will run
  @Input() controlExternally: boolean = false;
  @Input() isVisible: boolean = true;

  showSplash = true;
  fadeOut = false;

  ngOnInit() {
    if (!this.controlExternally) {
      // Default behavior: Auto hide after 2.5 seconds
      setTimeout(() => {
        this.triggerFadeOut();
      }, 2500);
    } else {
      this.showSplash = this.isVisible;
      this.fadeOut = !this.isVisible;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.controlExternally && changes['isVisible']) {
      if (changes['isVisible'].currentValue) {
        this.showSplash = true;
        this.fadeOut = false;
      } else {
        this.triggerFadeOut();
      }
    }
  }

  private triggerFadeOut() {
    this.fadeOut = true;
    setTimeout(() => {
      this.showSplash = false;
    }, 500);
  }
}