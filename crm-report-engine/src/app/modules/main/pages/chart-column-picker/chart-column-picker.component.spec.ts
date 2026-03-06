import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartColumnPickerComponent } from './chart-column-picker.component';

describe('ChartColumnPickerComponent', () => {
  let component: ChartColumnPickerComponent;
  let fixture: ComponentFixture<ChartColumnPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartColumnPickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartColumnPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
