import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogRequest } from '../../core/services/dialog.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit, OnDestroy {
  request: DialogRequest | null = null;
  isVisible = false;
  private subscription!: Subscription;

  constructor(private dialogService: DialogService) {}

  ngOnInit() {
    this.subscription = this.dialogService.dialog$.subscribe((req) => {
      this.request = req;
      this.isVisible = true;
      // Prevent body scrolling when dialog is open
      document.body.style.overflow = 'hidden';
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  close(result: boolean) {
    this.isVisible = false;
    document.body.style.overflow = '';
    
    // Allow animation to finish before resolving and destroying content
    setTimeout(() => {
      if (this.request) {
        this.request.resolve(result);
        this.request = null;
      }
    }, 300); // 300ms matches the CSS exit animation duration
  }

  onConfirm() {
    this.close(true);
  }

  onCancel() {
    this.close(false);
  }
}
