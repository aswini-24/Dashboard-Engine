import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportEngineCreationPageV2Component } from './report-engine-creation-page-v2.component';

describe('ReportEngineCreationPageV2Component', () => {
  let component: ReportEngineCreationPageV2Component;
  let fixture: ComponentFixture<ReportEngineCreationPageV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportEngineCreationPageV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportEngineCreationPageV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
