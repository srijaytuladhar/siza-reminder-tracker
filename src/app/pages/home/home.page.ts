import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RoutineService } from '../../services/routine.service';
import { Routine } from '../../models/routine.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import * as confetti from 'canvas-confetti';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, RouterLink]
})
export class HomePage implements OnInit {
    routines$: Observable<Routine[]>;
    todayRoutines$: Observable<Routine[]>;
    upcomingRoutine$: Observable<Routine | undefined>;
    completionPercentage$: Observable<number>;
    streakCount: number = 0;

    constructor(private routineService: RoutineService) {
        this.routines$ = this.routineService.routines$;
        this.todayRoutines$ = this.routines$.pipe(
            map(routines => routines.filter(r => this.isRoutineForToday(r))
                .sort((a, b) => a.time.localeCompare(b.time)))
        );
        this.upcomingRoutine$ = this.todayRoutines$.pipe(
            map(routines => {
                const now = new Date();
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                return routines.find(r => !r.isCompletedToday && r.time >= currentTime);
            })
        );
        this.completionPercentage$ = this.todayRoutines$.pipe(
            map(routines => {
                if (routines.length === 0) return 0;
                const completed = routines.filter(r => r.isCompletedToday).length;
                return (completed / routines.length) * 100;
            })
        );
    }

    ngOnInit() {
        this.calculateStreak();
    }

    isRoutineForToday(routine: Routine): boolean {
        const today = new Date().getDay(); // 0 is Sunday
        if (routine.repeatType === 'daily') return true;
        if (routine.repeatType === 'weekdays') return today >= 1 && today <= 5;
        if (routine.repeatType === 'custom' && routine.customDays) {
            return routine.customDays.includes(today);
        }
        return false;
    }

    async toggleCompletion(routine: Routine) {
        const today = new Date().toISOString().split('T')[0];
        const isDone = !routine.isCompletedToday;
        const completionDates = [...(routine.completionDates || [])];

        if (isDone) {
            if (!completionDates.includes(today)) {
                completionDates.push(today);
            }
            this.triggerSuccessEffects();
        } else {
            const index = completionDates.indexOf(today);
            if (index > -1) {
                completionDates.splice(index, 1);
            }
        }

        const updated = {
            ...routine,
            isCompletedToday: isDone,
            lastCompletedDate: isDone ? today : routine.lastCompletedDate,
            completionDates: completionDates
        };
        await this.routineService.updateRoutine(updated);
    }

    private async triggerSuccessEffects() {
        // Haptic feedback
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Ignore if not on device
        }

        // Confetti effect
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    async toggleNotification(routine: Routine) {
        const updated = { ...routine, notificationEnabled: !routine.notificationEnabled };
        await this.routineService.updateRoutine(updated);
        // Logic to reschedule/cancel would go here or be handled by an effect in service
    }

    calculateStreak() {
        // Basic streak logic: for demo, let's say it's updated based on last 7 days from storage
        this.streakCount = 5; // Placeholder
    }
}
