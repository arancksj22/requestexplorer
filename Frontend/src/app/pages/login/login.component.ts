import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  showPassword = false;
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  async handleLogin(form: NgForm) {
    if (this.isLoading) return;
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const response = await this.authService.login(this.email, this.password);
      
      if (response.success) {
        // Navigate to return URL or home page
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
        this.router.navigateByUrl(returnUrl);
      } else {
        this.errorMessage = response.message || 'Login failed';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred during login';
    } finally {
      this.isLoading = false;
    }
  }
}
