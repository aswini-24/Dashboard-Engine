import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSharedReportsComponent } from './all-shared-reports.component';

describe('AllSharedReportsComponent', () => {
  let component: AllSharedReportsComponent;
  let fixture: ComponentFixture<AllSharedReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSharedReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSharedReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
