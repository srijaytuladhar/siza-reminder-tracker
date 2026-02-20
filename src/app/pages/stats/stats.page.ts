import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NgApexchartsModule, ChartComponent, ApexChart, ApexAxisChartSeries, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';
import { RoutineService } from '../../services/routine.service';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    title: ApexTitleSubtitle;
};

@Component({
    selector: 'app-stats',
    templateUrl: './stats.page.html',
    styleUrls: ['./stats.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, NgApexchartsModule]
})
export class StatsPage implements OnInit {
    @ViewChild("chart") chart: ChartComponent | undefined;
    public chartOptions: Partial<ChartOptions>;

    constructor(private routineService: RoutineService) {
        this.chartOptions = {
            series: [
                {
                    name: "Completion %",
                    data: [65, 80, 75, 90, 85, 95, 100] // Mock data for now
                }
            ],
            chart: {
                height: 350,
                type: "bar",
                toolbar: { show: false }
            },
            title: {
                text: "Weekly Performance",
                align: "center",
                style: { color: 'var(--ion-color-primary)' }
            },
            xaxis: {
                categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                labels: { style: { colors: 'var(--ion-color-medium)' } }
            }
        };
    }

    ngOnInit() { }
}
