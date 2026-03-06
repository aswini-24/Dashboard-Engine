import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CrmService } from '../../services/crm.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ToasterService } from '../../../../../../../shared-lib/src/lib/services/shared/toaster-service/toaster.service';
@Component({
  selector: 'app-report-engine-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './report-engine-landing-page.component.html',
  styleUrls: ['./report-engine-landing-page.component.scss']
})
export class ReportEngineLandingPageComponent implements OnInit{
  rowDataAPI: string = '';
  reportName: string;
  private sub = new Subscription();
  allReports: any[] = [];
  constructor(private crmService: CrmService,
    public router: Router,

    private _toaster: ToasterService
  ) { }
async getData() {
  this.crmService.rowDataAPI = this.rowDataAPI;
  this.crmService.reportName = this.reportName;
  const raw = this.rowDataAPI;
  const rowDataAPI = (typeof raw === 'string') ? raw.trim() : '';

  // required template: /api/{whatever}/{whatever}
  const pattern = /^\/api\/.+$/;

  // 🧩 Validation 1: Empty report name
  if (!this.reportName || !this.reportName.trim()) {
    this._toaster.showError("Report Name cannot be empty", "Error", 3000);
    return;
  }

  // 🧩 Validation 2: Duplicate report name (case & space insensitive)
    const newReportName = this.reportName.replace(/\s+/g, '').toLowerCase();
    console.log("all reports", this.allReports);

    // Compare with the `label` field now
    const existing = this.allReports.some(
      (r) => r.label && r.label.replace(/\s+/g, '').toLowerCase() === newReportName
    );

    if (existing) {
      this._toaster.showError("A report with this name already exists", "Error", 3000);
      return;
    }


  // 🧩 Validation 3: Empty or invalid API URL
  if (!rowDataAPI) {
    this._toaster.showError("Row Data API is Empty", "Error", 3000);
    return;
  }

  if (!pattern.test(rowDataAPI)) {
    this._toaster.showError("Kindly provide proper API Format", "Error", 3000);
    return;
  }

  // ✅ Everything valid → proceed
  try {
    console.log('Row Data API set to:', this.rowDataAPI);
    this.router.navigateByUrl(`main/crmreportengine/report-creation`);
  } catch (err) {
    this._toaster.showError("An error occurred while loading data", "Error", 3000);
    console.error('Error loading data:', err);
  }
}

  async ngOnInit(){
   this.allReports = await this.crmService.getReports();
     console.log("allReports",this.allReports)
  }
}
