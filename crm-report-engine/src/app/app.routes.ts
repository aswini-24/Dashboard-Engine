import { Routes } from '@angular/router';
import { RolesService } from '../../../shared-lib/src/lib/services/shared/acl/roles.service';

export const routes: Routes = [
 {
    path: '',
    pathMatch: 'full',
    redirectTo: 'crmreportengine',
  },
  {
    path: 'crmreportengine',
    loadChildren: () =>
      import('./modules/main/main.module').then((m) => m.MainModule),
  },
  {
    path: 'reportV2',
    loadChildren: () =>
      import('./modules/report/report.module').then((m) => m.ReportModule),
    resolve: { roleList: RolesService },
  },
];
