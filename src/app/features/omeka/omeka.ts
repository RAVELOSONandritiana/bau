import { Component, OnInit, ChangeDetectorRef, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../services/search/search';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../../components/header/header';
import { LoaderComponent } from '../../components/loader/loader';

@Component({
  selector: 'app-omeka',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, HeaderComponent, LoaderComponent],
  templateUrl: './omeka.html'
})
export class Omeka implements OnInit, OnDestroy {
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
  filtered: any[] = [];
  paginatedBooks: any[] = [];
  loading = false;

  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageBeforeFilter = 1;
  isFiltering = false;
  paginationVisible = false;
  originalTotalItems = 0;
  originalTotalPages = 0;

  currentQueryParams: any = {};
  sortBy: string = 'title-asc';
  collectionName: string = '';

  Math = Math;

  showDescriptionPopup = false;
  selectedBook: any = null;

  filterCriteria: string = 'title';
  filterValue: string = '';
  filterTimeout: any;

  private bodyScrollPosition = 0;

  filterByText(value: string) {
    this.filterValue = value;

    if (value.trim() === '') {
      if (this.isFiltering) {
        this.filtered = [...this.books];
        this.sortBooks();
        this.totalItems = this.filtered.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.totalItems = this.originalTotalItems;
        this.totalPages = this.originalTotalPages;

        // Mettre à jour la pagination sans recharger depuis l'API
        const currentPage = Math.min(this.pageBeforeFilter, this.totalPages) || 1;
        this.updatePaginatedBooks();

        // Mettre à jour l'URL sans déclencher de rechargement
        this.updateUrlWithoutReload(currentPage);

        this.isFiltering = false;

        // Forcer la mise à jour de la pagination après suppression du filtre
        this.cdr.detectChanges();
      }
    } else {
      if (!this.isFiltering) {
        this.pageBeforeFilter = this.getCurrentPageFromUrl();
        this.isFiltering = true;
      }

      this.filtered = this.books.filter(item => {
        const searchValue = value.toLowerCase();

        switch (this.filterCriteria) {
          case 'title':
            return item.title?.toLowerCase().includes(searchValue);

          case 'description':
            const description = this.getFullDescription(item);
            return description.toLowerCase().includes(searchValue);

          case 'author':
            return item.author_name?.some((author: string) =>
              author.toLowerCase().includes(searchValue)
            );

          case 'year':
            return item.first_publish_year?.toString().includes(searchValue);

          default:
            return false;
        }
      });

      this.sortBooks();
      this.totalItems = this.filtered.length;
      this.totalPages = Math.ceil(this.filtered.length / this.itemsPerPage);
      this.totalItems = this.originalTotalItems;
      this.totalPages = this.originalTotalPages;
      const currentPage = 1;

      // Mettre à jour l'URL sans recharger la page
      this.updateUrlWithoutReload(currentPage);
    }
    this.updatePaginatedBooks();
  }

  onFilterChange() {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.filterByText(this.filterValue);
    }, 500);
  }

  submitFilter() {
    if (this.filterValue.trim() !== '') {
      this.filterByText(this.filterValue);
      this.updatePaginatedBooks();
      this.cdr.detectChanges();
      this.updateUrlWithFilterAndCriteria(1, this.filterValue, this.filterCriteria);
    } else {
      // Si le champ est vide, réinitialiser les résultats
      this.filtered = [...this.books];
      this.sortBooks();
      this.totalItems = this.filtered.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.totalItems = this.originalTotalItems;
      this.totalPages = this.originalTotalPages;
      this.updatePaginatedBooks();
      this.cdr.detectChanges();
      this.updateUrl(1);
    }
  }

  handleFilterCriteriaChange(criteria: string) {
    this.filterCriteria = criteria;
    if (this.filterValue.trim() !== '') {
      this.filterByText(this.filterValue);
    }
  }

  handleSortChange(value: string) {
    this.sortBy = value;
    this.sortBooks();
    const currentPage = 1;
    this.updatePaginatedBooks();
  }

  sortBooks() {
    const [field, order] = this.sortBy.split('-');

    this.filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (field === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
      } else if (field === 'author') {
        valA = (a.author_name?.[0] || '').toLowerCase();
        valB = (b.author_name?.[0] || '').toLowerCase();
      } else if (field === 'year') {
        valA = a.first_publish_year || 0;
        valB = b.first_publish_year || 0;
      }

      if (order === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }

  updatePaginatedBooks() {
    const currentPage = this.getCurrentPageFromUrl();
    const startIndex = (currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBooks = this.filtered.slice(startIndex, endIndex);

    // Vérifier si paginatedBooks est vide et si filtered contient des livres
    if (this.paginatedBooks.length === 0 && this.filtered.length > 0) {
      // Si c'est le cas, réinitialiser currentPage à 1
      const newCurrentPage = 1;
      // Recalculer les livres paginés
      const newStartIndex = (newCurrentPage - 1) * this.itemsPerPage;
      const newEndIndex = newStartIndex + this.itemsPerPage;
      this.paginatedBooks = this.filtered.slice(newStartIndex, newEndIndex);
    }

    this.cdr.detectChanges();
    this.cdr.detectChanges();
  }


  getCurrentPageFromUrl(): number {
    const queryParams = this.route.snapshot.queryParams;
    return queryParams['page'] ? parseInt(queryParams['page'], 10) : 1;
  }

  private updateUrl(page: number) {
    const queryParams = { ...this.currentQueryParams, page: page };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private updateUrlWithFilter(page: number, filterValue: string) {
    const queryParams = {
      ...this.currentQueryParams,
      page: page,
      filterCriteria: this.filterCriteria,
      filterValue: filterValue
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private updateUrlWithFilterAndCriteria(page: number, filterValue: string, filterCriteria: string) {
    const queryParams = {
      ...this.currentQueryParams,
      page: page,
      filterCriteria: filterCriteria,
      filterValue: filterValue
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private updateUrlWithoutReload(page: number) {
    const queryParams = {
      ...this.currentQueryParams,
      page: page,
      filterCriteria: this.filterCriteria,
      filterValue: this.filterValue
    };

    // Supprimer la source * de l'URL si elle est présente
    if (queryParams.source && queryParams.source === '*') {
      delete queryParams.source;
    }

    // Supprimer filterCriteria et filterValue s'ils sont vides ou non utilisés
    if (!queryParams.filterValue || queryParams.filterValue.trim() === '') {
      delete queryParams.filterCriteria;
      delete queryParams.filterValue;
    }

    if (this.isBrowser) {
      const newUrl = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: queryParams,
        queryParamsHandling: 'merge'
      }).toString();

      window.history.replaceState({}, '', newUrl);
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    // Réinitialiser le filtre de texte
    this.filterValue = '';

    // Mettre à jour l'URL avec les paramètres directement
    const queryParams = { ...this.currentQueryParams, page: page };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    // Charger les données uniquement pour la page actuelle
    this.loadDataForPage(this.currentQueryParams, page);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPaginationRange(): number[] {
    const range: number[] = [];
    const delta = 2;
    const currentPage = this.getCurrentPageFromUrl();
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(this.totalPages - 1, currentPage + delta);

    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      range.push(1);

      if (rangeStart > 2) {
        range.push(-1);
      }

      for (let i = rangeStart; i <= rangeEnd; i++) {
        range.push(i);
      }

      if (rangeEnd < this.totalPages - 1) {
        range.push(-1);
      }

      range.push(this.totalPages);
    }

    return range;
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

  encryptUrl(url: string): string {
    const encoded = encodeURIComponent(url);
    return btoa(encoded);
  }

  storePdfData(book: any, encryptedUrl: string) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pdfViewerData', JSON.stringify({
        book: book,
        fileUrl: encryptedUrl,
        title: book.title
      }));
    }
  }

  decryptUrl(encryptedUrl: string): string {
    const decoded = atob(encryptedUrl);
    return decodeURIComponent(decoded);
  }

  getFilename(url: string | null): string {
    if (!url) return 'document';
    const parts = url.split('/');
    const filenameWithExt = parts[parts.length - 1];
    return filenameWithExt.replace(/\.pdf$/i, '');
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

  openDescriptionPopup(book: any) {
    this.selectedBook = book;
    this.showDescriptionPopup = true;

    this.bodyScrollPosition = window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.bodyScrollPosition}px`;
    document.body.style.width = '100%';

    // Ajouter la description du livre à l'URL pour le SEO sans déclencher de rafraîchissement
    const bookDescription = this.getFullDescription(book);
    const bookDetails = {
      bookId: book.key,
      bookDescription: bookDescription
    };

    // Utiliser Location pour mettre à jour l'URL sans recharger la page
    if (this.isBrowser) {
      const newUrl = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: {
          ...this.currentQueryParams,
          ...bookDetails
        },
        queryParamsHandling: 'merge'
      }).toString();

      // Utiliser Location pour éviter le rafraîchissement
      window.history.replaceState({}, '', newUrl);
    }
  }

  closeDescriptionPopup() {
    this.showDescriptionPopup = false;
    this.selectedBook = null;

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, this.bodyScrollPosition);

    // Supprimer les détails du livre de l'URL sans recharger la page
    if (this.isBrowser) {
      const queryParams = { ...this.route.snapshot.queryParams };
      delete queryParams['bookId'];
      delete queryParams['bookDescription'];

      const newUrl = this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: queryParams,
        queryParamsHandling: 'merge'
      }).toString();

      window.history.replaceState({}, '', newUrl);
    }
  }

  private loadData(params: any) {
    // Ne charger les données que côté navigateur
    if (!this.isBrowser) {
      return;
    }

    const { limit, ...apiParams } = params;
    this.currentQueryParams = params;
    this.itemsPerPage = limit ? parseInt(limit, 10) : 10;

    // Réinitialiser TOUT l'état
    this.loading = true;
    this.books = [];
    this.filtered = [];
    this.paginatedBooks = [];
    this.isFiltering = false;
    this.filterValue = '';
    this.sortBy = 'title-asc';

    this.cdr.detectChanges();

    apiParams['limit'] = limit || 10;

    // Charger les données pour la page actuelle
    this.BookService.getData(apiParams).subscribe({
      next: (res) => {
        this.books = res.docs || [];
        this.filtered = [...this.books];
        this.sortBooks();
        this.totalItems = res.totalResults || this.filtered.length;
        this.originalTotalItems = this.totalItems;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.originalTotalPages = this.totalPages;
        this.paginationVisible = this.totalPages > 1;

        // Vérifier si currentPage est valide
        const currentPage = this.getCurrentPageFromUrl();
        if (currentPage > this.totalPages) {
          const newCurrentPage = this.totalPages;
        }

        this.updatePaginatedBooks();
        this.loading = false;

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.books = [];
        this.filtered = [];
        this.paginatedBooks = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadDataForPage(params: any, page: number) {
    // Ne charger les données que côté navigateur
    if (!this.isBrowser) {
      return;
    }

    const { limit, ...apiParams } = params;
    this.currentQueryParams = params;
    this.itemsPerPage = limit ? parseInt(limit, 10) : 10;

    this.loading = true;
    this.cdr.detectChanges();

    apiParams['limit'] = limit || 10;
    apiParams['page'] = page;

    // Charger les données pour la page actuelle
    this.BookService.getData(apiParams).subscribe({
      next: (res) => {
        this.books = res.docs || [];
        this.filtered = [...this.books];
        this.sortBooks();
        this.totalItems = res.totalResults || this.filtered.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        // Mettre à jour currentPage avec la page actuelle
        const currentPage = page;

        // Vérifier si currentPage est valide
        if (currentPage > this.totalPages) {
          const newCurrentPage = this.totalPages;
        }

        this.updatePaginatedBooks();
        this.loading = false;
        this.cdr.detectChanges();

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.books = [];
        this.filtered = [];
        this.paginatedBooks = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadDataSync(params: any) {
    const { limit, ...apiParams } = params;
    this.currentQueryParams = params;
    this.itemsPerPage = limit ? parseInt(limit, 10) : 10;

    // Réinitialiser TOUT l'état
    this.loading = true;
    this.books = [];
    this.filtered = [];
    this.paginatedBooks = [];
    this.isFiltering = false;
    this.filterValue = '';
    this.sortBy = 'title-asc';

    this.cdr.detectChanges();

    apiParams['limit'] = limit || 10;

    this.BookService.getData(apiParams).subscribe({
      next: (res) => {
        this.books = res.docs || [];
        this.filtered = [...this.books];
        this.sortBooks();
        this.totalItems = res.totalResults || this.filtered.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.updatePaginatedBooks();
        this.loading = false;

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.books = [];
        this.filtered = [];
        this.paginatedBooks = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    // Récupérer le nom de la collection depuis l'URL
    this.collectionName = this.route.snapshot.paramMap.get('collection') || 'P.A.MA.L';

    // Charger les données initiales (serveur ET navigateur)
    const initialParams = this.route.snapshot.queryParams;
    let decryptedParams = initialParams;

    // Initialiser currentPage à partir des paramètres
    if ((decryptedParams as any)['page']) {
      const currentPage = parseInt((decryptedParams as any)['page'], 10);
    }

    // Appliquer les filtres depuis l'URL si présents
    if ((decryptedParams as any)['filterCriteria']) {
      this.filterCriteria = (decryptedParams as any)['filterCriteria'];
    }
    if ((decryptedParams as any)['filterValue']) {
      this.filterValue = (decryptedParams as any)['filterValue'];
    }

    if (Object.keys(decryptedParams).length > 0) {
      this.loadData(decryptedParams);
    }

    // Ne s'abonner aux changements que côté navigateur
    if (!this.isBrowser) {
      return;
    }

    // Écouter TOUS les changements de query params (seulement côté navigateur)
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, curr) => {
          const prevStr = JSON.stringify(prev);
          const currStr = JSON.stringify(curr);
          const isSame = prevStr === currStr;
          return isSame;
        })
      )
      .subscribe(params => {
        let currentParams: any = params;

        // Mettre à jour currentPage à partir des paramètres
        if (currentParams['page']) {
          const currentPage = parseInt(currentParams['page'], 10);
        }

        // Appliquer les filtres depuis l'URL si présents
        if (currentParams['filterCriteria']) {
          this.filterCriteria = currentParams['filterCriteria'];
        }
        if (currentParams['filterValue']) {
          this.filterValue = currentParams['filterValue'];
          if (this.filterValue.trim() !== '') {
            this.filterByText(this.filterValue);
          }
        }

        if (Object.keys(currentParams).length > 0) {
          this.loadDataForPage(currentParams, currentParams['page']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}