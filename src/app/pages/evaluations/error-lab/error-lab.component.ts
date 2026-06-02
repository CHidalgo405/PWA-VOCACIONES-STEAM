import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-error-lab',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './error-lab.component.html',
  styleUrls: ['./error-lab.component.scss']
})
export class ErrorLabComponent implements OnInit, OnDestroy {
  constructor(private router: Router, private authService: AuthService) {}

  timeSpent = 0;
  attempts = 0;
  timerInterval: any;

  // Nodes for the puzzle
  nodes = [
    { id: 1, active: false, x: 20, y: 20 },
    { id: 2, active: false, x: 80, y: 30 },
    { id: 3, active: false, x: 50, y: 50 },
    { id: 4, active: false, x: 30, y: 80 },
    { id: 5, active: false, x: 70, y: 70 }
  ];

  ngOnInit() {
    this.timerInterval = setInterval(() => {
      this.timeSpent++;
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get formatTime() {
    const minutes = Math.floor(this.timeSpent / 60);
    const seconds = this.timeSpent % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  tryFixNode(node: any) {
    this.attempts++;
    node.active = true;
    
    // Simulate it breaking again shortly after to frustrate the user
    setTimeout(() => {
      node.active = false;
    }, 400);
  }

  finish() {
    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';
    
    // Save locally
    const metrics = {
      timeSpent: this.timeSpent,
      attempts: this.attempts
    };
    localStorage.setItem(`mission3_metrics_${userId}`, JSON.stringify(metrics));
    
    // In a real scenario, this might also call an API to save mission progress
    
    // Navigate back to Dashboard
    this.router.navigate(['/dashboard']);
  }
}
