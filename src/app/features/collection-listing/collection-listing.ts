
import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Collection, CollectionService } from '../services/collection.service';
import { SearchService } from '../services/search/search';
import { forkJoin } from 'rxjs';
import { HeaderComponent } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { LoaderComponent } from '../../components/loader/loader';
import { ScrollAnimationDirective } from '../../directives/scroll-animation.directive';

@Component({
  selector: 'app-collection-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, Footer, LoaderComponent, ScrollAnimationDirective],
  template: `
    <app-header></app-header>
    <div class="min-h-screen bg-[#fafafa] selection:bg-green-100 font-sans" (contextmenu)="disableRightClick($event)">
      <!-- Background Decorations -->
      <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-green-100 rounded-full blur-[100px] opacity-40"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto py-16 px-6 lg:px-20">
        <!-- Header -->
        <div class="text-center mb-16 space-y-4" appScrollAnimation animationType="fade-up">
          <div class="inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium mb-2 transform transition-all hover:scale-105">
            <span class="relative flex h-2 w-2 mr-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Patrimoine Numérique
          </div>
          <h1 class="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">
            Nos <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Collections</span>
          </h1>
          <p class="max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed font-light">
            Plongez dans l'histoire à travers nos fonds documentaires exclusifs. 
            Une immersion totale dans la culture et le savoir de Madagascar.
          </p>
        </div>

        @if (loading) {
          <div class="flex flex-col items-center justify-center py-20 min-h-[40vh]">
            <app-loader message="Chargement des collections..."></app-loader>
          </div>
        } @else {
          <!-- Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let collection of collections; let i = index" 
                 (click)="selectCollection(collection)"
                 class="group relative bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 cursor-pointer overflow-hidden border border-gray-100/80 transform hover:-translate-y-2 flex flex-col items-stretch h-full"
                 appScrollAnimation 
                 animationType="fade-up" 
                 [animationDelay]="i * 100">
              
              <div class="relative h-64 overflow-hidden">
                <img [src]="collection.image" [alt]="collection.label" loading="lazy"
                     class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 select-none pointer-events-none"
                     draggable="false">
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                
                <!-- Badge -->
                <div class="absolute top-4 right-4">
                  <div [class]="collection.color + ' text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transform transition-all group-hover:rotate-3 group-hover:scale-110'">
                     {{ collection.count }} documents
                  </div>
                </div>

                <!-- Title in Image -->
                <div class="absolute bottom-6 left-6 right-6">
                  <h3 class="text-2xl font-bold text-white drop-shadow-md">
                    {{ collection.label }}
                  </h3>
                </div>
              </div>
              
              <div class="p-8 flex flex-col flex-grow bg-white">
                <p class="text-gray-600 text-base leading-relaxed mb-6 font-normal line-clamp-3">
                  {{ collection.description }}
                </p>
                
                <div class="mt-auto flex items-center justify-between">
                  <span class="text-sm font-semibold text-green-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                    {{ collection.isExternal ? 'Visiter le portail' : 'Découvrir la collection' }}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  
                  <div class="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-white transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
      :host {
        display: block;
      }
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `]
})
export class CollectionListing implements OnInit {
  private router = inject(Router);
  private collectionService = inject(CollectionService);
  private searchService = inject(SearchService);
  private cdr = inject(ChangeDetectorRef);

  collections = this.collectionService.getCollections();
  loading = true;

  @HostListener('document:contextmenu', ['$event'])
  disableRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Disable F12
    if (event.key === 'F12') {
      event.preventDefault();
    }
    // Disable Ctrl+Shift+I (Developer Tools)
    if (event.ctrlKey && event.shiftKey && event.key === 'I') {
      event.preventDefault();
    }
    // Disable Ctrl+Shift+J (Console)
    if (event.ctrlKey && event.shiftKey && event.key === 'J') {
      event.preventDefault();
    }
    // Disable Ctrl+Shift+C (Inspector)
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault();
    }
    // Disable Ctrl+U (View Source)
    if (event.ctrlKey && event.key === 'u') {
      event.preventDefault();
    }
  }

  ngOnInit() {
    this.preventDevTools();
    this.fetchCollectionCounts();
  }

  preventDevTools() {
    // Skip in SSR/Node.js environment where window is not defined
    if (typeof window === 'undefined') {
      return;
    }
    
    // Detect DevTools by measuring element dimensions
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || 
          window.outerHeight - window.innerHeight > threshold) {
        // DevTools is open - could take action here
        console.log('Developer tools detected');
      }
    };
    
    // Check periodically
    setInterval(checkDevTools, 1000);
  }

  fetchCollectionCounts() {
    this.loading = true;
    const requests = this.collections.map(coll =>
      this.searchService.getTotalItems({ source: coll.value })
    );

    forkJoin(requests).subscribe({
      next: (counts) => {
        counts.forEach((count, index) => {
          this.collections[index].count = count;
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement des nombres de documents:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectCollection(collection: Collection) {
    if (collection.isExternal && collection.link) {
      window.open(collection.link, '_blank', 'noopener,noreferrer');
      return;
    }

    this.router.navigate(['/collection', collection.value, 'result'], { queryParams: { limit: 6 } });
  }
}
