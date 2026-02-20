import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions, PendingResult } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';
import { Routine } from '../models/routine.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private platform: Platform) {
        this.init();
    }

    async init() {
        if (this.platform.is('capacitor')) {
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'ROUTINE_ACTION',
                        actions: [
                            {
                                id: 'done',
                                title: 'Mark as Done',
                                foreground: true
                            }
                        ]
                    }
                ]
            });
        }
    }

    async requestPermissions() {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    }

    async scheduleRoutineNotification(routine: Routine): Promise<number> {
        const id = Math.floor(Math.random() * 1000000);
        const [hours, minutes] = routine.time.split(':').map(Number);

        let schedule: any = {
            at: this.getNextOccurrence(hours, minutes, routine.repeatType, routine.customDays),
            allowWhileIdle: true,
        };

        // Note: Capacitor 5+ uses different repeat logic. For simplicity and reliability, 
        // we'll schedule the next immediate one and reschedule when it's done/missed.
        // However, for basic daily repeats:
        if (routine.repeatType === 'daily') {
            schedule.every = 'day';
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: routine.title,
                    body: `Time for your ${routine.category} routine!`,
                    id: id,
                    schedule: schedule,
                    sound: 'default',
                    attachments: [],
                    actionTypeId: 'ROUTINE_ACTION',
                    extra: {
                        routineId: routine.id,
                        type: 'primary'
                    }
                }
            ]
        });

        return id;
    }

    async cancelNotification(id: number) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
    }

    private getNextOccurrence(hours: number, minutes: number, repeatType: string, customDays?: number[]): Date {
        const now = new Date();
        const scheduled = new Date();
        scheduled.setHours(hours, minutes, 0, 0);

        if (scheduled <= now) {
            scheduled.setDate(scheduled.getDate() + 1);
        }

        // For weekdays or custom days, we'd need more complex logic to find the next valid day
        // For now, we'll return the next time and handle the specific day skip in the scheduler if needed.
        return scheduled;
    }

    async getPendingNotifications(): Promise<PendingResult> {
        return await LocalNotifications.getPending();
    }
}
