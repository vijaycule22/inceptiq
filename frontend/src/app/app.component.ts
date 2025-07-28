import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GamificationService } from './services/gamification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'InceptIQ';

  constructor(private gamificationService: GamificationService) {}

  ngOnInit() {
    // Check if there's localStorage data to migrate
    const hasLocalStorageData = localStorage.getItem('inceptiq_user_stats');
    if (hasLocalStorageData) {
      console.log(
        'Found localStorage gamification data, will migrate when user is authenticated...'
      );
      // Migration will be handled by the gamification service when user logs in
    }
  }
}
