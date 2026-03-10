import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PdfViewerService {
    private pdfData: any = null;

    setPdfData(data: any) {
        this.pdfData = data;
    }

    getPdfData(): any {
        const data = this.pdfData;
        this.pdfData = null; // Clear after reading
        return data;
    }
}
