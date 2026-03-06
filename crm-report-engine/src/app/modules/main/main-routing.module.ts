import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportEngineCreationPageComponent } from './pages/report-engine-creation-page/report-engine-creation-page.component';
import { ReportEngineLandingPageComponent } from './pages/report-engine-landing-page/report-engine-landing-page.component';
// import { SharedReportsLandingComponent } from './pages/shared-report/shared-reports-landing/shared-reports-landing.component';
import { SharedReportComponent } from './pages/shared-report/shared-report.component';
import { AllSharedReportsComponent } from './pages/all-shared-reports/all-shared-reports.component';
import { ReportSuccessComponent } from './components/report-success/report-success.component';
import { ReportEngineCreationPageV2Component } from './pages/report-engine-creation-page-v2/report-engine-creation-page-v2.component';
import { TypeSelectionComponent } from './pages/type-selection/type-selection.component';
import { ChartColumnPickerComponent } from './pages/chart-column-picker/chart-column-picker.component';
import { Column } from '@amcharts/amcharts4/charts';
import { ColumnsChartComponent } from './pages/columns-chart/columns-chart.component';
const routes: Routes = [
  {
    path:'',
    component: ReportEngineLandingPageComponent,
  },
  {
    path:'report-creation',
    component: ReportEngineCreationPageComponent,
  },
  {
    path:'report-success',
    component: ReportSuccessComponent,
  },
    {
    path:'report-building',
    component: ReportEngineCreationPageV2Component,
  },
  {
    path:'report-typev2',
    component: TypeSelectionComponent,
  },
  {
    path:'columns-chart',
    component: ColumnsChartComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
