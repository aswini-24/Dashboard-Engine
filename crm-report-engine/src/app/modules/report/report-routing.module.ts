import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllReportsComponent } from './pages/all-reports/all-reports.component';
import { SharedReportComponent } from './pages/shared-report/shared-report.component';

const routes: Routes = [
  {
    path: '',
    component: AllReportsComponent
  },
  // route under the same module root -> /main/reportV2/:reportKey
  {
    path: ':reportKey',
    component: SharedReportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
