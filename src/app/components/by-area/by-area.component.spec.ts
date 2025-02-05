import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ByAreaComponent } from './by-area.component';

describe('ByAreaComponent', () => {
  let component: ByAreaComponent;
  let fixture: ComponentFixture<ByAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ByAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ByAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
