import { Pipe, PipeTransform, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Pipe({
  name: 'decodetitle',
  standalone: true
})
export class DecodetitlePipe implements PipeTransform {
  private platformId = inject(PLATFORM_ID);

  transform(value: string): string {
    if (!value) return value;
    let decoded = value;
    if (isPlatformBrowser(this.platformId)) {
      const textArea = document.createElement('textarea');
      textArea.innerHTML = value;
      decoded = textArea.value;
    } else {
      decoded = value.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
      });
    }
    return decoded.replace(/-/g, ' ');
  }
}