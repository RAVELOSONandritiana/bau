import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-loader',
    standalone: true,
    templateUrl: './loader.html',
    styleUrls: ['./loader.css']
})
export class LoaderComponent {
    @Input() message = 'Chargement en cours...';
}
