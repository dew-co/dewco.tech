import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-story-details-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './story-details-page.component.html',
})
export class StoryDetailsPageComponent {}
