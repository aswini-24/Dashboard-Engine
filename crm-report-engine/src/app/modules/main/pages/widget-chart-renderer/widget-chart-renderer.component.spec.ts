import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetChartRendererComponent } from './widget-chart-renderer.component';

describe('WidgetChartRendererComponent', () => {
  let component: WidgetChartRendererComponent;
  let fixture: ComponentFixture<WidgetChartRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetChartRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WidgetChartRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
