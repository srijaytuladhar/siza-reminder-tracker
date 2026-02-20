import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Routine } from '../models/routine.model';

@Injectable({
    providedIn: 'root'
})
export class RoutineService {
    private _storage: Storage | null = null;
    private routinesSubject = new BehaviorSubject<Routine[]>([]);
    public routines$ = this.routinesSubject.asObservable();

    constructor(private storage: Storage) {
        this.init();
    }

    async init() {
        const storage = await this.storage.create();
        this._storage = storage;
        this.loadRoutines();
    }

    private async loadRoutines() {
        if (!this._storage) return;
        const routines = await this._storage.get('routines') || [];
        this.routinesSubject.next(routines);
    }

    getRoutines(): Observable<Routine[]> {
        return this.routines$;
    }

    async addRoutine(routine: Routine) {
        const routines = [...this.routinesSubject.value, routine];
        await this.saveRoutines(routines);
    }

    async updateRoutine(updatedRoutine: Routine) {
        const routines = this.routinesSubject.value.map(r =>
            r.id === updatedRoutine.id ? updatedRoutine : r
        );
        await this.saveRoutines(routines);
    }

    async deleteRoutine(id: string) {
        const routines = this.routinesSubject.value.filter(r => r.id !== id);
        await this.saveRoutines(routines);
    }

    private async saveRoutines(routines: Routine[]) {
        if (!this._storage) return;
        await this._storage.set('routines', routines);
        this.routinesSubject.next(routines);
    }

    getRoutineById(id: string): Routine | undefined {
        return this.routinesSubject.value.find(r => r.id === id);
    }
}
