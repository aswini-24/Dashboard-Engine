import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { trigger, style, transition, animate } from '@angular/animations';

interface RecentApi {
  id: string;
  name: string;
  path: string;
  lastUsed?: Date;
  category?: string;
}

type ApiMode = 'new' | 'recent';

@Component({
  selector: 'app-chart-column-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, MatButton],
  templateUrl: './chart-column-picker.component.html',
  styleUrls: ['./chart-column-picker.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ChartColumnPickerComponent implements OnInit {

  rowDataAPI = '';
  selectedMode: ApiMode = 'new';
  selectedRecentApi: RecentApi | null = null;
  recentApis: RecentApi[] = [];
  isLoading = false;

  private readonly STORAGE_KEY = 'chart_recent_apis';

  constructor(
    private dialogRef: MatDialogRef<ChartColumnPickerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadRecentApis();
  }

  /* =======================
     LocalStorage Handling
     ======================= */

  loadRecentApis(): void {
    this.isLoading = true;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    const parsed: any[] = stored ? JSON.parse(stored) : [];

    this.recentApis = parsed.map(api => ({
      ...api,
      lastUsed: api.lastUsed ? new Date(api.lastUsed) : undefined
    }));

    this.isLoading = false;
  }

  saveRecentApi(path: string): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const apis: RecentApi[] = stored ? JSON.parse(stored) : [];

    const name = this.extractApiName(path);

    const newApi: RecentApi = {
      id: crypto.randomUUID(),
      name,
      path,
      lastUsed: new Date(),
      category: 'Custom'
    };

    const updated = [
      newApi,
      ...apis.filter(api => api.path !== path)
    ].slice(0, 10); // keep last 10

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  extractApiName(path: string): string {
    const clean = path.split('?')[0];
    return clean.substring(clean.lastIndexOf('/') + 1) || 'Unnamed API';
  }

  /* =======================
     UI Actions
     ======================= */

  switchMode(mode: ApiMode): void {
    if (this.selectedMode === mode) return;

    this.selectedMode = mode;
    this.rowDataAPI = '';
    this.selectedRecentApi = null;
  }

  selectRecentApi(api: RecentApi): void {
    this.selectedRecentApi = api;
  }

  canProceed(): boolean {
    return this.selectedMode === 'new'
      ? this.rowDataAPI.trim().length > 0
      : this.selectedRecentApi !== null;
  }

  getApiPath(): string {
    return this.selectedMode === 'new'
      ? this.rowDataAPI.trim()
      : this.selectedRecentApi?.path || '';
  }

  proceed(): void {
    const apiPath = this.getApiPath();
    if (!apiPath) return;

    if (this.selectedMode === 'new') {
      this.saveRecentApi(apiPath);
    }

    this.dialogRef.close({
      api: apiPath,
      mode: this.selectedMode,
      apiDetails: this.selectedMode === 'recent' ? this.selectedRecentApi : null
    });
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  /* =======================
     Helpers
     ======================= */

  formatLastUsed(date?: Date): string {
    if (!date) return '';

    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  getCategoryColor(category?: string): string {
    const colors: Record<string, string> = {
      Sales: '#10b981',
      Analytics: '#8b5cf6',
      CRM: '#f59e0b',
      Operations: '#3b82f6',
      Marketing: '#ec4899',
      Custom: '#6b7280'
    };
    return colors[category || 'Custom'];
  }

  trackByApiId(index: number, api: RecentApi): string {
    return api.id;
  }
}
