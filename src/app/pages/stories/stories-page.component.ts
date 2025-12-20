import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stories-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stories-page.component.html',
})
export class StoriesPageComponent {}
