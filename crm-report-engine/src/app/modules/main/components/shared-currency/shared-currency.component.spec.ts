import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedCurrencyComponent } from './shared-currency.component';

describe('SharedCurrencyComponent', () => {
  let component: SharedCurrencyComponent;
  let fixture: ComponentFixture<SharedCurrencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedCurrencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedCurrencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
