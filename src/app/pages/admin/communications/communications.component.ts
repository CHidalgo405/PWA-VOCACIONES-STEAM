import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import {
  SupportService,
  SupportTicket,
} from '../../../core/services/support.service';
import {
  NotificationCampaign,
  NotificationDelivery,
  NotificationService,
} from '../../../core/services/notification.service';

@Component({
  selector: 'app-communications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideIconComponent,
  ],
  templateUrl: './communications.component.html',
  styleUrls: ['./communications.component.scss'],
})
export class CommunicationsComponent implements OnInit {
  private readonly supportService = inject(SupportService);
  private readonly notificationService = inject(NotificationService);

  activeTab: 'support' | 'campaigns' = 'support';
  isLoading = true;
  errorMessage = '';
  tickets: SupportTicket[] = [];
  campaigns: NotificationCampaign[] = [];
  deliveries: NotificationDelivery[] = [];
  selectedTicket: SupportTicket | null = null;
  ticketStatus: SupportTicket['status'] = 'open';
  ticketReply = '';
  isSavingTicket = false;
  isSendingCampaign = false;
  feedbackMessage = '';

  campaignForm = {
    title: '',
    message: '',
    url: '/dashboard',
    category: 'new_careers',
    push: true,
    email: true,
  };

  ngOnInit(): void {
    this.loadData();
  }

  get openTickets(): number {
    return this.tickets.filter((ticket) =>
      ['open', 'in_review'].includes(ticket.status),
    ).length;
  }

  get deliverySuccessRate(): number {
    if (!this.deliveries.length) return 0;
    const delivered = this.deliveries.filter(
      (delivery) => delivery.status === 'delivered',
    ).length;
    return Math.round((delivered / this.deliveries.length) * 100);
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      tickets: this.supportService.getAllTickets(),
      campaigns: this.notificationService.getCampaigns(),
      deliveries: this.notificationService.getDeliveries(),
    }).subscribe({
      next: ({ tickets, campaigns, deliveries }) => {
        this.tickets = tickets;
        this.campaigns = campaigns;
        this.deliveries = deliveries;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el centro de comunicaciones.';
        this.isLoading = false;
      },
    });
  }

  selectTicket(ticket: SupportTicket): void {
    this.selectedTicket = ticket;
    this.ticketStatus = ticket.status;
    this.ticketReply = ticket.adminReply || '';
    this.feedbackMessage = '';
  }

  closeTicket(): void {
    if (!this.isSavingTicket) this.selectedTicket = null;
  }

  saveTicket(): void {
    if (!this.selectedTicket || this.isSavingTicket) return;
    this.isSavingTicket = true;
    this.supportService
      .updateTicket(this.selectedTicket.id, {
        status: this.ticketStatus,
        reply: this.ticketReply || undefined,
      })
      .subscribe({
        next: ({ ticket, emailDelivered }) => {
          const index = this.tickets.findIndex((item) => item.id === ticket.id);
          if (index >= 0) this.tickets[index] = ticket;
          this.selectedTicket = ticket;
          this.ticketStatus = ticket.status;
          this.ticketReply = ticket.adminReply || '';
          this.isSavingTicket = false;
          this.feedbackMessage = emailDelivered
            ? 'Ticket actualizado y respuesta enviada por correo.'
            : 'Ticket actualizado. La respuesta está visible dentro de la app.';
        },
        error: (error) => {
          this.isSavingTicket = false;
          this.feedbackMessage =
            error?.error?.message || 'No se pudo actualizar el ticket.';
        },
      });
  }

  downloadAttachment(ticket: SupportTicket): void {
    this.supportService.downloadAttachment(ticket.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = ticket.attachmentName || 'adjunto';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.feedbackMessage = 'No se pudo descargar el archivo adjunto.';
      },
    });
  }

  sendCampaign(): void {
    if (this.isSendingCampaign) return;
    const channels = [
      ...(this.campaignForm.push ? ['push'] : []),
      ...(this.campaignForm.email ? ['email'] : []),
    ];
    if (!channels.length) {
      this.feedbackMessage = 'Selecciona al menos un canal.';
      return;
    }
    this.isSendingCampaign = true;
    this.feedbackMessage = '';
    this.notificationService
      .sendCampaign({
        title: this.campaignForm.title,
        message: this.campaignForm.message,
        url: this.campaignForm.url || undefined,
        category: this.campaignForm.category,
        channels,
      })
      .subscribe({
        next: (campaign) => {
          this.campaigns.unshift(campaign);
          this.isSendingCampaign = false;
          this.feedbackMessage = `Campaña procesada: ${campaign.delivered} entregas y ${campaign.failed} fallos.`;
          this.campaignForm.title = '';
          this.campaignForm.message = '';
        },
        error: (error) => {
          this.isSendingCampaign = false;
          this.feedbackMessage =
            error?.error?.message || 'No se pudo enviar la campaña.';
        },
      });
  }

  statusLabel(status: string): string {
    return (
      {
        open: 'Abierto',
        in_review: 'En revisión',
        resolved: 'Resuelto',
        closed: 'Cerrado',
      }[status] || status
    );
  }
}
