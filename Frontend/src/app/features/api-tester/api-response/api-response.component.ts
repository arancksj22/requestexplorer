import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiResponseDto } from '../api.service';

@Component({
  selector: 'app-api-response',
  imports: [CommonModule],
  templateUrl: './api-response.component.html',
  styleUrl: './api-response.component.css'
})
export class ApiResponseComponent {
  @Input() response!: ApiResponseDto;
}
