import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://localhost:3000/api/auth';
  
  // Reactive state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = this.getToken();
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch {
        this.logout();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
  }

  private setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/register`, { email, password, name })
      );
      
      if (response.success && response.token && response.user) {
        this.setToken(response.token);
        this.setUser(response.user);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.error || 'Registration failed'
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      );
      
      if (response.success && response.token && response.user) {
        this.setToken(response.token);
        this.setUser(response.user);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.error?.error || 'Login failed'
      };
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await firstValueFrom(
          this.http.post(`${this.baseUrl}/logout`, {})
        );
      } catch {
        // Ignore logout errors
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticated.set(false);
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ valid: boolean; user?: User }>(`${this.baseUrl}/verify`)
      );
      
      if (response.valid && response.user) {
        this.setUser(response.user);
        return true;
      }
      
      this.logout();
      return false;
    } catch {
      this.logout();
      return false;
    }
  }
}
