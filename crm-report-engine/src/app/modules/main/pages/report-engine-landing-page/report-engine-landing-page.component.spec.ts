import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportEngineLandingPageComponent } from './report-engine-landing-page.component';

describe('ReportEngineLandingPageComponent', () => {
  let component: ReportEngineLandingPageComponent;
  let fixture: ComponentFixture<ReportEngineLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportEngineLandingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportEngineLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
