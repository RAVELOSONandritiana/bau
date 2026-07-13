
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <header class="w-full bg-white border-b border-green-200 shadow-sm sticky top-0 z-50">
      <div class="mx-auto max-w-7xl flex items-center justify-between h-20 px-6 lg:px-20">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253">
              </path>
            </svg>
          </div>
          <div class="flex flex-col">
            <strong class="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors tracking-tight">Bibliothèque Numérique</strong>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Patrimoine Malgache</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-8">
          <a routerLink="/" routerLinkActive="text-green-600 border-green-600" [routerLinkActiveOptions]="{exact: true}"
             class="text-sm font-semibold text-gray-600 hover:text-green-600 transition-all border-b-2 border-transparent py-1 cursor-pointer">
            Accueil
          </a>
          <a routerLink="/collection" routerLinkActive="text-green-600 border-green-600"
             class="text-sm font-semibold text-gray-600 hover:text-green-600 transition-all border-b-2 border-transparent py-1 cursor-pointer">
            Collections
          </a>
          <a [href]="thesesUrl" target="_blank" rel="noopener noreferrer" aria-label="Thèses et mémoire"
             class="text-sm font-semibold text-gray-600 hover:text-green-600 transition-all border-b-2 border-transparent py-1 cursor-pointer">
            Thèses et mémoire
          </a>
          <a [href]="biblioUrl" target="_blank" rel="noopener noreferrer" aria-label="Bibliothèque et Archive Universitaire d'Antananarivo"
             class="text-sm font-semibold text-gray-600 hover:text-green-600 transition-all border-b-2 border-transparent py-1 cursor-pointer">
            Bibliothèque et Archive Universitaire d'Antananarivo
          </a>
          <a routerLink="/help" routerLinkActive="text-green-600 border-green-600"
             class="text-sm font-semibold text-gray-600 hover:text-green-600 transition-all border-b-2 border-transparent py-1 cursor-pointer">
            Aide
          </a>
        </nav>

        <!-- Mobile Menu Toggle -->
        <div class="md:hidden">
          <button (click)="isMenuOpen = !isMenuOpen" class="p-2 text-gray-600 hover:text-green-600 transition-colors">
            <svg *ngIf="!isMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg *ngIf="isMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div *ngIf="isMenuOpen" class="md:hidden bg-white border-t border-gray-100 animate-slideDown">
        <nav class="flex flex-col py-4 px-6 space-y-4 shadow-xl">
          <a routerLink="/" (click)="isMenuOpen = false" routerLinkActive="text-green-600 bg-green-50" [routerLinkActiveOptions]="{exact: true}"
             class="text-base font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-all">
            Accueil
          </a>
          <a routerLink="/collection" (click)="isMenuOpen = false" routerLinkActive="text-green-600 bg-green-50"
             class="text-base font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-all">
            Collections
          </a>
          <a [href]="thesesUrl" target="_blank" rel="noopener noreferrer" (click)="isMenuOpen = false" aria-label="Thèses et mémoire"
             class="text-base font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-all">
            Thèses et mémoire
          </a>
          <a [href]="biblioUrl" target="_blank" rel="noopener noreferrer" (click)="isMenuOpen = false" aria-label="Bibliothèque et Archive Universitaire d'Antananarivo"
             class="text-base font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-all">
            Bibliothèque et Archive Universitaire d'Antananarivo
          </a>
          <a routerLink="/help" (click)="isMenuOpen = false" routerLinkActive="text-green-600 bg-green-50"
             class="text-base font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-all">
            Aide
          </a>
        </nav>
      </div>
    </header>
  `,
    styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slideDown {
      animation: slideDown 0.3s ease-out forwards;
    }
  `]
})
export class HeaderComponent {
    isMenuOpen = false;
    thesesUrl = 'https://biblio.univ-antananarivo.mg/theses';
    biblioUrl = 'https://biblio.univ-antananarivo.mg';
    private router = inject(Router);
}
