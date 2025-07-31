import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration: number = 3000) {
    const id = this.generateId();
    const notification: NotificationData = {
      id,
      message,
      type,
      duration
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);

    return id;
  }

  remove(id: string) {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  success(message: string, duration: number = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 4000) {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 3500) {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 3000) {
    return this.show(message, 'info', duration);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
