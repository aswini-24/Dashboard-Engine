import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent, GridsterItemComponent, GridsterConfig, GridType, DisplayGrid } from 'angular-gridster2';
import { CrmService, DashboardWidget } from '../../services/crm.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ChartColumnPickerComponent } from '../chart-column-picker/chart-column-picker.component';
import { RouterModule } from '@angular/router';
import { WidgetChartRendererComponent } from '../widget-chart-renderer/widget-chart-renderer.component';

@Component({
  selector: 'app-report-engine-creation-page-v2',
  standalone: true,
  imports: [
    CommonModule, 
    GridsterComponent, 
    GridsterItemComponent, 
    RouterModule,
    WidgetChartRendererComponent
  ],
  templateUrl: './report-engine-creation-page-v2.component.html',
  styleUrl: './report-engine-creation-page-v2.component.scss'
})
export class ReportEngineCreationPageV2Component {
  reportService = inject(CrmService);
  router = inject(Router);
  options: GridsterConfig = {};
  dashboard: DashboardWidget[] = [];
  isComponentsPanelOpen = false;
  dialog = inject(MatDialog);

  // Space indicator properties
  showSpaceIndicator = false;
  spaceUsedPercentage = 0;
  widthUsedPercentage = 0;
  heightUsedPercentage = 0;

  availableComponents = [
    { type: 'ag-grid', label: 'Grid', icon: 'grid_on' },
    { type: 'chart', label: 'Chart', icon: 'pie_chart' },
  ];

  ngOnInit(): void {
    this.dashboard = this.reportService.dashboard;

    this.options = {
      gridType: GridType.Fixed,
      fixedColWidth: 100,
      fixedRowHeight: 100,
      margin: 10,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
      outerMarginBottom: null,
      outerMarginLeft: null,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      minCols: 10,
      maxCols: 100,
      minRows: 10,
      maxRows: 100,
      maxItemCols: 100,
      minItemCols: 1,
      maxItemRows: 100,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 1,
      defaultItemRows: 1,
      displayGrid: DisplayGrid.Always,
      draggable: {
        enabled: true,
        ignoreContentClass: 'gridster-item-content',
        dragHandleClass: 'drag-handler',
        start: () => {
          this.onDragResizeStart();
        },
        stop: () => {
          this.onDragResizeStop();
        }
      },
      resizable: {
        enabled: true,
        start: () => {
          this.onDragResizeStart();
        },
        stop: () => {
          this.onDragResizeStop();
        }
      },
      itemChangeCallback: () => {
        this.calculateSpaceUsage();
      },
      pushItems: true,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: false,
      swap: false,
    };
  }

  // Calculate space usage percentage
  calculateSpaceUsage(): void {
    if (this.dashboard.length === 0) {
      this.spaceUsedPercentage = 0;
      this.widthUsedPercentage = 0;
      this.heightUsedPercentage = 0;
      return;
    }

    const gridsterElement = document.querySelector('gridster');
    let visibleCols = this.options.minCols || 10;
    let visibleRows = this.options.minRows || 10;
    
    if (gridsterElement) {
      const width = gridsterElement.clientWidth;
      const height = gridsterElement.clientHeight;
      const colWidth = this.options.fixedColWidth || 100;
      const rowHeight = this.options.fixedRowHeight || 100;
      const margin = this.options.margin || 10;
      
      visibleCols = Math.floor(width / (colWidth + margin));
      visibleRows = Math.floor(height / (rowHeight + margin));
    }

    if (this.options.maxCols !== visibleCols) {
      this.options.maxCols = visibleCols;
      this.options.api?.optionsChanged?.();
    }

    const fixedGridWidth = visibleCols;
    
    let maxRowReached = 0;
    const occupiedCells = new Set<string>();

    this.dashboard.forEach(item => {
      const cols = item.cols || this.options.defaultItemCols || 1;
      const rows = item.rows || this.options.defaultItemRows || 1;
      const x = item.x || 0;
      const y = item.y || 0;
      
      const bottomEdge = y + rows;
      if (bottomEdge > maxRowReached) {
        maxRowReached = bottomEdge;
      }
      
      for (let col = x; col < x + cols && col < fixedGridWidth; col++) {
        for (let row = y; row < y + rows; row++) {
          occupiedCells.add(`${col},${row}`);
        }
      }
    });

    const columnsUsed = new Set<number>();
    this.dashboard.forEach(item => {
      const x = item.x || 0;
      const cols = item.cols || this.options.defaultItemCols || 1;
      for (let col = x; col < x + cols && col < fixedGridWidth; col++) {
        columnsUsed.add(col);
      }
    });
    
    this.widthUsedPercentage = Math.round((columnsUsed.size / fixedGridWidth) * 100);
    
    const rawHeightPercentage = (maxRowReached / visibleRows) * 100;
    this.heightUsedPercentage = Math.round(rawHeightPercentage);
    
    const actualGridArea = fixedGridWidth * Math.max(maxRowReached, visibleRows);
    this.spaceUsedPercentage = Math.round((occupiedCells.size / actualGridArea) * 100);
  }

  onDragResizeStart(): void {
    this.showSpaceIndicator = true;
    this.calculateSpaceUsage();
  }

  onDragResizeStop(): void {
    setTimeout(() => {
      this.showSpaceIndicator = false;
    }, 1000);
  }

  getSpaceIndicatorClass(): string {
    if (this.spaceUsedPercentage < 50) return 'low';
    if (this.spaceUsedPercentage < 80) return 'medium';
    return 'high';
  }

  onDragStart(event: DragEvent, component: any): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(component));
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('text/plain');
      if (data) {
        const component = JSON.parse(data);
        this.reportService.addItem(component.type, component.label);
        this.calculateSpaceUsage();
      }
    }
  }

  removeItem(event: MouseEvent, item: DashboardWidget): void {
    event.preventDefault();
    event.stopPropagation();
    this.reportService.removeItem(item.id);
    this.calculateSpaceUsage();
  }

  toggleComponentsPanel(): void {
    this.isComponentsPanelOpen = !this.isComponentsPanelOpen;
  }

  openChartColumnPicker(event: MouseEvent, item: DashboardWidget): void {
    event.preventDefault();
    event.stopPropagation();

    const dialogRef = this.dialog.open(ChartColumnPickerComponent, {
      width: 'auto',
      minWidth: '500px',
      maxWidth: '680px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-chart-dialog',
      disableClose: false,
      data: {
        widget: item
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.api) {
        console.log('Selected API:', result.api);

        this.router.navigate(['main/crmreportengine/columns-chart'], {
          queryParams: { 
            api: result.api,
            widgetId: item.id
          }
        });
      }
    });
  }

  // UPDATED METHOD: Edit existing chart configuration with full state preservation
  editChart(event: MouseEvent, item: DashboardWidget): void {
    event.preventDefault();
    event.stopPropagation();

    if (item.chartConfig) {
      console.log('Editing chart with config:', item.chartConfig);
      
      // Navigate to chart page with complete configuration state
      this.router.navigate(['main/crmreportengine/columns-chart'], {
        queryParams: { 
          api: item.chartConfig.rowDataAPI,
          widgetId: item.id,
          // Pass the configuration state as a serialized object
          editMode: 'true'
        },
        // Pass the full chart config via router state (preferred for complex objects)
        state: {
          chartConfig: item.chartConfig,
          widget: item
        }
      });
    } else {
      // Fallback to picker if no config
      this.openChartColumnPicker(event, item);
    }
  }
}