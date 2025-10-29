import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { HistoryComponent } from './pages/history/history.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ApiAnalyticsComponent } from './pages/analytics/api-analytics/api-analytics.component';
import { GeneralAnalyticsComponent } from './pages/analytics/general-analytics/general-analytics.component';
import { ApiRequestComponent } from './features/api-tester/api-request/api-request.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: '', component: HomeComponent, pathMatch: 'full' },
	{ path: 'home', component: HomeComponent },
	{ path: 'about', component: AboutComponent },
	{ path: 'contact', component: ContactComponent },
	{ path: 'history', component: HistoryComponent, canActivate: [authGuard] },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'analytics/api', component: ApiAnalyticsComponent, canActivate: [authGuard] },
	{ path: 'analytics/general', component: GeneralAnalyticsComponent, canActivate: [authGuard] },
	{ path: 'tester', component: ApiRequestComponent, canActivate: [authGuard] },
	{ path: '**', component: NotFoundComponent },
];
