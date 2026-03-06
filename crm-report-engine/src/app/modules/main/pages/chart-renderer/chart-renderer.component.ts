import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { CrmService, ChartConfig } from '../../services/crm.service';

@Component({
  selector: 'app-chart-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-renderer">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    .chart-renderer {
      width: 100%;
      height: 100%;
      position: relative;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class ChartRendererComponent
  implements AfterViewInit, OnChanges {

  @Input() config!: ChartConfig;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private dataCache: any[] = [];

  constructor(private crmService: CrmService) {}

  ngAfterViewInit(): void {
    this.fetchAndRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.fetchAndRender();
    }
  }

  private fetchAndRender(): void {
    if (!this.config?.rowDataAPI) return;

    this.crmService.loadDataFromAPI(this.config.rowDataAPI).subscribe({
      next: (res: any) => {
        this.dataCache = Array.isArray(res?.messData) ? res.messData : [];
        this.renderChart();
      },
      error: () => {
        this.dataCache = [];
        this.destroyChart();
      }
    });
  }

  private renderChart(): void {
    if (!this.canvas || this.dataCache.length === 0) return;

    this.destroyChart();

    const groupMap = new Map<string, number[]>();

    for (const row of this.dataCache) {
      const key = String(row?.[this.config.selectedX]);
      const value = Number(row?.[this.config.selectedY]) || 0;

      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(value);
    }

    const labels = Array.from(groupMap.keys());

    const values = labels.map(label => {
      const nums = groupMap.get(label)!;
      const sum = nums.reduce((a, b) => a + b, 0);

      switch (this.config.groupMode) {
        case 'AVG':
          return sum / nums.length;
        case 'COUNT':
          return nums.length;
        default:
          return sum; // SUM
      }
    });

    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.config.chartType,
      data: {
        labels,
        datasets: [{
          data: values,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
