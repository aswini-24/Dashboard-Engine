import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportEngineCreationPageComponent } from './report-engine-creation-page.component';

describe('ReportEngineCreationPageComponent', () => {
  let component: ReportEngineCreationPageComponent;
  let fixture: ComponentFixture<ReportEngineCreationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportEngineCreationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportEngineCreationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
