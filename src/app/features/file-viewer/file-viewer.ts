import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, HostListener, ViewChild, ViewContainerRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoaderComponent } from '../../components/loader/loader';
import { environment } from '../../../environments/environment';

const OLD_URL = 'https://192.168.1.183';
const NEW_URL = 'https://biblio.univ-antananarivo.mg/omeka';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.css'
})
export class FileViewer implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  @ViewChild('pdfContainer', { read: ViewContainerRef }) pdfContainer!: ViewContainerRef;

  isBrowser = isPlatformBrowser(this.platformId);
  title = '';
  collection = '';
  fileUrl = '';
  safeUrl: SafeResourceUrl | null = null;
  loading = true;
  loadingProgress = 0;
  book: any = null;
  showInfoPopup = false;
  zoom = 0.8;
  private componentRef: any = null;

  zoomIn() {
    this.zoom += 0.2;
    if (this.componentRef) {
      this.componentRef.instance.zoom = this.zoom;
    }
    this.cdr.detectChanges();
  }

  zoomOut() {
    if (this.zoom > 0.1) {
      this.zoom -= 0.1;
      if (this.componentRef) {
        this.componentRef.instance.zoom = this.zoom;
      }
      this.cdr.detectChanges();
    }
  }

  resetZoom() {
    this.zoom = 0.8;
    if (this.componentRef) {
      this.componentRef.instance.zoom = this.zoom;
    }
    this.cdr.detectChanges();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): boolean {
    if ((event.ctrlKey || event.metaKey) && ['p', 's', 'u'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      return false;
    }
    if (event.key === 'F12' || ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j'].includes(event.key.toLowerCase()))) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  @HostListener('window:contextmenu', ['$event'])
  handleContextMenu(event: MouseEvent): boolean {
    event.preventDefault();
    return false;
  }

  onOverlayContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.book) this.showInfoPopup = true;
    return false;
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['title']) this.title = params['title'];
      if (params['collection']) this.collection = params['collection'];
    });

    this.route.queryParams.subscribe(params => {
      const encryptedUrl = params['f'];
      const encryptedTitle = params['t'];

      if (encryptedTitle) {
        try {
          this.title = this.decryptUrl(encryptedTitle);
        } catch (e) {
          console.error('FileViewer: Title decryption failed', e);
        }
      }

      if (encryptedUrl) {
        try {
          this.fileUrl = this.decryptUrl(encryptedUrl);
          if (this.isBrowser) {
            this.prepareSafeUrl();
            this.loadPdfViewer();
          }
        } catch (e) {
          this.loading = false;
        }
      } else {
        this.loading = false;
      }
    });

    if (this.isBrowser) {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, true);
      window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, true);
    }
  }

  private async loadPdfViewer() {
    if (!this.fileUrl) return;
    try {
      // Dynamic import ensures the PDF library is only loaded in the browser
      const { PdfSafeViewer } = await import('./pdf-safe-viewer');
      if (this.pdfContainer) {
        this.pdfContainer.clear();
        this.componentRef = this.pdfContainer.createComponent(PdfSafeViewer);
        this.componentRef.instance.src = this.fileUrl;
        this.componentRef.instance.zoom = this.zoom;
        this.componentRef.instance.loaded.subscribe(() => this.onPdfLoaded());
        this.componentRef.instance.error.subscribe((err: any) => this.onError(err));
        this.componentRef.instance.progress.subscribe((progress: number) => this.onProgress(progress));
      }
    } catch (e) {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private prepareSafeUrl() {
    if (!this.fileUrl) return;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
    this.cdr.detectChanges();
  }

  decryptUrl(encryptedUrl: string): string {
    try {
      const decoded = atob(encryptedUrl);
      let url = decodeURIComponent(decoded);
      
      // Remplacer l'ancienne URL par la nouvelle
      url = url.replace(new RegExp(OLD_URL, 'g'), NEW_URL);
      
      // Always use the full URL from environment to work behind proxy
      if (url.includes(environment.url) || url.includes('https://192.168.1.183')) {
        const urlObj = new URL(url);
        // Return full URL with protocol and host for proper proxy routing
        return urlObj.protocol + '//' + urlObj.host + urlObj.pathname + urlObj.search;
      }
      return url;
    } catch (e) {
      return '';
    }
  }

  onProgress(progress: number) {
    this.ngZone.run(() => {
      this.loadingProgress = progress;
      this.cdr.detectChanges();
    });
  }

  onPdfLoaded() {
    this.loading = false;
    this.loadingProgress = 100;
    this.cdr.detectChanges();
  }

  onError(error: any) {
    this.loading = false;
    this.cdr.detectChanges();
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  closeInfoPopup() {
    this.showInfoPopup = false;
  }

  blockSelection(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}
