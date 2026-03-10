import { CommonModule } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { CollectionService } from '../services/collection.service';

import { HeaderComponent } from '../../components/header/header';
import { ScrollAnimationDirective } from '../../directives/scroll-animation.directive';

@Component({
  selector: 'app-search',
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, ScrollAnimationDirective, RouterLink],
  templateUrl: './search.html',
  standalone: true
})
export class Search implements OnInit {
  form!: FormGroup;
  minYear = 1000;
  maxYear = new Date().getFullYear();
  sources: any[] = [];
  selectedSourceDescription: string | null = null;
  private isBrowser: boolean;
  isLoading = false;
  errorMessage: string | null = null;
  isCollectionContext = false;
  collectionName = '';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private collectionService: CollectionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.form = this.fb.group({
      q: [''],
      title: [''],
      author: [''],
      subject: [''],
      yearStart: [''],
      yearEnd: [''],
      source: ['all'],
      limit: [6]
    });
  }

  limits = [6, 9, 12, 18, 24, 48];
  currentYear = new Date().getFullYear();

  ngOnInit() {
    // Initialiser les sources (sera écrasé si on est en contexte collection)
    if (this.isBrowser) {
      this.fetchSources();
    } else {
      this.initializeStaticSources();
    }

    this.form.get('source')?.valueChanges.subscribe((value) => {
      this.updateSourceDescription(value);
      // Réinitialiser les champs de recherche avancée lorsque la source change
      this.resetAdvancedFields(value);
    });

    this.route.params.subscribe(params => {
      if (params['collection']) {
        this.isCollectionContext = true;
        this.collectionName = params['collection'];
        // Forcer la source du formulaire à la collection actuelle
        this.form.patchValue({ source: this.collectionName }, { emitEvent: true });
      }
    });
  }

  ionViewWillEnter() {
    if (this.isBrowser) {
      this.fetchSources();
    }
  }

  private initializeStaticSources() {
    this.fetchSources();
  }

  fetchSources(forceRefresh = false) {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const allSource = {
        value: 'all',
        label: 'Toutes les bases',
        description: 'Rechercher dans toutes les bases de données disponibles.'
      };

      if (this.collectionService && typeof this.collectionService.getCollections === 'function') {
        const collections = this.collectionService.getCollections();
        this.sources = [allSource, ...collections];
      } else {
        this.sources = [allSource];
      }
    } catch (e) {
      this.sources = [{ value: 'all', label: 'Toutes les bases', description: '' }];
    }

    this.isLoading = false;
    this.updateSourceDescription(this.form.get('source')?.value || 'all');
  }

  updateSourceDescription(sourceValue: string) {
    const selectedSource = this.sources.find(source => source.value === sourceValue);
    this.selectedSourceDescription = selectedSource ? selectedSource.description : null;
  }

  refreshSources() {
    this.fetchSources(true);
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    // Préparer les paramètres de recherche
    let searchParams = { ...this.form.value };

    // Si on est dans une collection, on retire 'source' des queryParams 
    // car il est déjà dans le path de l'URL
    if (this.isCollectionContext) {
      delete searchParams.source;
    }

    const cleanedParams = Object.fromEntries(
      Object.entries(searchParams).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ''
      )
    );

    if (this.isCollectionContext) {
      this.router.navigate(['./result'], {
        relativeTo: this.route,
        queryParams: cleanedParams
      });
    } else {
      this.router.navigate(['/result'], {
        queryParams: cleanedParams
      });
    }
  }

  reset() {
    this.form.reset({
      q: '',
      title: '',
      author: '',
      subject: '',
      yearStart: '',
      yearEnd: '',
      source: this.isCollectionContext ? this.collectionName : 'all',
      limit: 6
    });
    this.updateSourceDescription(this.isCollectionContext ? this.collectionName : 'all');
  }

  private resetAdvancedFields(sourceValue: string): void {
    // Implémentation si nécessaire
  }

  getQueryParams(): { [key: string]: any } {
    // Préparer les paramètres de recherche
    let searchParams = { ...this.form.value };

    // Si on est dans une collection, on retire 'source' des queryParams 
    // car il est déjà dans le path de l'URL
    if (this.isCollectionContext) {
      delete searchParams.source;
    }

    return Object.fromEntries(
      Object.entries(searchParams).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ''
      )
    );
  }
}