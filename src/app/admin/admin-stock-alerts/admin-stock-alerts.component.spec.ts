import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStockAlertsComponent } from './admin-stock-alerts.component';

describe('AdminStockAlertsComponent', () => {
  let component: AdminStockAlertsComponent;
  let fixture: ComponentFixture<AdminStockAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStockAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminStockAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
