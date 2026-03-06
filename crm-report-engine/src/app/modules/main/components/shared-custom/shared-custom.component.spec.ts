import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedCustomComponent } from './shared-custom.component';

describe('SharedCustomComponent', () => {
  let component: SharedCustomComponent;
  let fixture: ComponentFixture<SharedCustomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedCustomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
