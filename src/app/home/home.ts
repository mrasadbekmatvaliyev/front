import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  services = [
    { title: 'Veb Dasturlash', description: 'Biz zamonaviy veb-ilovalar yaratamiz.' },
    { title: 'Mobil Ilovalar', description: 'Android va iOS uchun ilovalar ishlab chiqamiz.' },
    { title: 'Konsalting', description: 'IT bo‘yicha maslahat xizmatlari.' }
  ];
}
