// types/omeka.ts
export interface OmekaValue {
    '@value': string;
}

export interface OmekaMediaRef {
    'o:id': number;
}

export interface OmekaItem {
    'o:id': number;
    'o:title': string;
    'o:created': { '@value': string };
    'dcterms:creator'?: OmekaValue[];
    'dcterms:date'?: OmekaValue[];
    'dcterms:description'?: OmekaValue[];
    'dcterms:subject'?: OmekaValue[];
    'o:media'?: OmekaMediaRef[];
}

export interface OmekaMedia {
    'o:id': number;
    'o:original_url': string;
    'o:thumbnail_urls': {
        large?: string;
        medium?: string;
        square?: string;
        [key: string]: string | undefined;
    };
}

export interface Book {
    key: string;
    title: string;
    author_name: string[];
    first_publish_year: number | null;
    description: string | null;
    subject: string[];
    thumbnail_url: string | null;
    original_url: string | null;
}

export interface SearchParams {
    q?: string;
    title?: string;
    author?: string;
    subject?: string;
    source?: string;
    yearStart?: string;
    yearEnd?: string;
    [key: string]: unknown;
}

export interface PaginatedBooksResponse {
    items: Book[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}