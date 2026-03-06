import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { CrmService } from '../../../main/services/crm.service';

@Component({
  selector: 'app-all-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './all-reports.component.html',
  styleUrls: ['./all-reports.component.scss']
})
export class AllReportsComponent implements OnInit, OnDestroy {
  allReports: any[] = [];
  selectedReportKey: string | null = null;
  private sub = new Subscription();

  constructor(
    public crmService: CrmService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

 async ngOnInit() {

  this.redirectToK4KWebApplicationV1();
    // load list
    //  this.allReports = await this.crmService.getReports();
    //  console.log("allReports",this.allReports)

    // // react to route param changes (when the same component instance is reused)
    // this.sub.add(
    //   this.route.paramMap.subscribe((params: ParamMap) => {
    //     this.selectedReportKey = params.get('reportKey');
    //     if (this.selectedReportKey) {
    //       this.onReportKeyChanged(this.selectedReportKey);
    //     } else {
    //       // no key = list/default view
    //       this.onClearSelectedReport();
    //     }
    //   })
    // );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // // called when user clicks a report
  // routeToReport(report: any) {
  //   this.crmService.selectedReport = report;
  //   const key = this.slugify(report.label || report.name || report.id || '');
  //   this.router.navigate([key], {
  //     relativeTo: this.route,
  //     state: { report }   // 👈 attach full object
  //   });
  // }


  // // example: what to do when param changes
  // private onReportKeyChanged(key: string) {
  //   console.log('Route opened for report key:', key);
  //   // e.g. select report from list or fetch details:
  //   this.selectedReportKey = key;
  //   // try to find in already loaded list
  //   const found = this.allReports.find(r =>
  //     this.slugify(r.label || r.name || r.id) === key
  //   );
  //   if (found) {
  //     // do what you need: open a drawer, set selected model, etc.
  //     console.log('Found in list:', found);
  //   } else {
  //     // optionally fetch by key from server
  //     // this.crmService.getReportByKey(key).subscribe(...)
  //   }
  // }

  // private onClearSelectedReport() {
  //   this.selectedReportKey = null;
  //   // reset selection UI if any
  // }

  // // simple slug function: normalize, spaces -> -, lower-case, encode
  // private slugify(input: string): string {
  //   return encodeURIComponent(
  //     (input || '')
  //       .toString()
  //       .trim()
  //       .toLowerCase()
  //       .replace(/\s+/g, '-')        // spaces to dash
  //       .replace(/[^\w\-]+/g, '')   // remove non-word chars
  //       .replace(/\-\-+/g, '-')     // collapse dashes
  //       .replace(/^-+|-+$/g, '')    // trim dashes
  //   );
  // }
  redirectToK4KWebApplicationV1() {
    let origin = window.location.origin;
    window.location.href = `${origin}/main/reports`;
 
  }
}
