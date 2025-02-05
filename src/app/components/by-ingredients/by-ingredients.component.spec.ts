import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ByIngredientsComponent } from './by-ingredients.component';

describe('ByIngredientsComponent', () => {
  let component: ByIngredientsComponent;
  let fixture: ComponentFixture<ByIngredientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ByIngredientsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ByIngredientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
