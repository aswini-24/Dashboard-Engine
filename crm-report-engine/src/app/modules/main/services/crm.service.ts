import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';

export interface ChartConfig {
  rowDataAPI: string;
  selectedX: string;
  selectedY: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea';
  groupMode: 'SUM' | 'AVG' | 'COUNT'; // Added COUNT
  labelDisplay: 'none' | 'value' | 'percentage' | 'both';
  topNItems: number;
  selectedLabels: string[];
  zoom: number;
  groupedLabels: string[];
  groupedValues: number[];
  // New properties for enhanced functionality
  breakdownBy?: string | null;
  compareBy?: string | null;
  additionalFields?: string[];
  breakdownPeriod?: string; // 'year' | 'quarter' | 'month' | 'week' | 'day'
  filterPeriod?: string; // 'this-year-to-last-year' | 'this-month-to-last-month' | etc.
  useFiscalYear?: boolean;
  
  // ADDED: Multi-series data support for breakdown/comparison charts
  multiSeriesLabels?: string[];  // Series names (e.g., ['2023', '2024', '2025'])
  multiSeriesData?: number[][];  // Data for each series (2D array)
}

export interface DashboardWidget extends GridsterItem {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  chartConfig?: ChartConfig;
}

@Injectable({
  providedIn: 'root'
})
export class CrmService {

  rowDataAPI: string = '';
  reportName: string = '';
  selectedReport: any = {};
   private userProfileCache = new Map<string, any>();
  private pendingUserProfileRequests = new Map<string, Promise<any>>();

  private _dashboard: DashboardWidget[] = [];

  constructor(
    private http: HttpClient,
  ) { }

  loadDataFromAPI(loadDataFromAPI) {
    return this.http.post(loadDataFromAPI, {})
    // return this.http.post('/api/leadsV2/getAgLeadList', {});
  }

  createReport(reportConfig) {
    console.log("service reportConfig", reportConfig);
    return this.http.post(`/api/opportunitiesV2/createReportConfig`, {reportConfig: reportConfig});
  }

  updateWidgetChartConfig(widgetId: string, chartConfig: ChartConfig): void {
    const widget = this.dashboard.find(w => w.id === widgetId);
    if (widget) {
      widget.chartConfig = chartConfig;
      
      // Generate a more descriptive title based on configuration
      let titleParts: string[] = [];
      
      // Chart type
      const chartTypeLabel = chartConfig.chartType.charAt(0).toUpperCase() + chartConfig.chartType.slice(1);
      titleParts.push(chartTypeLabel);
      
      // Aggregation mode
      if (chartConfig.groupMode) {
        titleParts.push(`(${chartConfig.groupMode})`);
      }
      
      // Breakdown or comparison
      if (chartConfig.breakdownBy) {
        titleParts.push(`by ${chartConfig.breakdownPeriod || 'period'}`);
      } else if (chartConfig.compareBy) {
        titleParts.push(`comparison`);
      }
      
      widget.title = titleParts.join(' ');
      
      console.log('Updated widget chart config:', widget);
    }
  }

  async getReports(): Promise<any[]> {
    try {
      const result = await this.http.post<any[]>('/api/opportunitiesV2/getReports', {}).toPromise();
      return result || [];
    } catch (err) {
      console.error('Error fetching reports', err);
      return [];
    }
  }

  get dashboard(): DashboardWidget[] {
    return this._dashboard;
  }

  setDashboard(widgets: DashboardWidget[]) {
    this._dashboard = widgets;
  }

  addItem(type: string, title: string, x: number = 0, y: number = 0): void {
    const newItem: DashboardWidget = {
      id: uuidv4(),
      x,
      y,
      cols: 2,
      rows: 2,
      type,
      title
    };
    this._dashboard.push(newItem);
  }

  removeItem(id: string): void {
    const index = this._dashboard.findIndex(item => item.id === id);
    if (index > -1) {
      this._dashboard.splice(index, 1);
    }
  }

  // MODIFY your existing getUserProfileFromDB method
  async getUserProfileFromDB(oid: string): Promise<any> {
    if (!oid) return null;

    // Check cache first
    if (this.userProfileCache.has(oid)) {
      console.log('Cache hit for:', oid);
      return this.userProfileCache.get(oid);
    }

    console.log('⬇️ Cache MISS - Fetching from API:', oid);
    // Check if request is already pending
    if (this.pendingUserProfileRequests.has(oid)) {
      console.log('Request already pending for:', oid);
      return this.pendingUserProfileRequests.get(oid);
    }

    // Make the API call
    const requestPromise = this.http.post('/api/account/getUserProfileFromDB', { oid })
      .toPromise()
      .then(result => {
        const profile = result?.[0] || null;
        this.userProfileCache.set(oid, profile);
        this.pendingUserProfileRequests.delete(oid);
        console.log('Cached profile for:', oid);
        return profile;
      })
      .catch(err => {
        this.pendingUserProfileRequests.delete(oid);
        console.error('Error fetching profile:', oid, err);
        return null;
      });

    this.pendingUserProfileRequests.set(oid, requestPromise);
    return requestPromise;
  }

  // ADD this new method
  async preloadUserProfiles(oids: string[]): Promise<void> {
    const uniqueOids = [...new Set(oids)].filter(oid => 
      oid && !this.userProfileCache.has(oid)
    );

    if (uniqueOids.length === 0) {
      console.log('All profiles already cached');
      return;
    }

    console.log(`Preloading ${uniqueOids.length} user profiles...`);

    try {
      // Fetch all profiles in parallel
      await Promise.all(
        uniqueOids.map(oid => this.getUserProfileFromDB(oid))
      );
      console.log('All profiles preloaded successfully');
    } catch (err) {
      console.error('Failed to preload user profiles:', err);
    }
  }
}
