import { Component, OnInit } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { RoutineService } from './services/routine.service';
import { NotificationService } from './services/notification.service';
import { BoostService } from './services/boost.service';
import { AlertController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private routineService: RoutineService,
    private notificationService: NotificationService,
    private boostService: BoostService,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    await this.setupNotificationListeners();
    const granted = await this.notificationService.requestPermissions();
    if (granted) {
      await this.handleAppRestart();
    }
  }

  async handleAppRestart() {
    // Clear old/completed notifications from yesterday
    const pending = await this.notificationService.getPendingNotifications();
    const now = new Date();

    // Reschedule all routines to ensure they are active
    const routines = await lastValueFrom(this.routineService.getRoutines());
    for (const routine of routines) {
      if (routine.notificationEnabled) {
        await this.notificationService.scheduleRoutineNotification(routine);
      }
    }
  }

  async setupNotificationListeners() {
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      const { routineId, type } = notification.notification.extra;

      if (notification.actionId === 'done') {
        await this.handleMarkAsDone(routineId);
      }
    });

    LocalNotifications.addListener('localNotificationReceived', async (notification) => {
      const { routineId, type } = notification.extra;
      if (type === 'primary') {
        const routine = this.routineService.getRoutineById(routineId);
        if (routine) {
          await this.boostService.scheduleBoostCheck(routine);
        }
      }
    });
  }

  async handleMarkAsDone(routineId: string) {
    const routine = this.routineService.getRoutineById(routineId);
    if (routine) {
      const today = new Date().toISOString().split('T')[0];
      const updatedRoutine = {
        ...routine,
        isCompletedToday: true,
        lastCompletedDate: today
      };
      await this.routineService.updateRoutine(updatedRoutine);
      await this.boostService.cancelBoosts(routineId);
    }
  }
}
