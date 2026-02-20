import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RoutineService } from '../../services/routine.service';
import { Routine } from '../../models/routine.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';

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
    completionPercentage$: Observable<number>;
    streakCount: number = 0;

    constructor(private routineService: RoutineService) {
        this.routines$ = this.routineService.routines$;
        this.todayRoutines$ = this.routines$.pipe(
            map(routines => routines.filter(r => this.isRoutineForToday(r))
                .sort((a, b) => a.time.localeCompare(b.time)))
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
        const updated = {
            ...routine,
            isCompletedToday: !routine.isCompletedToday,
            lastCompletedDate: !routine.isCompletedToday ? today : routine.lastCompletedDate
        };
        await this.routineService.updateRoutine(updated);
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
