import { Component, OnInit, ChangeDetectorRef, OnDestroy, PLATFORM_ID, inject, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule, Params } from '@angular/router';
import { SearchService } from '../services/search/search';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DecodetitlePipe } from '../pipe/decodetitle-pipe';

import { HeaderComponent } from '../../components/header/header';
import { LoaderComponent } from '../../components/loader/loader';
import { ScrollAnimationDirective } from '../../directives/scroll-animation.directive';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [HeaderComponent, FormsModule, CommonModule, RouterModule, DecodetitlePipe, LoaderComponent, ScrollAnimationDirective],
  templateUrl: './result.html'
})
export class Result implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private BookService: SearchService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  books: any[] = [];
  loading = true;
  error: string | null = null;
  totalResults = 0;
  perPage = 10;
  totalPages = 0;

  filterValue = '';
  filterCriteria = 'title';
  filteredBooks: any[] = [];

  isCollectionContext = false;
  collectionName = '';

  Math = Math;
  totalItems = 0;
  itemsPerPage = 10;
  paginationVisible = false;

  showDescriptionPopup = false;
  selectedBook: any = null;
  showImagePopup = false;
  selectedImageUrl = '';
  selectedImageTitle = '';
  sortBy = 'title-asc';

  get paginatedBooks(): any[] {
    return this.filteredBooks;
  }

  getShortDescription(book: any): string {
    const full = this.getFullDescription(book);
    if (!full) return '';
    return full.length > 120 ? full.substring(0, 120) + '...' : full;
  }

  getFullDescription(book: any): string {
    if (book.description) {
      return book.description.trim();
    }
    if (book.subject && Array.isArray(book.subject) && book.subject.length > 0) {
      return book.subject.join(', ');
    }
    return '';
  }

  slugify(text: string): string {
    if (!text) return 'document';
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  encryptUrl(url: string): string {
    const encoded = encodeURIComponent(url);
    return btoa(encoded);
  }

  getCollection(book: any): string {
    return book.collection || book.source || 'fonds-grandidier';
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.preventRightClick();
      this.preventDevTools();
    }
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([params, queryParams]: [Params, Params]) => {
      if (params['collection']) {
        this.isCollectionContext = true;
        this.collectionName = params['collection'];
      } else {
        this.isCollectionContext = false;
        this.collectionName = '';
      }
      this.loadData(queryParams);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:contextmenu', ['$event'])
  disableRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isBrowser) return;
    
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

  preventRightClick() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  preventDevTools() {
    if (typeof window === 'undefined') {
      return;
    }
    
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || 
          window.outerHeight - window.innerHeight > threshold) {
        // DevTools detected
      }
    };
    
    setInterval(checkDevTools, 1000);
  }

  loadData(queryParams: any) {
    this.loading = true;
    this.cdr.detectChanges();

    // Si on est dans une collection, on force le source
    const searchParams = { ...queryParams };
    if (this.isCollectionContext) {
      searchParams['source'] = this.collectionName;
    }

    // S'assurer que le paramètre page est bien présent
    if (!searchParams['page']) {
      searchParams['page'] = '1';
    }

    this.BookService.getData(searchParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.books = data.docs;
          this.totalResults = data.totalResults;
          this.totalItems = data.totalResults;
          this.itemsPerPage = queryParams['limit'] ? parseInt(queryParams['limit'], 10) : 10;
          this.totalPages = Math.ceil(this.totalResults / this.itemsPerPage);
          this.paginationVisible = this.totalPages > 1;
          this.applyFilter();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Une erreur est survenue lors du chargement des données.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onFilterChange() {
    this.applyFilter();
  }

  handleFilterCriteriaChange(criteria: string) {
    this.filterCriteria = criteria;
    this.applyFilter();
  }

  handleSortChange(value: string) {
    this.sortBy = value;
    this.applySort();
  }

  applySort() {
    if (!this.filteredBooks || this.filteredBooks.length === 0) return;

    const [field, order] = this.sortBy.split('-');
    const multiplier = order === 'asc' ? 1 : -1;

    this.filteredBooks.sort((a, b) => {
      let valA, valB;

      if (field === 'title') {
        valA = a.title || '';
        valB = b.title || '';
      } else if (field === 'author') {
        valA = a.author_name?.[0] || '';
        valB = b.author_name?.[0] || '';
      } else if (field === 'year') {
        valA = a.first_publish_year || 0;
        valB = b.first_publish_year || 0;
      }

      if (valA < valB) return -1 * multiplier;
      if (valA > valB) return 1 * multiplier;
      return 0;
    });

    this.cdr.detectChanges();
  }

  applyFilter() {
    if (!this.filterValue) {
      this.filteredBooks = [...this.books];
      return;
    }

    const searchChar = this.filterValue.toLowerCase();
    this.filteredBooks = this.books.filter(book => {
      const valueToSearch = this.filterCriteria === 'title' ? book.title :
        this.filterCriteria === 'author' ? book.author_name?.join(', ') :
          this.getFullDescription(book);
      return valueToSearch?.toLowerCase().includes(searchChar);
    });
    this.applySort();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getCurrentPageFromUrl(): number {
    return parseInt(this.route.snapshot.queryParams['page'] || '1', 10);
  }

  openDescriptionPopup(book: any) {
    this.selectedBook = book;
    this.showDescriptionPopup = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeDescriptionPopup() {
    this.showDescriptionPopup = false;
    this.selectedBook = null;
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }

  openImagePopup(url: string, title?: string) {
    this.selectedImageUrl = url;
    this.selectedImageTitle = title || '';
    this.showImagePopup = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeImagePopup() {
    this.showImagePopup = false;
    this.selectedImageUrl = '';
    this.selectedImageTitle = '';
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
  }
}