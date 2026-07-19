import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  it('registers Web Push before persisting an enabled channel', async () => {
    const notifications = {
      isPushSupported: true,
      permission: 'default',
      syncPushSubscription: jasmine.createSpy().and.resolveTo(true),
      sendTest: jasmine.createSpy().and.returnValue(of({})),
    };
    const users = {
      updateSettings: jasmine.createSpy().and.returnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            obtenerPerfil: () =>
              of({ settings: { pushEnabled: false, emailEnabled: true } }),
          },
        },
        { provide: UserService, useValue: users },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const fixture = TestBed.createComponent(NotificationsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.notificationSettings.pushEnabled = true;

    await component.saveNotifications();

    expect(notifications.syncPushSubscription).toHaveBeenCalledWith(true);
    expect(users.updateSettings).toHaveBeenCalledWith(
      jasmine.objectContaining({ pushEnabled: true }),
    );
  });
});
