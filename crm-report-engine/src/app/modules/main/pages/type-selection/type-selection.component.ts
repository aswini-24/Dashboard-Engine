import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-type-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './type-selection.component.html',
  styleUrls: ['./type-selection.component.scss']
})
export class TypeSelectionComponent {
  onStartWithPlainLanguage(): void {
    console.log('Start with Plain Language clicked');
    // Add your navigation or logic here
  }

  onConnectAPI(): void {
    console.log('Connect API clicked');
    // Add your navigation or logic here
  }

  onConfigureDatabase(): void {
    console.log('Configure Database clicked');
    // Add your navigation or logic here
  }
}