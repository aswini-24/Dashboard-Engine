export interface ComponentConfig {
  id: string;
  type: ComponentType;
  name: string;
  icon: string;
}

export type ComponentType = 
  | 'ag-grid' 
  | 'pie-chart' 
  | 'line-chart' 
  | 'bar-chart' 
  | 'kpi-tile' 
  | 'text-block' 
  | 'image';

export interface GridsterItemComponent {
  x: number;
  y: number;
  rows: number;
  cols: number;
  type: ComponentType;
  id: string;
  data?: any;
}

