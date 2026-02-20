import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { RoutineService } from './routine.service';
import { NotificationService } from './notification.service';
import { Routine } from '../models/routine.model';

@Injectable({
    providedIn: 'root'
})
export class BoostService {

    constructor(
        private routineService: RoutineService,
        private notificationService: NotificationService
    ) { }

    async scheduleBoostCheck(routine: Routine) {
        if (!routine.boostEnabled) return;

        // We schedule a "virtual" check by scheduling another notification 
        // that will trigger the boost logic if the routine is still not completed.
        // In a real mobile app, we might use Background Tasks, but for simplicity 
        // with Local Notifications, we can schedule the boost notifications ahead of time
        // and CANCEL them if the routine is completed.

        for (let i = 1; i <= 3; i++) {
            const boostId = Math.floor(Math.random() * 1000000) + 2000000;
            const delay = i * routine.boostInterval * 60 * 1000;
            const triggerTime = new Date(this.getDateTimeFromRoutine(routine).getTime() + delay);

            let body = '';
            switch (i) {
                case 1: body = 'Gentle reminder: your routine is waiting.'; break;
                case 2: body = 'Don’t forget your routine!'; break;
                case 3: body = 'Final reminder for today.'; break;
            }

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: `Boost: ${routine.title}`,
                        body: body,
                        id: boostId,
                        schedule: { at: triggerTime, allowWhileIdle: true },
                        sound: 'default',
                        actionTypeId: 'ROUTINE_ACTION',
                        extra: {
                            routineId: routine.id,
                            type: 'boost',
                            attempt: i
                        }
                    }
                ]
            });
        }
    }

    private getDateTimeFromRoutine(routine: Routine): Date {
        const [hours, minutes] = routine.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        // If it's already past, we assume it's for today's scheduled trigger
        return date;
    }

    async cancelBoosts(routineId: string) {
        const pending = await LocalNotifications.getPending();
        const toCancel = pending.notifications
            .filter(n => n.extra?.routineId === routineId && n.extra?.type === 'boost')
            .map(n => ({ id: n.id }));

        if (toCancel.length > 0) {
            await LocalNotifications.cancel({ notifications: toCancel });
        }
    }
}
