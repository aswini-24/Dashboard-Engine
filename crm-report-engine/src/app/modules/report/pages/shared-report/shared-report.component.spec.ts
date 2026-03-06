import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedReportComponent } from './shared-report.component';

describe('SharedReportComponent', () => {
  let component: SharedReportComponent;
  let fixture: ComponentFixture<SharedReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
