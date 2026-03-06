import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CrmService } from '../../../main/services/crm.service';
import { SubSink } from 'subsink';
import { ColDef, SideBarDef } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SideBarModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';
import _ from 'underscore';
import { SharedCustomComponent } from '../../../main/components/shared-custom/shared-custom.component';
import { RolesService } from '../../../../../../../shared-lib/src/lib/services/shared/acl/roles.service';
import { HostListener } from '@angular/core';
import { GridReadyEvent, FirstDataRenderedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import moment from 'moment';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService } from '../../services/report.service';
// add HostListener import at top if not already present
// imports at top

ModuleRegistry.registerModules([SetFilterModule]);

ModuleRegistry.registerModules([SideBarModule]);

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-shared-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridModule,
    MatIconModule,
    MatCardModule,
    ScrollingModule,
    DragDropModule,
    SharedCustomComponent,
    NgxSpinnerModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './shared-report.component.html',
  styleUrl: './shared-report.component.scss'
})
export class SharedReportComponent implements OnInit {

  report: any;
  data: any = {};
  reportConfig: any = null;
  routeParam: string | null = null;
  private subs = new SubSink();
  rowData: any[] = [];
  originalrowData: any = [];
  application_id: any;
  query: string;
  statusItems: any[] = [];
  filterModel: any = {};
  summaryKey: any;
  isLoading: boolean = true;
  colDefs: ColDef[] = [];
  searchText: string = '';
  showSlicer: boolean = false;
  isCollapsed = false;
  slicerData: { [key: string]: any[] } = {};
  searchStates: { [key: string]: boolean } = {};
  searchInputs: { [key: string]: string } = {};
  filterConfig: { [key: string]: boolean } = {};
  slicerNames: any = [];
  selectedFilters: { [key: string]: Set<string> } = {};
  slicerTitles: { [key: string]: string } = {}; 
gridApi: GridApi | undefined;
columnApi: any;
dateFilterColumns: Array<{ name: string, label?: string }> = [];
selectedDateColumn: string | null = null;
selectedDateColumnLabel: string | null = null;
showDateDropdown: boolean = false;
openRangePicker: boolean = false; // if you use inline picker
dateRangePickerRanges: any = {};   // we'll fill below
dateFilter: any = null;
startDate: string | null = null;
endDate: string | null = null;
maxDate: any = null;
// Add these after your existing date filter properties (around line 60)
customStartDate: string = '';
customEndDate: string = '';
selectedPreset: string | null = null;
private userProfileCache: Map<string, any> = new Map();
// Add these properties after your existing properties (around line 60)
visibleCardsCount: number = 7; // default
private readonly CARD_WIDTH = 200; // approximate width including gap
private readonly TOOLBAR_PADDING = 100; // space for other toolbar elements
slicerScrollPosition: number = 0;
showLeftArrow: boolean = false;
showRightArrow: boolean = false;
private readonly SLICER_WIDTH = 184; // 11.5rem = 184px
private readonly SLICER_GAP = 10;
winRate: number = 0;
totalOpportunityValue: number = 0;
wonOpportunityValue: number = 0;
userProfileMap: { [oid: string]: { displayName: string; profile_image_url: string } } = {};

// Add preset configuration
dateRangePresets = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'last7Days', label: 'Last 7 Days' },
  { key: 'last30Days', label: 'Last 30 Days' },
  { key: 'last90Days', label: 'Last 90 Days' }
];
  private sub = new Subscription();

private _canvasCtx: CanvasRenderingContext2D | null = null;

private readonly AUTO_SIZE_CONFIG = {
  sampleRatio: 0.08,   // sample ~8% of rows (adjust if needed)
  sampleMin: 50,       // at least 50 samples
  sampleMax: 500,      // at most 500 samples
  cellFont: '13px "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  headerFont: '600 13px "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  horizontalPadding: 24,    // px padding to add to estimate
  headerExtra: 28,          // px extra for header icons & spacing
  percentile: 0.90,         // 90th percentile representative length
  avgCharMultiplier: 1.04,  // slight inflation for punctuation/uppercase
  GLOBAL_MIN: 70            // minimum width enforced only
};


// --- grid options (allow horizontal scroll, virtualization toggled during autosize) ---
gridOptions: GridOptions = {
  suppressHorizontalScroll: false,
  suppressColumnVirtualisation: true, // we'll toggle while autosizing
  headerHeight: 50,
  domLayout: 'normal',
  ensureDomOrder: true,
};

// --- default column definition: remove maxWidth so columns can flow ---
defaultColDef: ColDef = {
  sortable: true,
  resizable: true,
  minWidth: 80,
  headerClass: 'custom-header',
  wrapHeaderText: true,
  autoHeaderHeight: true,
  cellStyle: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    paddingLeft: '10px',
    fontSize: '12px',
    fontFamily: 'DM Sans',
    color: '#45546E'
  },
  valueFormatter: (params: any) => {
    // Handle null, undefined, empty string
    if (params.value === null || params.value === undefined || params.value === '') {
      return '-';
    }
    return params.value;
  }
};
  allReports: any[] = [];
  reportKey: any;


  constructor(private router: Router, private _route: ActivatedRoute, public crmService: CrmService,public rolesservice: RolesService, private spinner: NgxSpinnerService, private reportService: ReportService) { 
    ModuleRegistry.registerModules([
      AllCommunityModule,
      SetFilterModule,
      SideBarModule
    ]);}

  async ngOnInit() {
    this.isLoading = true;
    this.spinner.show();  
    // call this after loading `this.data`
    if(this.crmService.selectedReport && Object.keys(this.crmService.selectedReport).length > 0){
      this.data = this.crmService.selectedReport;
       this._route.params.subscribe(res => {
        this.reportKey = res['reportKey'];
      })
    }
    else {
    this._route.params.subscribe(res => {
        this.reportKey = res['reportKey'];
      })
    this.allReports = await this.crmService.getReports();

      // find the report with this.reportKey
      this.data = this.allReports.find(r => r.report_name === this.reportKey);
    }
    if (this.data?.report_config?.colDefs) {
      const transformed = this.transformColDefsReplaceCustomComponent(this.data.report_config.colDefs);
      this.data.report_config.colDefs = transformed;
      // update the component view model used by AG Grid
      this.colDefs = transformed;
    }
    this.initDateFilterColumns();
    this.initDateRangePresets();
    this.summaryKey = this.data?.report_config?.summaryKey || null;
    // this.colDefs = this.data?.report_config?.colDefs || [];
    const slicerConfig = this.data?.report_config?.slicer_config || [];
    this.slicerNames = Array.from(
      new Set(
        slicerConfig
          .map((s: any) => s?.field)     // take the field
          .filter((f: any) => !!f)       // drop falsy values
      )
    ); // unique fields in original order
    for (const s of slicerConfig) {
      const field = s?.field;
      if (field && !(field in this.selectedFilters)) {
        this.selectedFilters[field] = new Set<string>();
      }
    }

    this.slicerTitles = slicerConfig.reduce((acc: { [k: string]: string }, s: any) => {
      if (s?.field) {
        acc[s.field] = s.title;
      }
      return acc;
    }, {});
    this.subs.add(
      this.crmService.loadDataFromAPI(this.data.report_config.rowDataAPI).subscribe(
        async (result: any) => {  // ← Add 'async' here
          if (result['messType'] === 'S') {
            this.rowData = result['messData'] || [];
            this.originalrowData = [...this.rowData];
            
            this.formatDatesInRowData();
            
            // ⭐ ADD THIS - Preload user profiles BEFORE rendering
            await this.preloadUserProfilesForGrid();
            
            this.computeStatusCardConfigsAsFlatArray();
            this.calculateWinRate();
            console.log('statusItems computed', this.statusItems);
          }
        }
      )
    );

    this.application_id = this.data.application_id;

  }
private initDateRangePresets() {
  this.dateRangePickerRanges = {
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [
      moment().subtract(1, 'month').startOf('month'),
      moment().subtract(1, 'month').endOf('month'),
    ],
    'Next Month': [
      moment().add(1, 'month').startOf('month'),
      moment().add(1, 'month').endOf('month'),
    ],
    'Upcoming 3 Months': [
      moment().startOf('month'),
      moment().add(2, 'month').endOf('month'),
    ],
    'This Year': [moment().startOf('year'), moment().endOf('year')],
    'Previous Year': [
      moment().subtract(1, 'year').startOf('year'),
      moment().subtract(1, 'year').endOf('year'),
    ],
    'Current FY': [
      moment().subtract(moment().month() < 3 ? 1 : 0, 'year').month(3).date(1).startOf('day'),
      moment().add(moment().month() >= 3 ? 1 : 0, 'year').month(2).date(31).endOf('day'),
    ],
    'Previous FY': [
      moment().subtract(moment().month() < 3 ? 2 : 1, 'years').month(3).date(1).startOf('day'),
      moment().subtract(moment().month() < 3 ? 1 : 0, 'years').month(2).date(31).endOf('day'),
    ]
  };

  // DON'T set default dateFilter or dates - let user choose
  this.dateFilter = null;
  this.startDate = null;
  this.endDate = null;
  this.customStartDate = '';
  this.customEndDate = '';
  this.selectedPreset = null;
}
// --- call this in ngOnInit after this.data is populated
private initDateFilterColumns() {
  // tolerant handling: the config might be an array of strings or array of objects
  const cfg = this.data?.report_config?.dateFilterColumns || [];
  if (!Array.isArray(cfg)) {
    this.dateFilterColumns = [];
    return;
  }

  // Helper function to get the display name from colDefs
  const getColumnLabel = (fieldName: string): string => {
    if (!this.colDefs || !Array.isArray(this.colDefs)) return fieldName;
    
    const colDef = this.colDefs.find(col => col.field === fieldName);
    if (colDef) {
      return colDef.headerName || colDef.field || fieldName;
    }
    
    return fieldName;
  };

  // normalize to objects { name, label? }
  this.dateFilterColumns = cfg.map(c => {
    if (typeof c === 'string') {
      return { 
        name: c, 
        label: getColumnLabel(c)
      };
    }
    if (c && typeof c === 'object') {
      // maybe structure { field: 'createdAt', title: 'Created On' } or { name, label }
      const fieldName = c.field || c.name || c;
      return { 
        name: fieldName, 
        label: c.title || c.label || getColumnLabel(fieldName)
      };
    }
    return { 
      name: String(c), 
      label: getColumnLabel(String(c))
    };
  });
}

// UPDATED: computeStatusCardConfigsAsFlatArray - preserve selected state
private computeStatusCardConfigsAsFlatArray(): void {
  let configs = this.data?.report_config?.statusCardConfigs || [];
  configs = configs[0];
  const flat: any[] = [];

  let key = configs?.key;
  let card_config = configs?.card_config || [];
  
  // Store current selected states before rebuilding
  const selectedStates = new Map<any, boolean>();
  if (this.statusItems && this.statusItems.length > 0) {
    this.statusItems.forEach(card => {
      if (card.selected) {
        selectedStates.set(card.value, true);
      }
    });
  }
  
  // count values per config.key first
  for (const config of card_config) {
    const countMap: Record<string, number> = {};
    for (const item of this.rowData || []) {
      const raw = item?.[key];
      const k = raw === undefined || raw === null ? '' : String(raw).trim();
      countMap[k] = (countMap[k] || 0) + 1;
    }

    const cardValKey = config?.value === undefined || config?.value === null
      ? ''
      : String(config.value).trim();

    // Restore the selected state if it was previously selected
    const wasSelected = selectedStates.has(config.value);

    flat.push({
      ...config,
      selected: wasSelected,  // Preserve selected state instead of always false
      count: countMap[cardValKey] || 0,
      key: key
    });
  }

  this.statusItems = flat;
  this.isLoading = false;
  try { this.spinner.hide(); } catch(e) {}
}

// NEW: Clear status card filters
clearStatusCardFilters() {
  // Unselect all status cards
  this.statusItems.forEach(card => {
    card.selected = false;
  });
  
  // Clear the filter model in the grid
  if (this.gridApi) {
    this.gridApi.setFilterModel(null);
  }
}

  sideBar: SideBarDef = {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: true,
          suppressValues: true,
          suppressPivots: true,
          suppressPivotMode: true,
          suppressSideButtons: true,
          suppressColumnSelectAll: true,
          suppressColumnExpandAll: true,
        },
      },
      {
        id: 'filters',
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filter',
        toolPanel: 'agFiltersToolPanel',
      }
    ]
  };
  fetchSlicersUniqueData() {
    for (let sname of this.slicerNames) {
      const uniqueValues = this.getUniqueValuesForSlicer(sname);
      this.slicerData[sname] = this.buildSlicerItemsFromValues(sname, uniqueValues);

      this.searchStates[sname] = false;      // hide search input initially
      this.searchInputs[sname] = '';         // init input string
      this.filterConfig[sname] = false;
      if (!this.selectedFilters[sname]) this.selectedFilters[sname] = new Set<string>();
    }
  }

  slicerFilter(item: any, sname: string) {
    item.isSelected = !item.isSelected;
    if (item.isSelected) {
      this.selectedFilters[sname].add(item.name);
    } else {
      this.selectedFilters[sname].delete(item.name);
    }

    this.filterConfig[sname] = this.selectedFilters[sname].size > 0;
    this.applyFilters();
  }

  // clearSlicerFunc(sname: string) {
  //   this.selectedFilters[sname].clear();
  //   this.filterConfig[sname] = false;
  //   this.slicerData[sname].forEach(item => (item.isSelected = false));
  //   this.applyFilters();
  // }

  // applyFilters(): void {
  //   this.rowData = this.originalrowData.filter(item =>
  //     this.slicerNames.every(sname =>
  //       this.selectedFilters[sname].size === 0 || this.selectedFilters[sname].has(item[sname])
  //     )
  //   );
  //   this.updateSlicerOptionsBasedOnCurrentData();
  //   this.computeStatusCardConfigsAsFlatArray();
  // }

  updateSlicerOptionsBasedOnCurrentData(): void {
    for (let sname of this.slicerNames) {
      const items = [...new Set(this.rowData.map(item => item[sname]))];

      this.slicerData[sname] = items.map(name => ({
        name,
        isSelected: this.selectedFilters[sname].has(name),
        isClicked: true
      }));
    }
  }

selectDateColumn(col: { name: string, label?: string }) {
  this.selectedDateColumn = col.name;
  this.selectedDateColumnLabel = col.label || col.name;
  
  // DON'T auto-apply any dates - keep them empty
  this.customStartDate = '';
  this.customEndDate = '';
  this.selectedPreset = null;
  this.startDate = null;
  this.endDate = null;
  
  // Initialize ranges if not present
  if (!this.dateRangePickerRanges || Object.keys(this.dateRangePickerRanges).length === 0) {
    this.initDateRangePresets();
  }
}

// return preset keys (for buttons in template)
dateRangePresetKeys(): string[] {
  return Object.keys(this.dateRangePickerRanges || {});
}

applyPresetRange(presetKey: string): void {
  this.selectedPreset = presetKey;
  const today = new Date();
  let startDate: Date;
  let endDate: Date = new Date(today);

  switch (presetKey) {
    case 'today':
      startDate = new Date(today);
      break;
    
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      break;
    
    case 'thisWeek':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      break;
    
    case 'lastWeek':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay() - 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    
    case 'last7Days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    
    case 'last30Days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    
    case 'last90Days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      break;
    
    default:
      startDate = new Date(today);
  }

  // Set the custom date inputs
  this.customStartDate = this.formatDateForInput(startDate);
  this.customEndDate = this.formatDateForInput(endDate);
  
  // Update moment-based properties
  this.startDate = moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  this.endDate = moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');
}

// Handle custom date change
onCustomDateChange(): void {
  this.selectedPreset = null; // Clear preset when manually editing
  
  // Update the moment-based dates
  if (this.customStartDate) {
    this.startDate = moment(this.customStartDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  }
  if (this.customEndDate) {
    this.endDate = moment(this.customEndDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');
  }
}

// Format date for input (YYYY-MM-DD)
formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date for display
formatDateDisplay(dateString: string): string {
  if (!dateString) return '';
  return moment(dateString).format('DD MMM YYYY');
}

// Validate date range
isDateRangeValid(): boolean {
  if (!this.customStartDate || !this.customEndDate) {
    return false;
  }
  const start = new Date(this.customStartDate);
  const end = new Date(this.customEndDate);
  return start <= end;
}
// confirmDateFilter() {
//   // Validate that we have both dates
//   if (!this.selectedDateColumn) {
//     alert('Please select a date column first');
//     return;
//   }
  
//   if (!this.customStartDate || !this.customEndDate) {
//     alert('Please select both start and end dates');
//     return;
//   }

//   // Sync custom dates with moment dates
//   this.startDate = moment(this.customStartDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
//   this.endDate = moment(this.customEndDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

//   try { this.spinner.show(); } catch (e) { }

//   this.applyDateFilter();

//   try { this.spinner.hide(); } catch (e) { }
  
//   this.showDateDropdown = false;
//   this.openRangePicker = false;
// }

// check if a field value is within date range
private isValueInRange(value: any, startIso: string, endIso: string): boolean {
  if (!value) return false;
  // attempt parse with moment; support unix number, ISO, or custom formats
  const m = moment(value);
  if (!m.isValid()) {
    // try if value contains date part only (e.g. DD MMM YYYY)
    const alt = moment(String(value), moment.ISO_8601, true);
    if (!alt.isValid()) return false;
    return alt.isBetween(moment(startIso), moment(endIso), undefined, '[]');
  }
  return m.isBetween(moment(startIso), moment(endIso), undefined, '[]'); // inclusive
}

// applyDateFilter() {
//   if (!this.selectedDateColumn) {
//     return;
//   }
//   if (!this.startDate || !this.endDate) {
//     return;
//   }

//   const start = moment(this.startDate, 'YYYY-MM-DD HH:mm:ss').startOf('second');
//   const end = moment(this.endDate, 'YYYY-MM-DD HH:mm:ss').endOf('second');

//   // filter originalrowData using raw values for accurate comparison
//   this.rowData = (this.originalrowData || []).filter(row => {
//     // Use raw value for comparison if it exists
//     const rawField = `${this.selectedDateColumn}_raw`;
//     const val = row?.[rawField] || row?.[this.selectedDateColumn];
    
//     if (!val && val !== 0) return false;
    
//     // parse & compare
//     const m = moment(val);
//     if (!m.isValid()) {
//       const alt = moment(String(val), moment.ISO_8601, true);
//       if (!alt.isValid()) return false;
//       return alt.isBetween(start, end, undefined, '[]');
//     }
//     return m.isBetween(start, end, undefined, '[]');
//   });

//   this.updateSlicerOptionsBasedOnCurrentData();
//   this.computeStatusCardConfigsAsFlatArray();

//   try {
//     if (this.gridApi) {
//       (this.gridApi as any).setRowData(this.rowData);
//       this.gridApi.refreshClientSideRowModel?.('filter');
//     }
//   } catch (e) {
//     console.warn('Failed to update grid after date filter', e);
//   }
// }

// clearDateFilter() {
//   this.selectedDateColumn = null;
//   this.selectedDateColumnLabel = null;
//   this.customStartDate = '';
//   this.customEndDate = '';
//   this.selectedPreset = null;
  
//   // reset date values
//   this.initDateRangePresets();
  
//   // restore rows
//   this.rowData = this.originalrowData;
//   this.updateSlicerOptionsBasedOnCurrentData();
//   this.computeStatusCardConfigsAsFlatArray();
//   this.showDateDropdown = false;
// }
  toggleSlicerSearch(sname: string): void {
    this.searchStates[sname] = !this.searchStates[sname];

    // If we're hiding the input, clear it and restore the full list
    if (!this.searchStates[sname]) {
      this.searchInputs[sname] = '';
      this.restoreSlicerList(sname);
    } else {
      // Focus is optional; you can later add ViewChild focus logic
      if (!this.searchInputs[sname]) this.searchInputs[sname] = '';
    }
  }

  // --- When the user types into the slicer-specific search box ---
  onSlicerSearch(sname: string): void {
    const q = (this.searchInputs[sname] ?? '').toString().trim().toLowerCase();
    const allValues = this.getUniqueValuesForSlicer(sname);

    if (!q) {
      // empty search -> restore full list
      this.slicerData[sname] = this.buildSlicerItemsFromValues(sname, allValues);
      return;
    }

    const filtered = allValues.filter(v => (v ?? '').toString().toLowerCase().includes(q));
    this.slicerData[sname] = this.buildSlicerItemsFromValues(sname, filtered);
  }
ngOnDestroy(): void {
  this.subs.unsubscribe();
  document.removeEventListener('click', this.handleOutsideClick);
}

  // --- clear search input for one slicer and restore its list ---
  clearSlicerSearch(sname: string): void {
    this.searchInputs[sname] = '';
    this.searchStates[sname] = false;
    this.restoreSlicerList(sname);
  }

  // --- restore the full list for a slicer based on originalrowData ---
  restoreSlicerList(sname: string): void {
    const allValues = this.getUniqueValuesForSlicer(sname);
    this.slicerData[sname] = this.buildSlicerItemsFromValues(sname, allValues);
  }

  // --- helper: get unique string values for a slicer from originalrowData ---
  private getUniqueValuesForSlicer(sname: string): string[] {
    if (!Array.isArray(this.originalrowData) || !sname) return [];
    const set = new Set<string>();
    for (const r of this.originalrowData) {
      const v = r?.[sname];
      if (v !== undefined && v !== null) {
        set.add(String(v));
      }
    }
    return Array.from(set);
  }

  // --- helper: build slicerData entries preserving existing selected state ---
  private buildSlicerItemsFromValues(sname: string, values: string[]): any[] {
    if (!this.selectedFilters[sname]) this.selectedFilters[sname] = new Set<string>();
    const sel = this.selectedFilters[sname];
    return values.map(name => ({
      name,
      isSelected: sel.has(name),
      isClicked: true
    }));
  }

  // called when a drag/drop finishes
  dropSlicer(event: CdkDragDrop<string[]>) {
    // reorder the slicerNames array (this controls display order)
    moveItemInArray(this.slicerNames, event.previousIndex, event.currentIndex);
    // If you want to trigger change-detection style updates you can call:
    // this.slicerNames = [...this.slicerNames];
  }

  // trackBy to avoid re-rendering unnecessarily
  trackBySlicer(index: number, item: string) {
    return item; // the field name is unique
  }


  getDisplayedCards() {
    const selectedCards = this.statusItems.filter(card => card.selected);
    const unselectedCards = this.statusItems.filter(card => !card.selected);

    return [...selectedCards, ...unselectedCards].slice(0, this.visibleCardsCount);
  }
private transformColDefsReplaceCustomComponent(colDefs: any[]): any[] {
  console.log("colDefs in transform function", colDefs);
  if (!Array.isArray(colDefs)) return colDefs;

  return colDefs.map(cd => {
    if (!cd) return cd;
    
    // Auto-detect date columns by field name OR if it's in dateFilterColumns
    const isDateColumn = this.dateFilterColumns?.some(dc => dc.name === cd.field) ||
                        this.isDateField(cd.field);
    
    if (isDateColumn && !cd.cellRenderer && !cd.customComponent) {
      return {
        ...cd,
        valueFormatter: (params: any) => {
          return this.formatDateValue(params.value, 'DD MMM YYYY');
        }
      };
    }
    console.log("Custom component check", cd.field, cd.customComponent);
    // Handle custom components
    if (cd.customComponent == "curr") {
      const { customComponent, ...rest } = cd;
      return {
        ...rest,
        cellRenderer: SharedCustomComponent,
        cellRendererParams: {
          field: cd.field,
          custom: cd.customComponent,
          cellParams: {}
        }
      };
    }
    else if (cd.customComponent == "image") {
      return {
        ...cd,
        cellRenderer: (params: any) => {
          const oid = params.value;
          const userProfile = this.getUserProfile(oid);
          
          const container = document.createElement('div');
          container.className = 'user-profile-cell';
          
          // Determine image source: use profile image if available, otherwise use default
          const imgSrc = userProfile?.profile_image_url || 'https://kaar.kebs.app/assets/images/User.png';
          const displayName = userProfile?.displayName || oid || '-';
          
          container.innerHTML = `
            <img src="${imgSrc}" 
                 alt="${displayName}"
                 class="profile-image">
            <span class="profile-name">${displayName}</span>
          `;
          
          return container;
        }
      };
    } 
    
    return cd;
  });
}

/**
 * Check if a field name suggests it's a date field
 */
private isDateField(fieldName: string): boolean {
  if (!fieldName) return false;
  const lower = fieldName.toLowerCase();
  return lower.includes('date') || 
         lower.includes('_on') || 
         lower.includes('_at') || 
         lower.includes('created') || 
         lower.includes('updated') ||
         lower.includes('modified') ||
         lower.includes('time') ||
         lower.endsWith('on') ||
         lower.endsWith('at');
}
getUserProfile(oid: string) {
  return this.userProfileMap[oid] || null;
}
/**
 * Format all date columns in rowData
/**
 * Format all date columns in rowData
 */
/**
 * Format all date columns in rowData
 */
private formatDatesInRowData(): void {
  if (!this.rowData?.length) {
    return;
  }
  
  // Auto-detect date fields by looking at field names and values
  const firstRow = this.rowData[0];
  const dateFields = Object.keys(firstRow).filter(key => {
    const value = firstRow[key];
    if (!value) return false;
    // Check if it's a date field by name or by ISO date pattern
    return key.toLowerCase().includes('date') || 
           key.toLowerCase().includes('_on') ||
           key.toLowerCase().includes('_at') ||
           key.toLowerCase().includes('created') ||
           key.toLowerCase().includes('updated') ||
           (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value));
  });
  
  if (!dateFields.length) {
    return;
  }
  
  // Format the dates
  this.rowData = this.rowData.map(row => {
    const formattedRow = { ...row };
    for (const field of dateFields) {
      if (row[field]) {
        const originalValue = row[field];
        const formattedValue = this.formatDateValue(originalValue, 'DD MMM YYYY');
        
        // Update the field with formatted value
        formattedRow[field] = formattedValue;
        // Store original in a backup field for filtering
        formattedRow[`${field}_raw`] = originalValue;
      }
    }
    return formattedRow;
  });
  
  // Update original row data with formatted values
  this.originalrowData = [...this.rowData];
}

private formatDateValue(value: any, format: string = 'DD MMM YYYY'): string {
  if (!value && value !== 0) return '-';  // Changed from '' to '-'
  
  // Convert to string and trim whitespace
  const strValue = String(value).trim();
  
  // Handle invalid "zero" dates from database
  if (strValue.startsWith('0000-00-00') || strValue === '0000-00-00T00:00:00') {
    return '-';
  }
  
  // Handle empty strings
  if (strValue === '') return '-';  // Changed from '' to '-'
  
  // Parse with moment (handles ISO 8601 automatically including timezones)
  const m = moment(strValue);
  
  // Return formatted or original if invalid
  return m.isValid() ? m.format(format) : strValue;
}
/* -------------------------
   Grid lifecycle handlers
   ------------------------- */

onGridReady(params: GridReadyEvent): void {
  this.gridApi = params.api;
  this.columnApi = (params as any).columnApi ?? (this.gridApi as any).columnApi ?? undefined;

  // AG Grid v34: set columnDefs via grid option
  this.gridApi.setGridOption('columnDefs', this.colDefs);

  // small async refresh to ensure header renders
  setTimeout(() => {
    this.gridApi?.refreshClientSideRowModel?.('everything');
  }, 10);
}

/**
 * Fast autosize using average-character estimator.
 * No global max cap — columns will flow; sampling + percentile reduces outlier influence.
 */
onFirstDataRendered(event: FirstDataRenderedEvent): void {
  setTimeout(() => {
    const gridApi = this.gridApi ?? event.api;
    const columnApi = (event as any).columnApi ?? this.columnApi;
    if (!gridApi || !columnApi) return;

    // temporarily disable column virtualization so measurement is stable
    (this.gridOptions as any).suppressColumnVirtualisation = true;

    // run avg-char autosize WITHOUT ANY max cap
    this.autosizeColumnsByAvgCharNoCap(gridApi, columnApi);

    // re-enable virtualization for performance
    (this.gridOptions as any).suppressColumnVirtualisation = false;

    // refresh grid layout
    gridApi.resetRowHeights();
    gridApi.refreshCells({ force: false });
  }, 120); // tweak if your webfont loads slowly
}

/* -------------------------
   Autosize helpers (avg-char approach)
   ------------------------- */

/** lazy canvas context */
private getCanvasContext(): CanvasRenderingContext2D | null {
  if (this._canvasCtx) return this._canvasCtx;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    this._canvasCtx = ctx;
    return ctx;
  } catch (err) {
    console.warn('Canvas not available for autosizing', err);
    return null;
  }
}

/** measure text width (fallback numeric estimate if canvas unavailable) */
private measureTextWidth(text: string, font: string): number {
  const ctx = this.getCanvasContext();
  if (!ctx) return text.length * 7;
  ctx.font = font;
  const w = ctx.measureText(String(text)).width;
  return Math.ceil(w || (String(text).length * 7));
}

/** compute average char width for a given font (small multiplier applied) */
private measureAvgCharWidth(font: string): number {
  const ctx = this.getCanvasContext();
  if (!ctx) return 7;
  const sample = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_.,@#()/';
  ctx.font = font;
  const totalW = ctx.measureText(sample).width || sample.length * 7;
  return (totalW / sample.length) * (this.AUTO_SIZE_CONFIG.avgCharMultiplier);
}

/** convert cell value to string for sampling */
private valueToStringForMeasure(value: any): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

/** choose sample indices uniformly across total rows */
private getSampleIndices(total: number): number[] {
  if (total <= 0) return [];
  const cfg = this.AUTO_SIZE_CONFIG;
  const sampleCount = Math.max(cfg.sampleMin, Math.min(cfg.sampleMax, Math.ceil(total * cfg.sampleRatio)));
  if (total <= sampleCount) return Array.from({ length: total }, (_, i) => i);
  const step = total / sampleCount;
  const indices: number[] = [];
  for (let i = 0; i < sampleCount; i++) indices.push(Math.floor(i * step));
  return indices;
}

/** simple percentile helper (p between 0..1) */
private percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = arr.slice().sort((a,b) => a - b);
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

private autosizeColumnsByAvgCharNoCap(gridApi: GridApi, columnApi: any): void {
  const cfg = this.AUTO_SIZE_CONFIG;
  const rowCount = Array.isArray(this.rowData) ? this.rowData.length : 0;
  const sampleIdx = this.getSampleIndices(rowCount);

  const allCols = columnApi.getAllColumns?.() ?? [];
  if (!allCols.length) return;

  // precompute avg char widths
  const avgCharWidthCell = this.measureAvgCharWidth(cfg.cellFont);

  for (const col of allCols) {
    const colDef: any = col.getColDef?.() ?? col.colDef ?? {};
    const colId = col.getId();
    const field = colDef.field ?? colId;

    // header measurement
    const headerText = (colDef.headerName ?? colDef.colId ?? field ?? colId) as string;
    const headerWidthPixels = this.measureTextWidth(headerText, cfg.headerFont) + cfg.headerExtra;

    // SAMPLE: estimate pixel widths from sampled rows using avg char width
    let repPixel = 0;
    const samplePixelWidths: number[] = [];
    if (rowCount > 0 && sampleIdx.length > 0) {
      for (const ri of sampleIdx) {
        const row = this.rowData[ri];
        const raw = row ? (field in row ? row[field] : (row[field] ?? '')) : '';
        const str = this.valueToStringForMeasure(raw);
        samplePixelWidths.push(Math.ceil((str.length || 0) * avgCharWidthCell));
      }
      // use configured percentile for representative pixel width
      repPixel = Math.ceil(this.percentile(samplePixelWidths, cfg.percentile));
    }

    // ensure header is considered
    const contentWidth = Math.max(headerWidthPixels, repPixel);

    // final width = content + padding, enforce min only, NO MAX
    const padded = Math.ceil(contentWidth + cfg.horizontalPadding);
    const minW = colDef.minWidth ?? cfg.GLOBAL_MIN;
    const finalW = Math.max(minW, padded);

    // Apply the width (try setColumnWidth, fallback to applyColumnState)
    try {
      columnApi.setColumnWidth?.(colId, finalW, true);
    } catch (err) {
      try {
        columnApi.applyColumnState?.({ state: [{ colId, width: finalW }], applyOrder: false });
      } catch (e) {
        console.warn('Failed to set column width for', colId, e);
      }
    }
  }
}
// Update your getDateRangeDisplay() method in the component (around line 960)

getDateRangeDisplay(): string {
  // Only show if we have applied dates
  if (!this.customStartDate || !this.customEndDate) {
    return '';
  }
  
  // Use shorter format for compact display
  const start = moment(this.customStartDate).format('DD MMM');
  const end = moment(this.customEndDate).format('DD MMM YY');
  
  // Show preset label if selected (more compact)
  if (this.selectedPreset) {
    const preset = this.dateRangePresets.find(p => p.key === this.selectedPreset);
    if (preset) {
      // Return preset label for quick reference
      return `${preset.label}`;
    }
  }
  
  // Show compact date range
  return `${start} - ${end}`;
}

applyFilters(): void {
  this.applyCombinedFilters();
}

// UPDATED: applyDateFilter() - now uses unified method
applyDateFilter() {
  if (!this.selectedDateColumn) {
    return;
  }
  if (!this.startDate || !this.endDate) {
    return;
  }

  this.applyCombinedFilters();
}

confirmDateFilter() {
  // Validate that we have both dates
  if (!this.selectedDateColumn) {
    alert('Please select a date column first');
    return;
  }
  
  if (!this.customStartDate || !this.customEndDate) {
    alert('Please select both start and end dates');
    return;
  }

  // Sync custom dates with moment dates
  this.startDate = moment(this.customStartDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
  this.endDate = moment(this.customEndDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

  try { this.spinner.show(); } catch (e) { }

  // Apply combined filters
  this.applyCombinedFilters();

  try { this.spinner.hide(); } catch (e) { }
  
  this.showDateDropdown = false;
  this.openRangePicker = false;
}


// UPDATED: clearSlicerFunc() - now uses unified method
clearSlicerFunc(sname: string) {
  this.selectedFilters[sname].clear();
  this.filterConfig[sname] = false;
  this.slicerData[sname].forEach(item => (item.isSelected = false));
  
  // Use unified filter method
  this.applyCombinedFilters();
}

private async preloadUserProfiles(): Promise<void> {
  // Find all columns with 'image' custom component
  const userColumns = this.colDefs
    .filter(col => col['customComponent']['cellRendererParams']['custom'] === 'image')
    .map(col => col.field);

  if (userColumns.length === 0) return;

  // Extract unique user OIDs
  const uniqueOids = new Set<string>();
  this.rowData.forEach(row => {
    userColumns.forEach(field => {
      const oid = row[field];
      if (oid) uniqueOids.add(oid);
    });
  });

  // Fetch all user profiles in parallel
  try {
    const oidArray = Array.from(uniqueOids);
    const userProfiles = await Promise.all(
      oidArray.map(oid => 
        this.crmService.getUserProfileFromDB(oid)
      )
    );

    // Store in cache
    oidArray.forEach((oid, index) => {
      this.userProfileCache.set(oid, userProfiles[index]);
    });

    console.log(`Preloaded ${uniqueOids.size} user profiles`);
  } catch (error) {
    console.error('Error preloading user profiles:', error);
  }
}

// Add this method after getDisplayedCards()
private calculateVisibleCards(): void {
  // Get the container width (accounting for padding and other elements)
  const containerWidth = window.innerWidth - this.TOOLBAR_PADDING;
  
  // Calculate how many cards can fit
  const maxCards = Math.floor(containerWidth / this.CARD_WIDTH);
  
  // Set minimum of 3 and maximum based on total cards available
  this.visibleCardsCount = Math.max(3, Math.min(maxCards, this.statusItems.length));
  
  console.log(`Window width: ${window.innerWidth}, Visible cards: ${this.visibleCardsCount}`);
}

private updateCarouselArrows(): void {
  if (typeof document === 'undefined') return;
  
  const container = document.querySelector('.slicers-container') as HTMLElement;
  if (!container) return;

  const containerWidth = container.offsetWidth;
  const totalWidth = this.slicerNames.length * (this.SLICER_WIDTH + this.SLICER_GAP);
  
  // Show arrows if content overflows
  this.showLeftArrow = this.slicerScrollPosition > 0;
  this.showRightArrow = this.slicerScrollPosition < (totalWidth - containerWidth);
}

// Scroll carousel left
scrollSlicersLeft(): void {
  const container = document.querySelector('.slicers-container') as HTMLElement;
  if (!container) return;

  const scrollAmount = this.SLICER_WIDTH + this.SLICER_GAP;
  this.slicerScrollPosition = Math.max(0, this.slicerScrollPosition - scrollAmount);
  
  container.scrollTo({
    left: this.slicerScrollPosition,
    behavior: 'smooth'
  });
  
  setTimeout(() => this.updateCarouselArrows(), 300);
}

// Scroll carousel right
scrollSlicersRight(): void {
  const container = document.querySelector('.slicers-container') as HTMLElement;
  if (!container) return;

  const scrollAmount = this.SLICER_WIDTH + this.SLICER_GAP;
  const maxScroll = container.scrollWidth - container.offsetWidth;
  this.slicerScrollPosition = Math.min(maxScroll, this.slicerScrollPosition + scrollAmount);
  
  container.scrollTo({
    left: this.slicerScrollPosition,
    behavior: 'smooth'
  });
  
  setTimeout(() => this.updateCarouselArrows(), 300);
}

// Update the toggleSlicer method to initialize arrows
toggleSlicer() {
  this.showSlicer = !this.showSlicer;
  this.fetchSlicersUniqueData();
  
  if (this.showSlicer) {
    // Wait for DOM to render, then check arrows
    setTimeout(() => {
      this.updateCarouselArrows();
    }, 100);
  }
}

// Add window resize listener for carousel arrows
@HostListener('window:resize')
onResize(): void {
  this.calculateVisibleCards();
  if (this.showSlicer) {
    this.updateCarouselArrows();
  }

}

// Add this method to check if date filter is truly active
isDateFilterActive(): boolean {
  // Filter is only active if we have a column AND actual date values
  return !!(this.selectedDateColumn && this.customStartDate && this.customEndDate);
}

// Update your toggleDateDropdown method
toggleDateDropdown() {
  // When closing the dropdown
  if (this.showDateDropdown) {
    // If a column was selected but no dates were applied, clear the selection
    if (this.selectedDateColumn && (!this.customStartDate || !this.customEndDate)) {
      this.selectedDateColumn = null;
      this.selectedDateColumnLabel = null;
      this.selectedPreset = null;
      this.customStartDate = '';
      this.customEndDate = '';
    }
    document.removeEventListener('click', this.handleOutsideClick);
  } else {
    // When opening the dropdown
    if (!this.dateRangePickerRanges || Object.keys(this.dateRangePickerRanges).length === 0) {
      this.initDateRangePresets();
    }
    
    // Add outside click listener
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }
  
  this.showDateDropdown = !this.showDateDropdown;
}

// Update the handleOutsideClick method
handleOutsideClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  if (!target.closest('.date-filter-wrapper')) {
    // Before closing, check if column was selected but no dates applied
    if (this.selectedDateColumn && (!this.customStartDate || !this.customEndDate)) {
      // Clear the incomplete selection
      this.selectedDateColumn = null;
      this.selectedDateColumnLabel = null;
      this.selectedPreset = null;
      this.customStartDate = '';
      this.customEndDate = '';
    }
    
    this.showDateDropdown = false;
    document.removeEventListener('click', this.handleOutsideClick);
  }
};

// Update clearDateFilter to ensure everything is cleared
clearDateFilter() {
  this.selectedDateColumn = null;
  this.selectedDateColumnLabel = null;
  this.customStartDate = '';
  this.customEndDate = '';
  this.selectedPreset = null;
  this.startDate = null;
  this.endDate = null;
  
  // Reset date values
  this.initDateRangePresets();
  
  // Reapply combined filters (this will keep slicer filters active)
  this.applyCombinedFilters();
  
  this.showDateDropdown = false;
}
private calculateWinRate(): void {
  if (!this.rowData || this.rowData.length === 0) {
    this.winRate = 0;
    this.totalOpportunityValue = 0;
    this.wonOpportunityValue = 0;
    console.log('Win Rate: No data available');
    return;
  }

  let totalAllOpportunities = 0;  // Sum of ALL opportunity values
  let totalWonOpportunities = 0;   // Sum of opportunity values where status_id = 17

  // Check if status card filter is active (this is the only filter applied via grid)
  const hasStatusFilter = this.statusItems.some(card => card.selected);

  let visibleRows: any[] = [];
  
  // Use grid filtering ONLY for status card filters (applied via gridApi.setFilterModel)
  // For slicer, date, and search filters, rowData is already filtered
  if (hasStatusFilter && this.gridApi) {
    try {
      this.gridApi.forEachNodeAfterFilter((node) => {
        visibleRows.push(node.data);
      });
      console.log(`Calculating Win Rate on ${visibleRows.length} rows with status filter`);
    } catch (error) {
      console.warn('Error accessing grid nodes:', error);
      visibleRows = this.rowData;
    }
  } else {
    // Use rowData directly - it's already filtered by slicers/date/search
    visibleRows = this.rowData;
    console.log(`Calculating Win Rate on ${visibleRows.length} rows from rowData`);
  }

  visibleRows.forEach(row => {
    // Extract opportunity value in USD
    const oppValue = row.opportunity_value;
    let valueInUSD = 0;

    if (Array.isArray(oppValue) && oppValue.length > 0) {
      // Find USD value in the array
      const usdEntry = oppValue.find(v => v.currency_code === 'USD');
      valueInUSD = usdEntry ? usdEntry.value : oppValue[0].value;
    } else if (typeof oppValue === 'number') {
      valueInUSD = oppValue;
    }

    // Add to total of ALL opportunities
    totalAllOpportunities += valueInUSD;

    // Add to won opportunities ONLY if status_id = 17
    if (row.status_id === 17) {
      totalWonOpportunities += valueInUSD;
    }
  });

  // Store the values
  this.totalOpportunityValue = totalAllOpportunities;
  this.wonOpportunityValue = totalWonOpportunities;
  
  // Calculate win rate as percentage
  // WIN RATE = (Won / Total) * 100
  this.winRate = totalAllOpportunities > 0 ? (totalWonOpportunities / totalAllOpportunities) * 100 : 0;
  
  console.log('=== Win Rate Calculation ===');
  console.log(`Total Opportunities: ${totalAllOpportunities.toFixed(2)}`);
  console.log(`Won Opportunities (status_id=17): ${totalWonOpportunities.toFixed(2)}`);
  console.log(`Win Rate: ${this.winRate.toFixed(2)}%`);
  console.log(`Formula: (${totalWonOpportunities.toFixed(2)} / ${totalAllOpportunities.toFixed(2)}) * 100 = ${this.winRate.toFixed(2)}%`);
  console.log('========================');
}
formatCurrency(value: number): string {
  if (!value) return '$0';
  
  // Format based on magnitude
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

private applyCombinedFilters(): void {
  // Start with all original data
  let filteredData = [...this.originalrowData];

  // 1. Apply slicer filters
  filteredData = filteredData.filter(item =>
    this.slicerNames.every(sname =>
      this.selectedFilters[sname].size === 0 || this.selectedFilters[sname].has(item[sname])
    )
  );

  // 2. Apply date filter if configured
  if (this.selectedDateColumn && this.startDate && this.endDate) {
    const start = moment(this.startDate, 'YYYY-MM-DD HH:mm:ss').startOf('second');
    const end = moment(this.endDate, 'YYYY-MM-DD HH:mm:ss').endOf('second');

    filteredData = filteredData.filter(row => {
      const rawField = `${this.selectedDateColumn}_raw`;
      const val = row?.[rawField] || row?.[this.selectedDateColumn];
      
      if (!val && val !== 0) return false;
      
      const m = moment(val);
      if (!m.isValid()) {
        const alt = moment(String(val), moment.ISO_8601, true);
        if (!alt.isValid()) return false;
        return alt.isBetween(start, end, undefined, '[]');
      }
      return m.isBetween(start, end, undefined, '[]');
    });
  }

  // Update rowData with combined filters
  this.rowData = filteredData;
  
  // Update UI components
  this.updateSlicerOptionsBasedOnCurrentData();
  this.computeStatusCardConfigsAsFlatArray();
  
  // Calculate Win Rate
  this.calculateWinRate();
}
onSearch() {
  const search = this.searchText.toLowerCase();
  const filteredvalues = this.originalrowData.filter((card) =>
    Object.values(card).some((value) =>
      String(value).toLowerCase().includes(search)
    )
  );
  this.rowData = filteredvalues;
  
  // Recalculate win rate after search
  this.calculateWinRate();
  this.updateSlicerOptionsBasedOnCurrentData();
  this.computeStatusCardConfigsAsFlatArray();
}

onFilterCardClick(sum) {
  console.log(sum);
  this.statusItems.forEach(card => {
    if (card.value === sum.value) {
      card.selected = !card.selected;
    }
  });

  const key = sum.key;
  const toFilter = _.pluck(this.statusItems.filter(card => card.selected), 'value');

  let filterModel = null;
  if (toFilter.length > 0) {
    filterModel = {
      [key]: {
        filterType: 'set',
        values: toFilter
      }
    };
  }

  console.log("Filter Model: ", filterModel);
  this.gridApi.setFilterModel(filterModel);
  
  // Recalculate win rate after status filter
  this.calculateWinRate();
}

isWinLossReport(): boolean {
  return this.reportKey === 'win-loss-report';
}

private async preloadUserProfilesForGrid(): Promise<void> {
  try {
    console.log('🔍 Starting preload...',this.data?.report_config?.colDefs);

    const imageColumns = this.data?.report_config?.colDefs
      ?.filter((col: any) => col?.customComponent === 'image')
      .map((col: any) => col.field) || [];

      console.log('🖼️ Found image columns:', imageColumns);

    if (imageColumns.length === 0) return;

    console.log('🖼️ Found image columns:', imageColumns);

    const uniqueOids = new Set<string>();

    this.rowData.forEach(row => {
      imageColumns.forEach((field: string) => {
        const oid = row[field];
        if (oid && typeof oid === 'string' && oid.trim() !== '') {
          uniqueOids.add(oid.trim());
        }
      });
    });

    console.log('Found unique oids:', uniqueOids);

    if (uniqueOids.size === 0) return;

    const oidArray = Array.from(uniqueOids);

    console.log('📡 Loading user profiles for', oidArray.length, 'users');

    const resp = await this.reportService.getUserNameandImage(oidArray).toPromise();

    resp.messData.forEach((u: any) => {
      this.userProfileMap[u.oid] = {
        displayName: u.displayName,
        profile_image_url: u.profile_image_url
      };
    });

    console.log('✅ Cached profiles:', this.userProfileMap);

  } catch (error) {
    console.error('❌ Error preloading user profiles:', error);
  }
}

}
