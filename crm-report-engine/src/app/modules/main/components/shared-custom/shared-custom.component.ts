import { Component, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { UserProfileComponent, CurrencyComponent } from '../../../../../../../shared-lib/src/public-api';

@Component({
  selector: 'app-shared-custom',
  standalone: true,
  imports: [CommonModule, CurrencyComponent, UserProfileComponent],
  templateUrl: './shared-custom.component.html',
  styleUrl: './shared-custom.component.scss',
  // Use OnPush for better performance with AG Grid
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedCustomComponent implements ICellRendererAngularComp, OnChanges {
  customComponentType: any = '';
  params: ICellRendererParams<any, any, any>;
  currency_code: string = '';
  fieldValue: any;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  agInit(params: ICellRendererParams): void {
    this.params = params;
    
    // Clone the currency list to avoid shared state between rows
    const rawValue = params.data?.[params['field']];
    if (this.params['custom'] === 'curr' && Array.isArray(rawValue)) {
      // Deep clone the currency array so each row has its own state
      this.fieldValue = rawValue.map(item => ({...item}));
    } else {
      this.fieldValue = rawValue;
    }
    
    this.customComponentType = params['custom'];
    
    // Mark for check to ensure rendering
    this.cdr.markForCheck();
  }
  
  refresh(params: ICellRendererParams): boolean {
    // Update the params and field value
    this.params = params;
    
    const rawValue = params.data?.[params['field']];
    if (this.params['custom'] === 'curr' && Array.isArray(rawValue)) {
      // Deep clone the currency array
      this.fieldValue = rawValue.map(item => ({...item}));
    } else {
      this.fieldValue = rawValue;
    }
    
    // Trigger change detection
    this.cdr.markForCheck();
    
    // Return true to tell ag-grid that refresh was successful
    return true;
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.params) {
      this.updateCurrencyCode();
    }
  }
  
  private updateCurrencyCode(): void {
    // You can add currency code logic here if needed
    // For now, it will use the default from tenant settings
    this.cdr.markForCheck();
  }
}