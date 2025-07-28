import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Topic {
  id: number;
  name: string;
  summary: string;
  flashcards: any[];
  quiz: any[];
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  private topicsSubject = new BehaviorSubject<Topic[]>([]);
  public topics$ = this.topicsSubject.asObservable();
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  uploadTopic(file: File): Observable<Topic> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Topic>(`${this.apiUrl}/api/topics/upload`, formData, {
      headers: this.getHeaders(),
    });
  }

  getTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(`${this.apiUrl}/api/topics`, {
      headers: this.getHeaders(),
    });
  }

  getTopicById(id: number): Observable<Topic> {
    return this.http.get<Topic>(`${this.apiUrl}/api/topics/${id}`, {
      headers: this.getHeaders(),
    });
  }

  deleteTopic(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/topics/${id}`, {
      headers: this.getHeaders(),
    });
  }

  loadTopics() {
    this.getTopics().subscribe({
      next: (topics) => {
        this.topicsSubject.next(topics);
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.topicsSubject.next([]);
      },
    });
  }

  addTopic(topic: Topic) {
    const currentTopics = this.topicsSubject.value;
    this.topicsSubject.next([topic, ...currentTopics]);
  }

  removeTopic(topicId: number) {
    const currentTopics = this.topicsSubject.value;
    const updatedTopics = currentTopics.filter((topic) => topic.id !== topicId);
    this.topicsSubject.next(updatedTopics);
  }
}
