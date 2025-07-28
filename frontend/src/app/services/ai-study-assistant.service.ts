import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion' | 'explanation' | 'study_tip';
  read?: boolean;
  context?: {
    topic?: string;
    panel?: string;
    currentContent?: string;
  };
}

export interface StudySuggestion {
  type: 'flashcard' | 'quiz' | 'summary' | 'review';
  title: string;
  description: string;
  action: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiStudyAssistantService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private currentContext = {
    topic: '',
    panel: '',
    currentContent: '',
  };

  constructor(private http: HttpClient) {
    this.initializeWelcomeMessage();
  }

  private initializeWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      content:
        "Hello! I'm your AI Study Assistant. I can help you with:\n\n• Explaining concepts from your topics\n• Creating study strategies\n• Answering questions about your content\n• Providing study tips and techniques\n\nWhat would you like to learn about today?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  public openChat() {
    this.isOpenSubject.next(true);
  }

  public closeChat() {
    this.isOpenSubject.next(false);
  }

  public toggleChat() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  public sendMessage(content: string, context?: any) {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      context: context || this.currentContext,
    };

    this.addMessage(userMessage);
    this.generateAIResponse(content, context);
  }

  public updateContext(topic: string, panel: string, content: string = '') {
    this.currentContext = { topic, panel, currentContent: content };
  }

  private async generateAIResponse(userMessage: string, context?: any) {
    this.isLoadingSubject.next(true);

    try {
      const response = await this.http
        .post(`${environment.apiUrl}/ai/chat`, {
          message: userMessage,
          context: context || this.currentContext,
        })
        .toPromise();

      const aiMessage: ChatMessage = {
        id: this.generateId(),
        content:
          (response as any).response ||
          "I apologize, but I couldn't generate a response at this time.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        context: context || this.currentContext,
      };

      this.addMessage(aiMessage);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
      };
      this.addMessage(errorMessage);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  public getStudySuggestions(topic: string): StudySuggestion[] {
    return [
      {
        type: 'flashcard',
        title: 'Review Flashcards',
        description: 'Test your memory with interactive flashcards',
        action: 'Go to Flashcards',
      },
      {
        type: 'quiz',
        title: 'Take a Quiz',
        description: 'Challenge yourself with questions',
        action: 'Start Quiz',
      },
      {
        type: 'summary',
        title: 'Read Summary',
        description: 'Review the key points',
        action: 'View Summary',
      },
      {
        type: 'review',
        title: 'Study Tips',
        description: 'Get personalized study advice',
        action: 'Get Tips',
      },
    ];
  }

  public addStudyTip(tip: string) {
    const tipMessage: ChatMessage = {
      id: this.generateId(),
      content: `💡 **Study Tip**: ${tip}`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'study_tip',
    };
    this.addMessage(tipMessage);
  }

  public addExplanation(concept: string, explanation: string) {
    const explanationMessage: ChatMessage = {
      id: this.generateId(),
      content: `📚 **${concept}**: ${explanation}`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'explanation',
    };
    this.addMessage(explanationMessage);
  }

  private addMessage(message: ChatMessage) {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public clearChat() {
    this.messagesSubject.next([]);
    this.initializeWelcomeMessage();
  }

  public getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }
}
