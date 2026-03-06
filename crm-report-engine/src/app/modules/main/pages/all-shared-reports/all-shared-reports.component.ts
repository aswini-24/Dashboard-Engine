import { Component, OnInit } from '@angular/core';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-all-shared-reports',
  standalone: true,
  imports: [],
  templateUrl: './all-shared-reports.component.html',
  styleUrl: './all-shared-reports.component.scss'
})
export class AllSharedReportsComponent implements OnInit {

  allReports: any = [];
  constructor(
    public crmService: CrmService
  ) { }

  async ngOnInit(){
   this.allReports = await this.crmService.getReports();
     console.log("allReports",this.allReports)
  }
  routeToReport(report) {
    console.log("report", report)
  }
}