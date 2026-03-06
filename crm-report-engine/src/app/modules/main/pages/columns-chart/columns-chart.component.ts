import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { CrmService } from '../../services/crm.service';
import { MatCardModule } from '@angular/material/card';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Location } from '@angular/common';

@Component({
  selector: 'app-columns-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    NgxSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './columns-chart.component.html',
  styleUrls: ['./columns-chart.component.scss']
})
export class ColumnsChartComponent implements OnInit, AfterViewInit {

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;

  rowDataAPI = '';
  widgetId: string | null = null;
  
  // EDIT MODE SUPPORT
  editMode: boolean = false;
  existingChartConfig: any = null;

  colDefs: any[] = [];
  rowData: any[] = [];

  selectedX: string | null = null;
  selectedY: string | null = null;
  breakdownBy: string | null = null;
  compareBy: string | null = null;
  additionalFields: string[] = [];

  // Drag and drop
  draggedColumn: any = null;
  dragOverZone: string | null = null;

  // Column filtering
  columnSearchText: string = '';
  columnFilter: 'all' | 'contacts' | 'calls' = 'all';

  // Breakdown and compare options
  breakdownPeriod: string = 'year';
  filterPeriod: string = 'this-year-to-last-year';
  useFiscalYear: boolean = false;

  // Validity maps
  xValidMap: Record<string, boolean> = {};
  yValidMap: Record<string, boolean> = {};

  dataReady = false;
  barChart?: Chart;
  loadingMeta = true;
  loadingData = false;

  /** GROUP MODE - now optional (can be null for no aggregation) */
  groupMode: 'SUM' | 'AVG' | 'COUNT' | null = null;

  /** GROUPED DATA STORED */
  groupedLabels: string[] = [];
  groupedValues: number[] = [];
  
  /** MULTI-SERIES DATA FOR BREAKDOWN/COMPARISON */
  multiSeriesLabels: string[] = [];
  multiSeriesData: number[][] = [];

  /** CHART TYPES */
  chart1Type: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea' = 'bar';

  /** ZOOM LEVELS */
  chart1Zoom = 100;

  /** TOP N ITEMS (for pie-type charts only) */
  topNItems = 15;

  /** LABEL DISPLAY OPTIONS */
  labelDisplay: 'none' | 'value' | 'percentage' | 'both' = 'percentage';

  /** LABEL SELECTION FOR PIE CHARTS */
  selectedLabels: string[] = [];
  labelSearchText: string = '';
  private allLabelOptions: {label: string, value: number}[] = [];

  chartTypes = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'doughnut', label: 'Doughnut Chart' },
    { value: 'polarArea', label: 'Polar Area Chart' }
  ];

  constructor(
    private crmService: CrmService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.rowDataAPI = params['api'];
      this.widgetId = params['widgetId'];
      this.editMode = params['editMode'] === 'true';

      if (!this.rowDataAPI) {
        console.error('Row Data API missing');
        return;
      }

      // Get router state for edit mode
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras?.state || this.location.getState() as any;

      if (this.editMode && state?.chartConfig) {
        // EDIT MODE: Restore existing configuration
        this.existingChartConfig = state.chartConfig;
        console.log('Edit mode: Restoring chart config', this.existingChartConfig);
        this.restoreChartConfiguration(this.existingChartConfig);
      }

      // Load metadata and data
      this.loadReportMeta();
    });
  }

  ngAfterViewInit(): void {}

  // NEW METHOD: Restore chart configuration from existing data
  private restoreChartConfiguration(config: any): void {
    console.log('Restoring configuration:', config);

    // Restore basic selections
    this.selectedX = config.selectedX || null;
    this.selectedY = config.selectedY || null;
    this.chart1Type = config.chartType || 'bar';
    this.groupMode = config.groupMode !== undefined ? config.groupMode : null;
    this.labelDisplay = config.labelDisplay || 'percentage';
    this.topNItems = config.topNItems || 15;
    this.chart1Zoom = config.zoom || 100;

    // Restore breakdown/comparison settings
    this.breakdownBy = config.breakdownBy || null;
    this.compareBy = config.compareBy || null;
    this.additionalFields = config.additionalFields || [];
    this.breakdownPeriod = config.breakdownPeriod || 'year';
    this.filterPeriod = config.filterPeriod || 'this-year-to-last-year';
    this.useFiscalYear = config.useFiscalYear || false;

    // Restore selected labels (for pie charts)
    if (config.selectedLabels && config.selectedLabels.length > 0) {
      this.selectedLabels = [...config.selectedLabels];
    }

    // Restore grouped data if available
    if (config.groupedLabels && config.groupedValues) {
      this.groupedLabels = [...config.groupedLabels];
      this.groupedValues = [...config.groupedValues];
    }

    // Restore multi-series data if it exists
    if (config.multiSeriesLabels && config.multiSeriesData) {
      this.multiSeriesLabels = [...config.multiSeriesLabels];
      this.multiSeriesData = config.multiSeriesData.map((series: any[]) => [...series]);
    }

    console.log('✅ Configuration restored:', {
      selectedX: this.selectedX,
      selectedY: this.selectedY,
      chartType: this.chart1Type,
      groupMode: this.groupMode,
      hasMultiSeries: this.multiSeriesLabels.length > 0
    });
  }

  async loadReportMeta() {
    try {
      const reports = await this.crmService.getReports() as any[];

      const report = reports.find(
        r => r.report_config?.rowDataAPI === this.rowDataAPI
      );

      if (!report) {
        console.error('Report config not found for API:', this.rowDataAPI);
        this.loadingMeta = false;
        return;
      }

      this.colDefs = report.report_config.colDefs || [];
      this.loadDataAndAnalyze();

    } catch (err) {
      console.error('Failed to load report metadata', err);
    } finally {
      this.loadingMeta = false;
    }
  }

  loadSavedChartConfig(): void {
    // This method is now replaced by restoreChartConfiguration
    // but kept for backward compatibility
    if (!this.widgetId || this.editMode) return; // Skip if in edit mode

    const widget = this.crmService.dashboard.find(w => w.id === this.widgetId);
    if (widget?.chartConfig) {
      const config = widget.chartConfig;
      
      this.selectedX = config.selectedX || null;
      this.selectedY = config.selectedY || null;
      this.chart1Type = config.chartType || 'bar';
      this.groupMode = config.groupMode !== undefined ? config.groupMode : null;
      this.labelDisplay = config.labelDisplay || 'percentage';
      this.topNItems = config.topNItems || 15;
      this.selectedLabels = config.selectedLabels || [];
      this.chart1Zoom = config.zoom || 100;
      this.breakdownBy = config.breakdownBy || null;
      this.compareBy = config.compareBy || null;
      this.additionalFields = config.additionalFields || [];
      this.breakdownPeriod = config.breakdownPeriod || 'year';
      this.filterPeriod = config.filterPeriod || 'this-year-to-last-year';
      this.useFiscalYear = config.useFiscalYear || false;

      console.log('Loaded chart config:', config);
    }
  }

  saveAndReturn(): void {
    if (!this.selectedX || !this.selectedY) {
      alert('Please select both X and Y axis before saving');
      return;
    }

    const chartConfig = {
      rowDataAPI: this.rowDataAPI,
      selectedX: this.selectedX,
      selectedY: this.selectedY,
      chartType: this.chart1Type,
      groupMode: this.groupMode,
      labelDisplay: this.labelDisplay,
      topNItems: this.topNItems,
      selectedLabels: this.selectedLabels,
      zoom: this.chart1Zoom,
      breakdownBy: this.breakdownBy,
      compareBy: this.compareBy,
      additionalFields: this.additionalFields,
      breakdownPeriod: this.breakdownPeriod,
      filterPeriod: this.filterPeriod,
      useFiscalYear: this.useFiscalYear,
      groupedLabels: this.groupedLabels,
      groupedValues: this.groupedValues,
      multiSeriesLabels: this.multiSeriesLabels,
      multiSeriesData: this.multiSeriesData
    };

    if (this.widgetId) {
      if (this.editMode) {
        console.log('📝 Updating existing chart configuration');
      } else {
        console.log('✨ Creating new chart configuration');
      }
      
      this.crmService.updateWidgetChartConfig(this.widgetId, chartConfig);
    }

    this.router.navigate(['main/crmreportengine/report-building']);
  }

  cancelAndReturn(): void {
    if (this.editMode && this.hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['main/crmreportengine/report-building']);
      }
    } else {
      this.router.navigate(['main/crmreportengine/report-building']);
    }
  }

  // Helper method to detect changes
  private hasUnsavedChanges(): boolean {
    if (!this.editMode || !this.existingChartConfig) {
      return true; // New chart always has "changes"
    }

    // Compare current state with original config
    return (
      this.selectedX !== this.existingChartConfig.selectedX ||
      this.selectedY !== this.existingChartConfig.selectedY ||
      this.groupMode !== this.existingChartConfig.groupMode ||
      this.chart1Type !== this.existingChartConfig.chartType ||
      JSON.stringify(this.selectedLabels) !== JSON.stringify(this.existingChartConfig.selectedLabels || []) ||
      this.breakdownBy !== this.existingChartConfig.breakdownBy ||
      this.compareBy !== this.existingChartConfig.compareBy
    );
  }

  getExampleValue(field: string): string {
    if (!this.rowData || this.rowData.length === 0) return '-';

    for (const row of this.rowData) {
      const val = row?.[field];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        return String(val);
      }
    }

    return '-';
  }

  // ---------------------------
  // DRAG AND DROP FUNCTIONALITY WITH AUTO-FILL
  // ---------------------------
  onDragStart(event: DragEvent, col: any): void {
    this.draggedColumn = col;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', col.field);
  }

  onDragEnd(event: DragEvent): void {
    this.draggedColumn = null;
    this.dragOverZone = null;
  }

  onDragOver(event: DragEvent, zone: string): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverZone = zone;
  }

  onDragLeave(event: DragEvent): void {
    this.dragOverZone = null;
  }

  onDrop(event: DragEvent, zone: string): void {
    event.preventDefault();
    this.dragOverZone = null;

    if (!this.draggedColumn) return;

    const field = this.draggedColumn.field;

    switch (zone) {
      case 'x':
        if (this.isXAllowed(field)) {
          this.selectedX = field;
        } else {
          alert('This field is not suitable for X-axis. Please select a categorical or date field.');
        }
        break;
      case 'y':
        if (this.isYAllowed(field)) {
          this.selectedY = field;
        } else {
          alert('This field is not suitable for Y-axis. Please select a numeric field.');
        }
        break;
      case 'breakdown':
        if (this.isDateColumn(field)) {
          this.breakdownBy = field;
          // AUTO-FILL: Set comparison to the same field
          this.compareBy = field;
          console.log(`✅ Auto-filled: breakdown and comparison both set to "${field}"`);
        } else {
          alert('Breakdown requires a date field.');
        }
        break;
      case 'compare':
        if (this.isDateColumn(field)) {
          this.compareBy = field;
          // AUTO-FILL: Set breakdown to the same field
          this.breakdownBy = field;
          console.log(`✅ Auto-filled: comparison and breakdown both set to "${field}"`);
        } else {
          alert('Compare requires a date field.');
        }
        break;
      case 'fields':
        if (!this.additionalFields.includes(field)) {
          this.additionalFields.push(field);
        }
        break;
    }

    this.draggedColumn = null;
  }

  removeSelection(zone: string): void {
    switch (zone) {
      case 'x':
        this.selectedX = null;
        break;
      case 'y':
        this.selectedY = null;
        break;
      case 'breakdown':
        this.breakdownBy = null;
        // When removing breakdown, also clear comparison to maintain sync
        this.compareBy = null;
        console.log('🗑️ Removed breakdown and comparison (maintaining sync)');
        break;
      case 'compare':
        this.compareBy = null;
        // When removing comparison, also clear breakdown to maintain sync
        this.breakdownBy = null;
        console.log('🗑️ Removed comparison and breakdown (maintaining sync)');
        break;
    }
  }

  removeAdditionalField(field: string): void {
    this.additionalFields = this.additionalFields.filter(f => f !== field);
  }

  // ---------------------------
  // COLUMN FILTERING
  // ---------------------------
  filterColumns(): void {
    // Filtering is handled by getFilteredColumns()
  }

  clearColumnSearch(): void {
    this.columnSearchText = '';
  }

  setColumnFilter(filter: 'all' | 'contacts' | 'calls'): void {
    this.columnFilter = filter;
  }

  getFilteredColumns(): any[] {
    let filtered = [...this.colDefs];

    if (this.columnSearchText) {
      const search = this.columnSearchText.toLowerCase();
      filtered = filtered.filter(col => 
        col.headerName.toLowerCase().includes(search) ||
        col.field.toLowerCase().includes(search)
      );
    }

    if (this.columnFilter !== 'all') {
      filtered = filtered.filter(col => {
        const field = col.field.toLowerCase();
        if (this.columnFilter === 'contacts') {
          return field.includes('contact') || field.includes('owner') || field.includes('name');
        } else if (this.columnFilter === 'calls') {
          return field.includes('call') || field.includes('duration') || field.includes('direction');
        }
        return true;
      });
    }

    return filtered;
  }

  // ---------------------------
  // COLUMN TYPE DETECTION
  // ---------------------------
  getColumnType(field: string): string {
    if (this.isNumericColumn(field)) return 'numeric';
    if (this.isDateColumn(field)) return 'date';
    return 'text';
  }

  isNumericColumn(field: string): boolean {
    return this.isMostlyNumeric(field);
  }

  isDateColumn(field: string): boolean {
    const sample = this.rowData.slice(0, 30);
    return sample.some(r => this.isDateLike(r?.[field]));
  }

  // ---------------------------
  // Y-AXIS LABEL WITH OPTIONAL AGGREGATION
  // ---------------------------
  getYAxisLabel(): string {
    if (!this.selectedY) return '';
    const headerName = this.getHeaderName(this.selectedY);
    
    // Only show aggregation if one is selected
    if (this.groupMode) {
      return `(${this.groupMode}) ${headerName}`;
    }
    return headerName;
  }

  // ---------------------------
  // BREAKDOWN AND COMPARE HANDLERS
  // ---------------------------
  onBreakdownChange(): void {
    if (this.groupedLabels.length > 0) {
      this.buildGroupedData();
      this.renderChart();
    }
  }

  onFilterPeriodChange(): void {
    if (this.groupedLabels.length > 0) {
      this.buildGroupedData();
      this.renderChart();
    }
  }

  onFiscalYearChange(): void {
    if (this.groupedLabels.length > 0) {
      this.buildGroupedData();
      this.renderChart();
    }
  }

  toggleFormulaFields(): void {
    console.log('Toggle formula fields');
  }

  // ---------------------------
  // DATA LOADING
  // ---------------------------
  loadDataAndAnalyze() {
    if (!this.rowDataAPI) {
      alert('Row Data API missing');
      return;
    }

    this.loadingData = true;
    this.dataReady = false;

    // Don't reset selections if in edit mode
    if (!this.editMode) {
      this.selectedX = null;
      this.selectedY = null;
      this.breakdownBy = null;
      this.compareBy = null;
      this.additionalFields = [];
      this.groupedLabels = [];
      this.groupedValues = [];
    }

    this.rowData = [];
    this.barChart?.destroy();

    this.crmService.loadDataFromAPI(this.rowDataAPI).subscribe({
      next: (res: any) => {
        this.rowData = Array.isArray(res?.messData) ? res.messData : [];
        this.loadingData = false;

        if (!this.rowData.length) {
          alert('No data returned from API');
          return;
        }

        this.buildAxisValidity();
        this.dataReady = true;

        // If in edit mode and we have selections, render automatically
        if (this.editMode && this.selectedX && this.selectedY) {
          console.log('🎨 Auto-rendering chart in edit mode');
          setTimeout(() => {
            this.renderFromSelection();
          }, 100);
        } else if (this.selectedX && this.selectedY) {
          this.renderFromSelection();
        }
      },
      error: err => {
        console.error('DB API failed', err);
        this.loadingData = false;
        alert('Failed to load row data');
      }
    });
  }

  renderFromSelection() {
    if (!this.dataReady) {
      alert('Please wait for data to load');
      return;
    }

    if (!this.selectedX || !this.selectedY) {
      alert('Please select both X and Y axis');
      return;
    }

    if (!this.isXAllowed(this.selectedX)) {
      alert('Selected X is not valid');
      return;
    }

    if (!this.isYAllowed(this.selectedY)) {
      alert('Selected Y is not valid');
      return;
    }

    this.buildGroupedData();

    this.cdr.detectChanges();

    setTimeout(() => {
      this.renderChart();
    }, 50);
  }

  isPieTypeChart(): boolean {
    return ['pie', 'doughnut', 'polarArea'].includes(this.chart1Type);
  }

  // ---------------------------
  // VALIDITY DETECTION
  // ---------------------------
  private isDateLike(value: any): boolean {
    if (value == null) return false;
    const s = String(value).trim();
    if (!s) return false;
    const d = new Date(s);
    return !isNaN(d.getTime());
  }

  private isMostlyNumeric(field: string, sampleSize = 30): boolean {
    const sample = this.rowData.slice(0, sampleSize);
    let total = 0;
    let numericCount = 0;

    for (const r of sample) {
      const v = r?.[field];
      if (v === null || v === undefined || v === '') continue;
      total++;
      if (!isNaN(Number(v))) numericCount++;
    }

    if (total === 0) return false;
    return numericCount / total >= 0.8;
  }

  private isHighCardinality(field: string, sampleSize = 50): boolean {
    const sample = this.rowData.slice(0, sampleSize);
    const values = sample
      .map(r => r?.[field])
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v));

    if (!values.length) return false;
    const unique = new Set(values);
    if (unique.size <= 25) return false;
    return unique.size / values.length > 0.8;
  }

  private buildAxisValidity(): void {
    this.xValidMap = {};
    this.yValidMap = {};

    for (const col of this.colDefs) {
      const field = col.field;
      const isNumeric = this.isMostlyNumeric(field);
      const isFreeText = this.isFreeTextField(field);
      const sample = this.rowData.slice(0, 30);
      const isDate = sample.some(r => this.isDateLike(r?.[field]));

      const yOk = isNumeric;
      const xOk = !isNumeric && !isFreeText && (isDate || true);

      this.xValidMap[field] = xOk;
      this.yValidMap[field] = yOk;
    }

    // Don't clear selections in edit mode
    if (!this.editMode) {
      if (this.selectedX && !this.xValidMap[this.selectedX]) {
        this.selectedX = null;
      }
      if (this.selectedY && !this.yValidMap[this.selectedY]) {
        this.selectedY = null;
      }
    }
  }

  private isFreeTextField(field: string, sampleSize = 20): boolean {
    const sample = this.rowData.slice(0, sampleSize);
    let checked = 0;
    let longTextCount = 0;

    for (const r of sample) {
      const v = r?.[field];
      if (!v) continue;
      const s = String(v).trim();
      if (!s) continue;
      checked++;
      if (s.length > 50 || s.split(' ').length > 8) {
        longTextCount++;
      }
    }

    if (checked === 0) return false;
    return longTextCount / checked > 0.6;
  }

  isXAllowed(field: string): boolean {
    return !!this.xValidMap[field];
  }

  isYAllowed(field: string): boolean {
    return !!this.yValidMap[field];
  }

  buildGroupedData() {
    if (this.breakdownBy || this.compareBy) {
      this.buildMultiSeriesData();
      return;
    }

    const groupMap = new Map<string, number[]>();

    for (const row of this.rowData) {
      const key = String(row[this.selectedX!]);
      const val = Number(row[this.selectedY!]) || 0;

      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(val);
    }

    let labels = Array.from(groupMap.keys());
    labels = labels.sort((a, b) => a.localeCompare(b));

    const values = labels.map(label => {
      const arr = groupMap.get(label)!;
      const sum = arr.reduce((a, b) => a + b, 0);

      // If no aggregation is selected, take the first value (or could use sum)
      if (!this.groupMode) {
        return arr.length > 0 ? arr[0] : 0;
      } else if (this.groupMode === 'COUNT') {
        return arr.length;
      } else if (this.groupMode === 'AVG') {
        return sum / arr.length;
      } else {
        // SUM
        return sum;
      }
    });

    this.groupedLabels = labels;
    this.groupedValues = values;

    this.initializeLabelOptions();
  }

  private buildMultiSeriesData() {
    const breakdownField = this.breakdownBy || this.compareBy;
    if (!breakdownField) return;

    const multiMap = new Map<string, Map<string, number[]>>();

    for (const row of this.rowData) {
      const xKey = String(row[this.selectedX!]);
      const breakdownValue = this.formatBreakdownValue(row[breakdownField]);
      const yVal = Number(row[this.selectedY!]) || 0;

      if (!multiMap.has(xKey)) {
        multiMap.set(xKey, new Map());
      }
      const innerMap = multiMap.get(xKey)!;
      if (!innerMap.has(breakdownValue)) {
        innerMap.set(breakdownValue, []);
      }
      innerMap.get(breakdownValue)!.push(yVal);
    }

    const allBreakdownValues = new Set<string>();
    multiMap.forEach(innerMap => {
      innerMap.forEach((_, key) => allBreakdownValues.add(key));
    });

    this.multiSeriesLabels = Array.from(allBreakdownValues).sort();
    this.groupedLabels = Array.from(multiMap.keys()).sort((a, b) => a.localeCompare(b));

    this.multiSeriesData = this.multiSeriesLabels.map(seriesLabel => {
      return this.groupedLabels.map(xLabel => {
        const innerMap = multiMap.get(xLabel);
        if (!innerMap || !innerMap.has(seriesLabel)) return 0;

        const arr = innerMap.get(seriesLabel)!;
        const sum = arr.reduce((a, b) => a + b, 0);

        // If no aggregation is selected, take the first value
        if (!this.groupMode) {
          return arr.length > 0 ? arr[0] : 0;
        } else if (this.groupMode === 'COUNT') {
          return arr.length;
        } else if (this.groupMode === 'AVG') {
          return sum / arr.length;
        } else {
          // SUM
          return sum;
        }
      });
    });

    this.initializeLabelOptions();
  }

  private formatBreakdownValue(value: any): string {
    if (!value) return 'Unknown';
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      switch (this.breakdownPeriod) {
        case 'year':
          return date.getFullYear().toString();
        case 'quarter':
          const q = Math.floor(date.getMonth() / 3) + 1;
          return `Q${q} ${date.getFullYear()}`;
        case 'month':
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        case 'week':
          const week = this.getWeekNumber(date);
          return `Week ${week} ${date.getFullYear()}`;
        case 'day':
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        default:
          return date.getFullYear().toString();
      }
    }
    
    return String(value);
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private initializeLabelOptions(): void {
    this.allLabelOptions = this.groupedLabels.map((label, idx) => ({
      label,
      value: this.groupedValues[idx]
    }));

    this.allLabelOptions.sort((a, b) => b.value - a.value);

    if (this.isPieTypeChart() && this.selectedLabels.length === 0) {
      this.selectTopN();
    }
  }

  getFilteredLabelOptions(): {label: string, value: number}[] {
    const search = this.labelSearchText?.toLowerCase() || '';
    if (!search) return this.allLabelOptions;
    return this.allLabelOptions.filter(opt => 
      opt.label.toLowerCase().includes(search)
    );
  }

  filterLabels(): void {
    // Filtering happens in getFilteredLabelOptions()
  }

  renderChart() {
  if (!this.groupedLabels.length) return;
  if (!this.barCanvas?.nativeElement) {
    console.error('Canvas not available');
    return;
  }

  this.barChart?.destroy();

  const ctx = this.barCanvas.nativeElement.getContext('2d')!;
  
  let labels: string[];
  let datasets: any[];

  // Check if we have multi-series data (breakdown/comparison)
  const hasMultiSeries = this.multiSeriesLabels.length > 0 && this.multiSeriesData.length > 0;

  if (this.isPieTypeChart()) {
    // Pie charts don't support multi-series, use single series
    if (!this.selectedLabels || this.selectedLabels.length === 0) return;

    labels = this.selectedLabels;
    const values = labels.map(label => {
      const idx = this.groupedLabels.indexOf(label);
      return idx >= 0 ? this.groupedValues[idx] : 0;
    });

    const pairs = labels.map((label, idx) => ({ label, value: values[idx] }));
    pairs.sort((a, b) => b.value - a.value);
    labels = pairs.map(p => p.label);
    const sortedValues = pairs.map(p => p.value);

    datasets = [{
      label: this.getYAxisLabel(),
      data: sortedValues,
      backgroundColor: this.generateGradientColors(sortedValues.length, ctx),
      borderColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 2,
      hoverOffset: 15,
      hoverBorderWidth: 3
    }];
  } else if (hasMultiSeries) {
    // Multi-series chart (breakdown/comparison)
    labels = this.groupedLabels;
    
    const colorPalette = this.getModernColorPalette(this.multiSeriesLabels.length);
    
    datasets = this.multiSeriesLabels.map((seriesLabel, idx) => {
      const data = this.multiSeriesData[idx];
      const color = colorPalette[idx];
      
      return {
        label: seriesLabel,
        data: data,
        backgroundColor: this.chart1Type === 'line' 
          ? this.createGradientFill(ctx, color, 0.2)
          : this.createGradientFill(ctx, color, 0.8),
        borderColor: color,
        borderWidth: 2,
        tension: this.chart1Type === 'line' ? 0.4 : undefined,
        fill: this.chart1Type === 'line' ? true : undefined,
        pointRadius: this.chart1Type === 'line' ? 4 : undefined,
        pointHoverRadius: this.chart1Type === 'line' ? 6 : undefined,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color,
        pointHoverBorderWidth: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      };
    });
  } else {
    // Single series chart
    labels = this.groupedLabels;
    const values = this.groupedValues;
    
    const gradient = this.createMultiColorGradient(ctx, values.length);

    datasets = [{
      label: this.getYAxisLabel(),
      data: values,
      backgroundColor: this.chart1Type === 'line'
        ? this.createGradientFill(ctx, '#ee4961', 0.2)
        : gradient,
      borderColor: this.chart1Type === 'line' ? '#ee4961' : 'rgba(238, 73, 97, 0.8)',
      borderWidth: 2,
      tension: this.chart1Type === 'line' ? 0.4 : undefined,
      fill: this.chart1Type === 'line' ? true : undefined,
      pointRadius: this.chart1Type === 'line' ? 4 : undefined,
      pointHoverRadius: this.chart1Type === 'line' ? 6 : undefined,
      pointBackgroundColor: '#ee4961',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#ee4961',
      pointHoverBorderWidth: 3,
      barPercentage: 0.8,
      categoryPercentage: 0.9
    }];
  }

  // Calculate chart dimensions
  let chartWidth: number;
  let chartHeight: number;

  if (this.isPieTypeChart()) {
    const baseWidth = 1200;
    const baseHeight = 500;
    chartWidth = (baseWidth * this.chart1Zoom) / 100;
    chartHeight = (baseHeight * this.chart1Zoom) / 100;
  } else {
    const baseWidthPerPoint = hasMultiSeries ? 80 : 60;
    const minWidth = 1200;
    const calculatedWidth = Math.max(minWidth, labels.length * baseWidthPerPoint);
    chartWidth = (calculatedWidth * this.chart1Zoom) / 100;
    chartHeight = 500;
  }

  this.barCanvas.nativeElement.width = chartWidth;
  this.barCanvas.nativeElement.height = chartHeight;

  const datalabelsConfig = this.getLabelConfig();

  this.barChart = new Chart(this.barCanvas.nativeElement, {
    type: this.chart1Type as any,
    data: {
      labels,
      datasets
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: this.isPieTypeChart() ? undefined : {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            display: true,
            color: '#6b7280',
            font: {
              family: 'DM Sans',
              size: 12,
              weight: '500'
            },
            padding: 10,
            callback: function(value) {
              if (typeof value === 'number') {
                return value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toFixed(0);
              }
              return value;
            }
          },
          border: {
            display: false
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            autoSkip: false,
            color: '#6b7280',
            font: {
              family: 'DM Sans',
              size: 11,
              weight: '500'
            },
            padding: 8
          },
          border: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            font: {
              family: 'DM Sans',
              size: 13,
              weight: '500'
            },
            color: '#374151',
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            family: 'DM Sans',
            size: 13,
            weight: '600'
          },
          bodyFont: {
            family: 'DM Sans',
            size: 12,
            weight: '400'
          },
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          boxPadding: 6,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || context.parsed;
              let label = context.dataset.label || '';
              
              if (hasMultiSeries || this.isPieTypeChart()) {
                const total = context.dataset.data.reduce((a: any, b: any) => 
                  (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0), 0
                );
                const percentage = ((value / total) * 100).toFixed(1);
                return ` ${label}: ${value.toFixed(2)} (${percentage}%)`;
              }
              
              return ` ${label}: ${value.toFixed(2)}`;
            }
          }
        },
        datalabels: datalabelsConfig
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    },
    plugins: this.labelDisplay !== 'none' ? [this.getDataLabelsPlugin()] : []
  });

  console.log('Chart rendered successfully', {
    type: this.chart1Type,
    dataPoints: labels.length,
    hasMultiSeries: hasMultiSeries,
    aggregation: this.groupMode || 'none',
    dimensions: { width: chartWidth, height: chartHeight }
  });
  }

  onGroupModeChange(mode: 'SUM' | 'AVG' | 'COUNT' | null) {
    this.groupMode = mode;
    if (this.rowData.length && this.selectedX && this.selectedY) {
      this.buildGroupedData();
      setTimeout(() => this.renderChart(), 0);
    }
  }

  onChart1TypeChange() {
    if (this.groupedLabels.length > 0) {
      setTimeout(() => this.renderChart(), 0);
    }
  }

  onTopNChange() {
    if (this.groupedLabels.length > 0 && this.isPieTypeChart()) {
      this.selectTopN();
    }
  }

  onLabelDisplayChange() {
    if (this.groupedLabels.length > 0) {
      this.renderChart();
    }
  }

  onLabelSelectionChange() {
    if (this.groupedLabels.length > 0) {
      this.renderChart();
    }
  }

  selectTopN(): void {
    const pairs = this.groupedLabels.map((label, idx) => ({
      label,
      value: this.groupedValues[idx]
    }));

    pairs.sort((a, b) => b.value - a.value);
    const count = this.topNItems > 0 ? this.topNItems : pairs.length;
    this.selectedLabels = pairs.slice(0, count).map(p => p.label);
    this.renderChart();
  }

  clearSelection(): void {
    this.selectedLabels = [];
    this.barChart?.destroy();
  }

  zoomChart1(direction: 'in' | 'out') {
    if (direction === 'in') {
      this.chart1Zoom = Math.min(200, this.chart1Zoom + 10);
    } else {
      this.chart1Zoom = Math.max(50, this.chart1Zoom - 10);
    }

    if (this.groupedLabels.length > 0) {
      this.renderChart();
    }
  }

  getHeaderName(field: string): string {
    const col = this.colDefs.find(c => c.field === field);
    return col?.headerName || field;
  }

  private generateGradientColors(count: number, ctx: CanvasRenderingContext2D): string[] {
    const colors = [
      { r: 238, g: 73, b: 97 },
      { r: 139, g: 92, b: 246 },
      { r: 59, g: 130, b: 246 },
      { r: 16, g: 185, b: 129 },
      { r: 245, g: 158, b: 11 },
      { r: 236, g: 72, b: 153 },
      { r: 20, g: 184, b: 166 },
      { r: 251, g: 146, b: 60 }
    ];

    return Array.from({ length: count }, (_, i) => {
      const color = colors[i % colors.length];
      return `rgba(${color.r}, ${color.g}, ${color.b}, 0.85)`;
    });
  }

  private getModernColorPalette(count: number): string[] {
    const palette = [
      '#ee4961', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  }

  private createGradientFill(ctx: CanvasRenderingContext2D, color: string, alpha: number): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);
    return gradient;
  }

  private createMultiColorGradient(ctx: CanvasRenderingContext2D, count: number): string[] {
    const baseColors = [
      { r: 238, g: 73, b: 97 },
      { r: 139, g: 92, b: 246 },
      { r: 59, g: 130, b: 246 },
      { r: 16, g: 185, b: 129 },
      { r: 245, g: 158, b: 11 }
    ];

    return Array.from({ length: count }, (_, i) => {
      const colorIndex = Math.floor((i / count) * baseColors.length);
      const color = baseColors[Math.min(colorIndex, baseColors.length - 1)];
      const opacity = 0.7 + (0.3 * (i % 3) / 3);
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
    });
  }

  private getLabelConfig(): any {
    if (this.labelDisplay === 'none') {
      return { display: false };
    }

    const isPie = this.isPieTypeChart();

    return {
      display: true,
      color: isPie ? '#fff' : '#374151',
      font: {
        size: isPie ? 12 : 11,
        weight: '600',
        family: 'DM Sans'
      },
      anchor: isPie ? 'center' : 'end',
      align: isPie ? 'center' : 'top',
      offset: isPie ? 0 : 6,
      padding: 4,
      borderRadius: 4,
      backgroundColor: isPie ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isPie ? 'transparent' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: isPie ? 0 : 1,
      formatter: (value: number, context: any) => {
        const dataset = context.chart.data.datasets[context.datasetIndex];
        const data = dataset.data as number[];
        const total = data.reduce((a: number, b: number) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);

        if (this.labelDisplay === 'value') {
          return value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toFixed(1);
        } else if (this.labelDisplay === 'percentage') {
          return `${percentage}%`;
        } else if (this.labelDisplay === 'both') {
          const displayValue = value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toFixed(1);
          return isPie ? `${displayValue}\n${percentage}%` : `${displayValue} (${percentage}%)`;
        }
        return '';
      }
    };
  }

  private getDataLabelsPlugin(): any {
    return {
      id: 'datalabels',
      afterDatasetsDraw: (chart: any) => {
        if (this.labelDisplay === 'none') return;

        const ctx = chart.ctx;
        const isPie = this.isPieTypeChart();

        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta.hidden) {
            meta.data.forEach((element: any, index: number) => {
              const data = dataset.data[index];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((data / total) * 100).toFixed(1);

              let label = '';
              const displayValue = data >= 1000 ? (data / 1000).toFixed(1) + 'K' : data.toFixed(1);
              
              if (this.labelDisplay === 'value') {
                label = displayValue;
              } else if (this.labelDisplay === 'percentage') {
                label = `${percentage}%`;
              } else if (this.labelDisplay === 'both') {
                label = `${displayValue} (${percentage}%)`;
              }

              ctx.save();

              if (isPie) {
                ctx.fillStyle = '#fff';
                ctx.font = '600 12px DM Sans, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetY = 1;

                const position = element.tooltipPosition();
                ctx.fillText(label, position.x, position.y);
              } else {
                const x = element.x;
                const y = element.y - 18;
                
                ctx.font = '600 11px DM Sans, sans-serif';
                const metrics = ctx.measureText(label);
                const textWidth = metrics.width;
                const padding = 6;
                const boxWidth = textWidth + (padding * 2);
                const boxHeight = 22;

                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetY = 2;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 1;
                
                const boxX = x - (boxWidth / 2);
                const boxY = y - (boxHeight / 2);
                
                const radius = 4;
                ctx.beginPath();
                ctx.moveTo(boxX + radius, boxY);
                ctx.lineTo(boxX + boxWidth - radius, boxY);
                ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
                ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
                ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
                ctx.lineTo(boxX + radius, boxY + boxHeight);
                ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
                ctx.lineTo(boxX, boxY + radius);
                ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                ctx.fillStyle = '#374151';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x, y);
              }

              ctx.restore();
            });
          }
        });
      }
    };
  }
}