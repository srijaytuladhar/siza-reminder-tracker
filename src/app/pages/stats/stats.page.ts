import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule, ChartComponent, ApexChart, ApexAxisChartSeries, ApexXAxis, ApexTitleSubtitle, ApexYAxis, ApexDataLabels, ApexPlotOptions, ApexTheme } from 'ng-apexcharts';
import { RoutineService } from '../../services/routine.service';
import { Routine } from '../../models/routine.model';
import { Subscription } from 'rxjs';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    title: ApexTitleSubtitle;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    theme: ApexTheme;
};

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-stats',
    templateUrl: './stats.page.html',
    styleUrls: ['./stats.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, NgApexchartsModule]
})
export class StatsPage implements OnInit, OnDestroy {
    public chartOptions: Partial<ChartOptions>;
    private sub: Subscription | null = null;

    totalCompleted: number = 0;
    currentStreak: number = 0;
    avgSuccess: number = 0;
    missedRoutines: number = 0;
    earnedAchievements: Achievement[] = [];

    constructor(private routineService: RoutineService) {
        this.chartOptions = {
            series: [{ name: "Success Rate", data: [] }],
            chart: {
                height: 300,
                type: "bar",
                toolbar: { show: false },
                background: 'transparent',
                foreColor: '#cbd5e1' // slate-300
            },
            theme: {
                mode: 'dark'
            },
            plotOptions: {
                bar: { borderRadius: 10, dataLabels: { position: "top" } }
            },
            dataLabels: {
                enabled: true,
                formatter: (val) => val + "%",
                offsetY: -20,
                style: { fontSize: "12px", colors: ["#94a3b8"] } // slate-400
            },
            xaxis: {
                categories: [],
                position: "bottom",
                labels: { rotate: -45, style: { colors: '#94a3b8' } }
            },
            yaxis: {
                max: 100,
                labels: { formatter: (val) => val + "%", style: { colors: '#94a3b8' } }
            },
            title: {
                text: "Weekly Goal Completion",
                align: "center",
                style: { color: '#818cf8' } // Indigo-400
            }
        };
    }

    ngOnInit() {
        this.sub = this.routineService.routines$.subscribe(routines => {
            this.calculateStats(routines);
        });
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    calculateStats(routines: Routine[]) {
        if (!routines || routines.length === 0) {
            this.totalCompleted = 0;
            this.currentStreak = 0;
            this.avgSuccess = 0;
            this.earnedAchievements = [];
            this.chartOptions.series = [{ name: "Success Rate", data: [0, 0, 0, 0, 0, 0, 0] }];
            return;
        }
        const last7Days = this.getLast7Days();
        // ... rest of the logic ...
        const successRates: number[] = [];
        const dayNames: string[] = [];

        this.totalCompleted = routines.reduce((acc, r) => acc + (r.completionDates?.length || 0), 0);

        last7Days.forEach(dateStr => {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay();

            const scheduledForDay = routines.filter(r => {
                if (r.repeatType === 'daily') return true;
                if (r.repeatType === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
                return r.customDays?.includes(dayOfWeek);
            });

            if (scheduledForDay.length === 0) {
                successRates.push(0);
            } else {
                const completedOnDay = scheduledForDay.filter(r => r.completionDates?.includes(dateStr)).length;
                successRates.push(Math.round((completedOnDay / scheduledForDay.length) * 100));
            }
            dayNames.push(this.getDayName(date));
        });

        this.chartOptions.series = [{ name: "Success Rate", data: successRates }];
        this.chartOptions.xaxis = { ...this.chartOptions.xaxis, categories: dayNames };

        this.avgSuccess = Math.round(successRates.reduce((a, b) => a + b, 0) / (successRates.filter(v => v > 0).length || 1));
        this.currentStreak = this.calculateCurrentStreak(routines);
        this.calculateAchievements(routines);
    }

    private calculateAchievements(routines: Routine[]) {
        const achievements: Achievement[] = [];

        // 1. First Step
        if (this.totalCompleted >= 1) {
            achievements.push({
                id: 'first_step',
                title: 'First Step',
                description: 'Completed your first routine!',
                icon: 'footsteps-outline',
                color: 'success'
            });
        }

        // 2. Early Bird (3 routines before 9 AM)
        const earlyRoutines = routines.filter(r => {
            const hour = parseInt(r.time.split(':')[0]);
            return hour < 9 && (r.completionDates?.length || 0) >= 3;
        });
        if (earlyRoutines.length > 0) {
            achievements.push({
                id: 'early_bird',
                title: 'Early Bird',
                description: 'Completed 3 morning routines.',
                icon: 'sunny-outline',
                color: 'warning'
            });
        }

        // 3. Consistency (7-day streak)
        if (this.currentStreak >= 7) {
            achievements.push({
                id: 'on_fire',
                title: 'On Fire',
                description: 'Maintained a 7-day streak!',
                icon: 'flame-outline',
                color: 'danger'
            });
        }

        // 4. Centurion (100 total completions)
        if (this.totalCompleted >= 100) {
            achievements.push({
                id: 'centurion',
                title: 'Centurion',
                description: '100 total completions reached.',
                icon: 'trophy-outline',
                color: 'tertiary'
            });
        }

        this.earnedAchievements = achievements;
    }

    private getLast7Days(): string[] {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    }

    private getDayName(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    private calculateCurrentStreak(routines: Routine[]): number {
        if (!routines || routines.length === 0) return 0;
        let streak = 0;
        let d = new Date();

        while (true) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay();
            const scheduled = routines.filter(r => {
                if (r.repeatType === 'daily') return true;
                if (r.repeatType === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
                return r.customDays?.includes(dayOfWeek);
            });

            if (scheduled.length === 0) {
                // If nothing scheduled, don't break the streak just yet, but also don't increment?
                // Actually, if nothing scheduled, we just skip back to previous day.
                d.setDate(d.getDate() - 1);
                continue;
            }

            const completed = scheduled.filter(r => r.completionDates?.includes(dateStr)).length;
            if (completed > 0) { // If *some* goals met, or all? Let's say all.
                // Actually, let's say "at least one" for a lenient streak, or "all" for strict.
                // The user said "Daily completion percentage", so let's say if > 0.
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                // Check if the current day is today. If it's today and 0 completed, we don't break yet?
                // But usually streaks are calculated up to yesterday.
                const today = new Date().toISOString().split('T')[0];
                if (dateStr === today) {
                    d.setDate(d.getDate() - 1);
                    continue; // Today might not be finished yet
                }
                break;
            }

            if (streak > 365) break; // sanity check
        }
        return streak;
    }
}
