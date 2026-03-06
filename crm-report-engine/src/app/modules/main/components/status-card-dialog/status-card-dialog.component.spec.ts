import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusCardDialogComponent } from './status-card-dialog.component';

describe('StatusCardDialogComponent', () => {
  let component: StatusCardDialogComponent;
  let fixture: ComponentFixture<StatusCardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusCardDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
