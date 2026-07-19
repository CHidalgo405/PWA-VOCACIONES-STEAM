import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  category: string;
  channels: string[];
  status: string;
  recipients: number;
  delivered: number;
  failed: number;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationDelivery {
  id: string;
  channel: string;
  type: string;
  status: string;
  recipient?: string;
  error?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush);

  get isPushSupported(): boolean {
    return this.swPush.isEnabled && 'Notification' in window;
  }

  get permission(): NotificationPermission | 'unsupported' {
    return 'Notification' in window ? Notification.permission : 'unsupported';
  }

  async syncPushSubscription(enabled: boolean): Promise<boolean> {
    if (!enabled) {
      await firstValueFrom(
        this.http.delete(
          `${environment.apiUrl}/notifications/push/subscriptions`,
        ),
      );
      if (this.swPush.isEnabled) {
        const subscription = await firstValueFrom(this.swPush.subscription);
        if (subscription) await subscription.unsubscribe();
      }
      return false;
    }

    if (!this.isPushSupported) {
      throw new Error(
        'Las notificaciones push requieren instalar la PWA y usar un navegador compatible.',
      );
    }
    const { publicKey } = await firstValueFrom(
      this.http.get<{ publicKey: string }>(
        `${environment.apiUrl}/notifications/vapid-public-key`,
      ),
    );
    let subscription = await firstValueFrom(this.swPush.subscription);
    if (!subscription) {
      subscription = await this.swPush.requestSubscription({
        serverPublicKey: publicKey,
      });
    }
    const serialized = subscription.toJSON();
    if (
      !serialized.endpoint ||
      !serialized.keys?.['p256dh'] ||
      !serialized.keys?.['auth']
    ) {
      throw new Error('El navegador devolvió una suscripción push incompleta.');
    }
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/notifications/push/subscriptions`, {
        endpoint: serialized.endpoint,
        keys: serialized.keys,
        userAgent: navigator.userAgent,
      }),
    );
    return true;
  }

  sendTest() {
    return this.http.post(`${environment.apiUrl}/notifications/test`, {});
  }

  sendCampaign(data: {
    title: string;
    message: string;
    url?: string;
    category: string;
    channels: string[];
  }) {
    return this.http.post<NotificationCampaign>(
      `${environment.apiUrl}/admin/notifications/campaigns`,
      data,
    );
  }

  getCampaigns() {
    return this.http.get<NotificationCampaign[]>(
      `${environment.apiUrl}/admin/notifications/campaigns`,
    );
  }

  getDeliveries() {
    return this.http.get<NotificationDelivery[]>(
      `${environment.apiUrl}/admin/notifications/deliveries`,
    );
  }
}
