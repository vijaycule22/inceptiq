import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashcardsCarouselComponent } from './flashcards-carousel.component';

describe('FlashcardsCarouselComponent', () => {
  let component: FlashcardsCarouselComponent;
  let fixture: ComponentFixture<FlashcardsCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlashcardsCarouselComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlashcardsCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
