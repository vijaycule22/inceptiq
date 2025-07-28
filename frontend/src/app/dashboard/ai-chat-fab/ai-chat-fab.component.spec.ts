import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatFabComponent } from './ai-chat-fab.component';

describe('AiChatFabComponent', () => {
  let component: AiChatFabComponent;
  let fixture: ComponentFixture<AiChatFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatFabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiChatFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
