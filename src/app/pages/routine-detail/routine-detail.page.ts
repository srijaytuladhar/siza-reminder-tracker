import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutineService } from '../../services/routine.service';
import { NotificationService } from '../../services/notification.service';
import { Routine, Category } from '../../models/routine.model';

@Component({
    selector: 'app-routine-detail',
    templateUrl: './routine-detail.page.html',
    styleUrls: ['./routine-detail.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class RoutineDetailPage implements OnInit {
    routineForm: FormGroup;
    isEditMode = false;
    routineId: string | null = null;
    categories: Category[] = ['Medicine', 'Exercise', 'Meditation', 'Meals', 'Study', 'Sleep', 'Custom'];

    constructor(
        private fb: FormBuilder,
        private routineService: RoutineService,
        private notificationService: NotificationService,
        private navCtrl: NavController,
        private route: ActivatedRoute
    ) {
        this.routineForm = this.fb.group({
            title: ['', Validators.required],
            category: ['Medicine', Validators.required],
            time: ['08:00', Validators.required],
            repeatType: ['daily', Validators.required],
            customDays: [[]],
            notificationEnabled: [true],
            boostEnabled: [false],
            boostInterval: [10],
            notes: ['']
        });
    }

    ngOnInit() {
        this.routineId = this.route.snapshot.paramMap.get('id');
        if (this.routineId) {
            this.isEditMode = true;
            const routine = this.routineService.getRoutineById(this.routineId);
            if (routine) {
                this.routineForm.patchValue(routine);
            }
        }
    }

    selectCategory(cat: Category) {
        this.routineForm.get('category')?.setValue(cat);
    }

    async save() {
        if (this.routineForm.invalid) return;

        const routineData: Routine = {
            id: this.routineId || Math.random().toString(36).substr(2, 9),
            ...this.routineForm.value,
            isCompletedToday: false,
            boostAttemptsRemaining: 3
        };

        if (this.isEditMode) {
            const oldRoutine = this.routineService.getRoutineById(this.routineId!);
            if (oldRoutine?.nextScheduledNotificationId) {
                await this.notificationService.cancelNotification(oldRoutine.nextScheduledNotificationId);
            }
            await this.routineService.updateRoutine(routineData);
        } else {
            await this.routineService.addRoutine(routineData);
        }

        if (routineData.notificationEnabled) {
            const notificationId = await this.notificationService.scheduleRoutineNotification(routineData);
            routineData.nextScheduledNotificationId = notificationId;
            await this.routineService.updateRoutine(routineData);
        }

        this.navCtrl.back();
    }

    delete() {
        if (this.routineId) {
            this.routineService.deleteRoutine(this.routineId);
            this.navCtrl.back();
        }
    }
}
