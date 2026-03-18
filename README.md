# Request Explorer

**Request Explorer** is a high-performance, full-stack platform designed for developers to build, test, and manage API requests with precision. By combining a responsive **Angular** frontend with a modular **Node.js** backend, it provides a seamless interface for debugging network traffic, organizing request collections, and analyzing API performance.

## Project Overview

Request Explorer goes beyond simple request sending. It is an integrated environment that offers:
* **Stateless Security:** Robust user authentication and session management via JWT.
* **Persistent Collections:** Organized storage for frequently used requests categorized by folders.
* **Comprehensive History:** Automated logging of every request with performance metrics (latency, status codes).
* **Deep Analytics:** Visualized insights into API usage patterns and response times.

## System Architecture

The project is architected as a decoupled client-server system:

1.  **Frontend (Angular):** A sophisticated SPA (Single Page Application) providing a dynamic dashboard, real-time feedback, and interactive request building.
2.  **Backend (Node.js/Express):** A modular RESTful API handling business logic, authentication, and secure communication with the database.
3.  **Database (MySQL):** A relational schema designed for high-integrity storage of users, history, and saved request structures.



## Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | Angular, RxJS, TypeScript, Angular CLI |
| **Backend** | Node.js, Express.js |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt.js |
| **Database** | MySQL |
| **DevOps** | Docker (Optional), NPM |

---

## Getting Started

### Prerequisites
-   **Node.js** (v14 or higher)
-   **MySQL** (v5.7 or higher)
-   **Angular CLI** (`npm install -g @angular/cli`)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   npm install
