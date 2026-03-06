import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ChartConfig } from '../../services/crm.service';

@Component({
  selector: 'app-widget-chart-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-renderer-container" #container>
      @if (chartConfig) {
        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <button class="zoom-btn" (click)="zoomOut()" title="Zoom Out">
            <span class="material-icons-outlined">zoom_out</span>
          </button>
          <span class="zoom-level">{{zoomLevel}}%</span>
          <button class="zoom-btn" (click)="zoomIn()" title="Zoom In">
            <span class="material-icons-outlined">zoom_in</span>
          </button>
          <button class="zoom-btn" (click)="resetZoom()" title="Reset Zoom">
            <span class="material-icons-outlined">refresh</span>
          </button>
        </div>

        <div class="chart-scroll-wrapper" #scrollWrapper>
          <div class="chart-canvas-wrapper" [style.width.px]="canvasWidth" [style.height.px]="canvasHeight">
            <canvas #chartCanvas></canvas>
          </div>
        </div>
      } @else {
        <div class="no-chart-message">
          <p>No chart configured</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-renderer-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: transparent;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.95);
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
      z-index: 10;
    }

    .zoom-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'DM Sans', sans-serif;

      &:hover {
        background: #f3f4f6;
        border-color: #ee4961;
        color: #ee4961;
      }

      &:active {
        transform: scale(0.95);
      }

      .material-icons-outlined {
        font-size: 18px;
      }
    }

    .zoom-level {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      font-family: 'DM Sans', sans-serif;
      min-width: 45px;
      text-align: center;
    }

    .chart-scroll-wrapper {
      flex: 1;
      overflow: auto;
      width: 100%;
      height: 100%;
      min-height: 0;
      position: relative;
      
      /* Beautiful scrollbar */
      &::-webkit-scrollbar {
        height: 10px;
        width: 10px;
      }

      &::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 5px;
      }

      &::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #ee4961, #d63e54);
        border-radius: 5px;
        border: 2px solid #f3f4f6;

        &:hover {
          background: linear-gradient(135deg, #d63e54, #c12d43);
        }
      }

      &::-webkit-scrollbar-corner {
        background: #f3f4f6;
      }
    }

    .chart-canvas-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      min-width: 100%;
      min-height: 100%;
    }

    canvas {
      display: block;
    }

    .no-chart-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #9ca3af;
      font-size: 14px;
      font-family: "DM Sans", sans-serif;
      text-align: center;
      padding: 20px;
    }
  `]
})
export class WidgetChartRendererComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() chartConfig?: ChartConfig;
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('container') container?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollWrapper') scrollWrapper?: ElementRef<HTMLDivElement>;
  
  private chart?: Chart;
  private resizeObserver?: ResizeObserver;
  private renderTimeout?: any;
  
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  zoomLevel: number = 100;
  private baseWidth: number = 0;
  private baseHeight: number = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    
    if (this.chartConfig) {
      this.scheduleRender();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartConfig']) {
      if (!changes['chartConfig'].firstChange) {
        this.zoomLevel = 100; // Reset zoom on config change
        this.scheduleRender();
      }
    }
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(300, this.zoomLevel + 25);
    this.applyZoom();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(50, this.zoomLevel - 25);
    this.applyZoom();
  }

  resetZoom(): void {
    this.zoomLevel = 100;
    this.applyZoom();
  }

  private applyZoom(): void {
    if (this.baseWidth && this.baseHeight) {
      this.canvasWidth = Math.round(this.baseWidth * (this.zoomLevel / 100));
      this.canvasHeight = Math.round(this.baseHeight * (this.zoomLevel / 100));
      this.cdr.detectChanges();
      this.scheduleRender(50);
    }
  }

  private setupResizeObserver(): void {
    if (!this.container?.nativeElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleRender(300);
    });

    this.resizeObserver.observe(this.container.nativeElement);
  }

  private scheduleRender(delay: number = 100): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }

    this.renderTimeout = setTimeout(() => {
      this.renderChart();
    }, delay);
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement || !this.chartConfig) {
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    const container = this.container?.nativeElement;

    if (!container) {
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }

    // Get container dimensions (subtract zoom controls height)
    const zoomControlsHeight = 48;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - zoomControlsHeight;

    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    const isPieType = ['pie', 'doughnut', 'polarArea'].includes(this.chartConfig.chartType);

    let labels: string[];
    let datasets: any[];
    let allValues: number[] = [];

    // Check if we have multi-series data (breakdown/comparison)
    const hasMultiSeries = this.chartConfig.multiSeriesLabels && 
                          this.chartConfig.multiSeriesLabels.length > 0 && 
                          this.chartConfig.multiSeriesData && 
                          this.chartConfig.multiSeriesData.length > 0;

    const ctx = canvas.getContext('2d')!;

    if (isPieType) {
      // Pie charts don't support multi-series
      if (this.chartConfig.selectedLabels?.length > 0) {
        labels = this.chartConfig.selectedLabels;
        const values = labels.map(label => {
          const idx = this.chartConfig!.groupedLabels.indexOf(label);
          return idx >= 0 ? this.chartConfig!.groupedValues[idx] : 0;
        });

        const pairs = labels.map((label, idx) => ({ label, value: values[idx] }));
        pairs.sort((a, b) => b.value - a.value);
        labels = pairs.map(p => p.label);
        const sortedValues = pairs.map(p => p.value);
        allValues = sortedValues;

        datasets = [{
          label: this.getYAxisLabel(),
          data: sortedValues,
          backgroundColor: this.generateGradientColors(sortedValues.length),
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 2,
          hoverOffset: 10,
          hoverBorderWidth: 3
        }];
      } else {
        labels = this.chartConfig.groupedLabels;
        allValues = this.chartConfig.groupedValues;
        
        datasets = [{
          label: this.getYAxisLabel(),
          data: allValues,
          backgroundColor: this.generateGradientColors(allValues.length),
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 2,
          hoverOffset: 10,
          hoverBorderWidth: 3
        }];
      }
    } else if (hasMultiSeries) {
      // Multi-series chart (breakdown/comparison)
      labels = this.chartConfig.groupedLabels;
      const colorPalette = this.getModernColorPalette(this.chartConfig.multiSeriesLabels!.length);
      
      datasets = this.chartConfig.multiSeriesLabels!.map((seriesLabel, idx) => {
        const data = this.chartConfig!.multiSeriesData![idx];
        const color = colorPalette[idx];
        
        allValues.push(...data);
        
        return {
          label: seriesLabel,
          data: data,
          backgroundColor: this.chartConfig!.chartType === 'line' 
            ? this.createGradientFill(ctx, color, 0.2, containerHeight)
            : color,
          borderColor: color,
          borderWidth: 2,
          tension: this.chartConfig!.chartType === 'line' ? 0.4 : undefined,
          fill: this.chartConfig!.chartType === 'line' ? true : undefined,
          pointRadius: this.chartConfig!.chartType === 'line' ? 4 : undefined,
          pointHoverRadius: this.chartConfig!.chartType === 'line' ? 6 : undefined,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: color,
          pointHoverBorderWidth: 3,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        };
      });
    } else {
      // Single series chart
      labels = this.chartConfig.groupedLabels;
      const values = this.chartConfig.groupedValues;
      allValues = values;
      
      const gradient = this.createMultiColorGradient(values.length);

      datasets = [{
        label: this.getYAxisLabel(),
        data: values,
        backgroundColor: this.chartConfig.chartType === 'line'
          ? this.createGradientFill(ctx, '#ee4961', 0.2, containerHeight)
          : gradient,
        borderColor: this.chartConfig.chartType === 'line' ? '#ee4961' : 'rgba(238, 73, 97, 0.8)',
        borderWidth: 2,
        tension: this.chartConfig.chartType === 'line' ? 0.4 : undefined,
        fill: this.chartConfig.chartType === 'line' ? true : undefined,
        pointRadius: this.chartConfig.chartType === 'line' ? 4 : undefined,
        pointHoverRadius: this.chartConfig.chartType === 'line' ? 6 : undefined,
        pointBackgroundColor: '#ee4961',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ee4961',
        pointHoverBorderWidth: 3,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }];
    }

    if (!labels || labels.length === 0) {
      return;
    }

    // Calculate base canvas dimensions with much better spacing
    let baseChartWidth: number;
    let baseChartHeight: number;

    if (isPieType) {
      // Pie charts: Use most of available space
      const padding = 40;
      const size = Math.min(containerWidth - padding, containerHeight - padding);
      baseChartWidth = Math.max(300, size);
      baseChartHeight = baseChartWidth;
    } else {
      // Bar/Line charts: Give MUCH more space per data point
      const dataPointCount = labels.length;
      
      // Calculate optimal spacing based on number of data points
      let pointWidth: number;
      if (dataPointCount > 200) {
        pointWidth = 40; // Very compressed for massive datasets
      } else if (dataPointCount > 100) {
        pointWidth = 60; // Compressed for large datasets
      } else if (dataPointCount > 50) {
        pointWidth = 80; // Medium spacing
      } else {
        pointWidth = hasMultiSeries ? 100 : 80; // Comfortable spacing
      }
      
      // Calculate width: ensure minimum visibility
      const minWidth = containerWidth - 40;
      const optimalWidth = dataPointCount * pointWidth;
      baseChartWidth = Math.max(minWidth, optimalWidth);
      
      // Height should be generous
      baseChartHeight = Math.max(400, containerHeight - 40);
    }

    // Store base dimensions
    this.baseWidth = baseChartWidth;
    this.baseHeight = baseChartHeight;

    // Apply zoom
    const chartWidth = Math.round(baseChartWidth * (this.zoomLevel / 100));
    const chartHeight = Math.round(baseChartHeight * (this.zoomLevel / 100));

    // Update wrapper dimensions
    this.canvasWidth = chartWidth;
    this.canvasHeight = chartHeight;

    // Set canvas dimensions
    canvas.width = chartWidth;
    canvas.height = chartHeight;

    // Calculate responsive font sizes based on zoom
    const zoomFactor = this.zoomLevel / 100;
    const baseFontSize = Math.max(10, Math.min(14, (containerHeight / 30) * zoomFactor));
    const labelFontSize = Math.max(10, Math.min(13, (containerHeight / 35) * zoomFactor));
    const legendFontSize = Math.max(11, Math.min(14, (containerHeight / 30) * zoomFactor));

    // Trigger change detection
    this.cdr.detectChanges();

    try {
      this.chart = new Chart(canvas, {
        type: this.chartConfig.chartType as any,
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
          layout: {
            padding: {
              top: isPieType ? 15 : 25,
              bottom: 15,
              left: 15,
              right: 15
            }
          },
          scales: isPieType ? undefined : {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.06)',
                drawBorder: false,
                lineWidth: 1
              },
              ticks: {
                display: true,
                color: '#6b7280',
                font: {
                  family: 'DM Sans',
                  size: baseFontSize,
                  weight: '500'
                },
                padding: 10,
                callback: function(value) {
                  if (typeof value === 'number') {
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                    return value.toFixed(0);
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
                autoSkip: true,
                // Show more labels when zoomed in
                maxTicksLimit: Math.max(15, Math.floor((chartWidth / 100) * (this.zoomLevel / 100))),
                color: '#6b7280',
                font: {
                  family: 'DM Sans',
                  size: labelFontSize,
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
                  size: legendFontSize,
                  weight: '600'
                },
                color: '#374151',
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 10,
                boxHeight: 10
              }
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 14,
              cornerRadius: 8,
              titleFont: {
                family: 'DM Sans',
                size: baseFontSize + 2,
                weight: '600'
              },
              bodyFont: {
                family: 'DM Sans',
                size: baseFontSize,
                weight: '400'
              },
              displayColors: true,
              boxWidth: 12,
              boxHeight: 12,
              boxPadding: 8,
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y || context.parsed;
                  let label = context.dataset.label || '';
                  
                  if (hasMultiSeries || isPieType) {
                    const total = context.dataset.data.reduce((a: any, b: any) => 
                      (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0), 0
                    );
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    return ` ${label}: ${value.toFixed(2)} (${percentage}%)`;
                  }
                  
                  return ` ${label}: ${value.toFixed(2)}`;
                }
              }
            }
          },
          animation: {
            duration: 600,
            easing: 'easeInOutQuart'
          }
        }
      });

      console.log('Widget chart rendered', {
        type: this.chartConfig.chartType,
        baseSize: { width: baseChartWidth, height: baseChartHeight },
        actualSize: { width: chartWidth, height: chartHeight },
        dataPoints: labels.length,
        zoomLevel: this.zoomLevel,
        multiSeries: hasMultiSeries
      });
    } catch (error) {
      console.error('Failed to render widget chart:', error);
    }
  }

  private getYAxisLabel(): string {
    if (!this.chartConfig?.selectedY) return '';
    return `(${this.chartConfig.groupMode}) ${this.chartConfig.selectedY}`;
  }

  private generateGradientColors(count: number): string[] {
    const colors = [
      { r: 238, g: 73, b: 97 },   // Red
      { r: 139, g: 92, b: 246 },  // Purple
      { r: 59, g: 130, b: 246 },  // Blue
      { r: 16, g: 185, b: 129 },  // Green
      { r: 245, g: 158, b: 11 },  // Orange
      { r: 236, g: 72, b: 153 },  // Pink
      { r: 20, g: 184, b: 166 },  // Teal
      { r: 251, g: 146, b: 60 }   // Amber
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

  private createGradientFill(ctx: CanvasRenderingContext2D, color: string, alpha: number, height: number): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.05)`);
    return gradient;
  }

  private createMultiColorGradient(count: number): string[] {
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
      const opacity = 0.75 + (0.2 * (i % 3) / 3);
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
    });
  }

  ngOnDestroy(): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}