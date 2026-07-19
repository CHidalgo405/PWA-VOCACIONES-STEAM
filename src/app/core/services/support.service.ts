import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SupportTicket {
  id: string;
  reference: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  hasAttachment: boolean;
  adminReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; fullname: string };
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/support/tickets`;

  createTicket(data: {
    category: string;
    subject: string;
    message: string;
    attachment?: File | null;
  }): Observable<{ ticket: SupportTicket; emailDelivered: boolean }> {
    const body = new FormData();
    body.append('category', data.category);
    body.append('subject', data.subject);
    body.append('message', data.message);
    if (data.attachment) body.append('attachment', data.attachment);
    return this.http.post<{ ticket: SupportTicket; emailDelivered: boolean }>(
      this.baseUrl,
      body,
    );
  }

  getOwnTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(this.baseUrl);
  }

  downloadAttachment(ticketId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${ticketId}/attachment`, {
      responseType: 'blob',
    });
  }

  getAllTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(
      `${environment.apiUrl}/admin/support/tickets`,
    );
  }

  updateTicket(
    ticketId: string,
    data: { status?: SupportTicket['status']; reply?: string },
  ): Observable<{ ticket: SupportTicket; emailDelivered: boolean }> {
    return this.http.patch<{ ticket: SupportTicket; emailDelivered: boolean }>(
      `${environment.apiUrl}/admin/support/tickets/${ticketId}`,
      data,
    );
  }
}
