import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'routine-detail',
    loadComponent: () => import('./pages/routine-detail/routine-detail.page').then(m => m.RoutineDetailPage)
  },
  {
    path: 'routine-detail/:id',
    loadComponent: () => import('./pages/routine-detail/routine-detail.page').then(m => m.RoutineDetailPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.page').then(m => m.StatsPage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
