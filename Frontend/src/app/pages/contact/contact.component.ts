import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  private http = inject(HttpClient);

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  async handleSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const response = await fetch('http://localhost:3000/api/contact/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.formData)
      });

      const data = await response.json();

      if (response.ok) {
        this.successMessage = 'Message sent successfully! We\'ll get back to you soon.';
        // Reset form
        this.formData = {
          name: '',
          email: '',
          subject: '',
          message: ''
        };
        form.resetForm();
      } else {
        this.errorMessage = data.message || 'Failed to send message. Please try again.';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.errorMessage = 'An error occurred. Please try again later.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
