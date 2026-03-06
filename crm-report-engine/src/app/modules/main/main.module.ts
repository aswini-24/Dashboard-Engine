import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { ReportEngineCreationPageComponent } from './pages/report-engine-creation-page/report-engine-creation-page.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InputSearchComponent } from 'shared-lib';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MainRoutingModule,
    ReportEngineCreationPageComponent,
    MatInputModule,
    MatFormFieldModule,
    InputSearchComponent,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule
  ]
})
export class MainModule { }
