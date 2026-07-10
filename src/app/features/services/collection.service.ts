
import { Injectable } from '@angular/core';

export interface Collection {
    value: string;
    label: string;
    description: string;
    theme?: string; // For the "cool design"
    color?: string;
    image?: string; // Optional image for the card
    count?: number; // Live book count
    link?: string; // External destination for the collection
    isExternal?: boolean; // Whether the card should open an external website
}

@Injectable({
    providedIn: 'root'
})
export class CollectionService {

    private collections: Collection[] = [
        {
            value: 'P.A.MA.L',
            label: 'P.A.MA.L',
            description: 'P.A.MA.L présente les Périodiques Anciens déposés à la Bibliothèque et Archives Universitaires de l\'Université d\'Antananarivo.',
            theme: 'amber',
            color: 'bg-amber-500',
            image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
            count: 0
        },
        {
            value: 'BUTANA',
            label: 'BUTANA',
            description: 'Fonds documentaire de la bibliothèque universitaire d\'Antananarivo.',
            theme: 'blue',
            color: 'bg-blue-600',
            image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80',
            count: 0
        },
        {
            value: 'Livres',
            label: 'Livres',
            description: 'Les livres de la Bibliothèque et Archives Universitaires - Antananarivo - Madagascar',
            theme: 'emerald',
            color: 'bg-emerald-600',
            image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
            count: 0
        },
        {
            value: 'fonds-grandidier',
            label: 'Fonds Grandidier',
            description: 'La collection de référence sur l\'histoire et la culture malgache.',
            theme: 'green',
            color: 'bg-green-700',
            image: '0b4d6acfa119a2c602badbb8f3de84ad9a19477b.jpg',
            count: 0
        },
        {
            value: 'theses',
            label: 'Thèses',
            description: 'Découvrez les thèses de l’Université d’Antananarivo sur un portail dédié et enrichi.',
            theme: 'violet',
            color: 'bg-violet-600',
            image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80',
            count: 0,
            isExternal: true,
            link: 'https://biblio.univ-antananarivo.mg/theses'
        }
    ];

    constructor() { }

    getCollections(): Collection[] {
        return this.collections;
    }

    getCollection(value: string): Collection | undefined {
        return this.collections.find(c => c.value === value);
    }
}
