import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import {
  AiStudyAssistantService,
  ChatMessage,
  StudySuggestion,
} from '../../services/ai-study-assistant.service';
import { TopicService } from '../../services/topic.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-chat-fab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ScrollPanelModule,
    TooltipModule,
    BadgeModule,
  ],
  templateUrl: './ai-chat-fab.component.html',
  styleUrl: './ai-chat-fab.component.css',
})
export class AiChatFabComponent implements OnInit, OnDestroy {
  @Input() currentTopic: string = '';
  @Input() currentPanel: string = '';
  @Input() currentContent: string = '';

  isOpen = false;
  isModalOpen = false;
  isLoading = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  suggestions: StudySuggestion[] = [];
  unreadCount = 0;
  private subscription = new Subscription();

  constructor(
    private aiAssistant: AiStudyAssistantService,
    private topicService: TopicService
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.aiAssistant.isOpen$.subscribe((isOpen) => {
        this.isOpen = isOpen;
        if (isOpen) {
          this.updateContext();
        }
      })
    );

    this.subscription.add(
      this.aiAssistant.messages$.subscribe((messages) => {
        this.messages = messages;
        this.unreadCount = messages.filter(
          (m) => m.sender === 'ai' && !m.read
        ).length;
      })
    );

    this.subscription.add(
      this.aiAssistant.isLoading$.subscribe((isLoading) => {
        this.isLoading = isLoading;
      })
    );

    // Update context when component inputs change
    this.updateContext();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges() {
    this.updateContext();
  }

  private updateContext() {
    if (this.currentTopic) {
      this.aiAssistant.updateContext(
        this.currentTopic,
        this.currentPanel,
        this.currentContent
      );
      this.suggestions = this.aiAssistant.getStudySuggestions(
        this.currentTopic
      );
    }
  }

  toggleChat() {
    this.aiAssistant.toggleChat();
  }

  closeChat() {
    this.aiAssistant.closeChat();
    this.isModalOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
    this.isOpen = true;
    this.aiAssistant.openChat();
  }

  closeModal() {
    this.isModalOpen = false;
    this.aiAssistant.closeChat();
  }

  minimizeModal() {
    this.isModalOpen = false;
    // Keep the chat open in floating mode
    this.aiAssistant.openChat();
  }

  sendMessage(message?: string) {
    const messageToSend = message || this.newMessage.trim();
    if (messageToSend) {
      this.aiAssistant.sendMessage(messageToSend, {
        topic: this.currentTopic,
        panel: this.currentPanel,
        currentContent: this.currentContent,
      });
      if (!message) {
        this.newMessage = '';
      }
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectSuggestion(suggestion: StudySuggestion) {
    const message = `I'd like to ${suggestion.title.toLowerCase()}. Can you help me with that?`;
    this.aiAssistant.sendMessage(message, {
      topic: this.currentTopic,
      panel: this.currentPanel,
      currentContent: this.currentContent,
    });
  }

  clearChat() {
    this.aiAssistant.clearChat();
  }

  formatMessage(content: string): string {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  getMessageClass(message: ChatMessage): string {
    const baseClass = 'flex gap-3 p-3 rounded-lg transition-all duration-200';
    return message.sender === 'user'
      ? `${baseClass} bg-blue-500 text-white ml-8`
      : `${baseClass} bg-gray-100 text-gray-800 mr-8`;
  }

  getModalMessageClass(message: ChatMessage): string {
    const baseClass = 'flex gap-4 p-6 rounded-2xl transition-all duration-200';
    return message.sender === 'user'
      ? `${baseClass} bg-blue-500 text-white ml-12`
      : `${baseClass} bg-gray-100 text-gray-800 mr-12`;
  }

  getTimeString(date: Date): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
