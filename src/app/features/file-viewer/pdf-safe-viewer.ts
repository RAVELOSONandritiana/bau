import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-pdf-safe-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  template: `
    <pdf-viewer 
      [src]="src" 
      [render-text]="false" 
      [original-size]="false"
      [fit-to-page]="false"
      [autoresize]="true"
      [zoom]="zoom"
      [show-all]="true"
      [show-borders]="false"
      style="width: 100%; height: auto; min-height: 100%; display: block;"
      (after-load-complete)="onAfterLoadComplete($event)"
      (pages-initialized)="onPagesInitialized($event)"
      (page-rendered)="onPageRendered($event)"
      (error)="onError($event)">
    </pdf-viewer>
  `
})
export class PdfSafeViewer {
  @Input() src: string = '';
  @Input() zoom: number = 1.0;
  @Output() loaded = new EventEmitter<void>();
  @Output() error = new EventEmitter<any>();
  @Output() progress = new EventEmitter<number>();

  private totalPages: number = 0;
  private renderedPages: number = 0;
  private firstPageRendered: boolean = false;
  private allPagesRendered: boolean = false;

  onAfterLoadComplete(pdf: any) {
    if (pdf && pdf.numPages) {
      this.totalPages = pdf.numPages;
      this.progress.emit(0);
    }
  }

  onLoaded() {
    // Don't emit loaded yet - wait for first page to render
  }

  onPageRendered(event: any) {
    this.renderedPages++;

    // Hide loading screen as soon as first page is rendered
    if (!this.firstPageRendered) {
      this.firstPageRendered = true;
      this.loaded.emit();
    }

    // Emit progress percentage
    if (this.totalPages > 0) {
      const percentage = Math.round((this.renderedPages / this.totalPages) * 100);
      this.progress.emit(percentage);
    }

    // Track when all pages are rendered
    if (this.totalPages > 0 && this.renderedPages >= this.totalPages && !this.allPagesRendered) {
      this.allPagesRendered = true;
    }
  }

  onPagesInitialized(event: any) {
    // Store total page count
    if (event && event.pagesCount) {
      this.totalPages = event.pagesCount;
      // Emit initial progress
      this.progress.emit(0);
    }
  }

  onError(err: any) {
    this.error.emit(err);
  }
}
