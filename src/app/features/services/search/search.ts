import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const OLD_URL = 'https://192.168.1.183';
const NEW_URL = 'https://biblio.univ-antananarivo.mg/omeka';

/**
 * Transforme toutes les URLs dans un objet JSON en remplaçant l'ancienne URL par la nouvelle
 * Esto es necesario porque les réponses de l'API Omeka contiennent encore l'ancienne adresse IP
 */
function transformUrls(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.replace(new RegExp(OLD_URL, 'g'), NEW_URL);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformUrls(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = transformUrls(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

export interface OmekaItem {
  'o:id': number;
  'o:title': string;
  'o:created': { '@value': string };
  'dcterms:creator'?: Array<{ '@value': string }>;
  'dcterms:date'?: Array<{ '@value': string }>;
  'dcterms:description'?: Array<{ '@value': string }>;
  'dcterms:subject'?: Array<{ '@value': string }>;
  'o:media'?: Array<{ 'o:id': number }>;
}

export interface OmekaMedia {
  'o:id': number;
  'o:original_url': string;
  'o:thumbnail_urls': {
    large?: string;
    medium?: string;
    square?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private baseUrl = environment.url;

  constructor(private http: HttpClient) { }

  getData(params: any): Observable<any> {
    // Vérifier si on a des mots-clés multiples (pour la recherche AND)
    let perPage = params.limit ? parseInt(params.limit, 10) : 10;
    const page = params.page ? parseInt(params.page, 10) : 1;
    
    // Compter les mots-clés séparés par virgule
    let subjectKeywords: string[] = [];
    if (params.subject) {
      subjectKeywords = params.subject
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);
    }

    // Récupérer BEAUCOUP plus de résultats si on filtre par mots-clés ou date (car le filtrage final est fait côté client)
    if (subjectKeywords.length > 1 || params.yearStart || params.yearEnd) {
      // On demande 500 items pour maximiser les chances de trouver des correspondances dans la collection
      // Omeka S limite généralement à 50 ou 100, mais on tente le maximum possible
      perPage = 500;
    }

    // Envoyer le nombre de livres par page dans les paramètres
    params.limit = perPage;

    return this.searchItems(params, page, perPage).pipe(
      switchMap(result => {
        if (result.docs.length === 0) {
          return of({ docs: [], totalResults: 0 });
        }

        // Retourner directement les résultats de la page demandée
        return of({
          docs: result.docs,
          totalResults: result.totalResults
        });
      }),
      catchError(error => {
        return of({ docs: [], totalResults: 0 });
      })
    );
  }

  getTotalItems(params: any): Observable<number> {
    let httpParams = new HttpParams()
      .set('per_page', '1'); // Demander seulement 1 item pour être plus rapide

    if (params.q) {
      httpParams = httpParams.set('search', params.q);
    }

    let propIdx = 0;
    if (params.title) {
      httpParams = httpParams.set(`property[${propIdx}][property]`, 'dcterms:title')
        .set(`property[${propIdx}][type]`, 'in')
        .set(`property[${propIdx}][text]`, params.title);
      propIdx++;
    }

    if (params.author) {
      httpParams = httpParams.set(`property[${propIdx}][property]`, 'dcterms:creator')
        .set(`property[${propIdx}][type]`, 'in')
        .set(`property[${propIdx}][text]`, params.author);
      propIdx++;
    }

    // Gérer la recherche par mots-clés (subject) - sera traité côté client avec AND
    if (params.subject) {
      // Parser les mots-clés : séparer par virgule seulement
      const keywords = params.subject
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      if (keywords.length > 0) {
        // Rechercher le premier mot-clé dans la description (propriété dcterms:description) - garder la casse originale
        httpParams = httpParams.set(`property[${propIdx}][property]`, 'dcterms:description')
          .set(`property[${propIdx}][type]`, 'in')
          .set(`property[${propIdx}][text]`, keywords[0]);
        propIdx++;
      }
    }

    // NOTE: On ne filtre plus par date au niveau de l'API Omeka S car cela semble retourner 0 résultats 
    // sur ce serveur spécifique. Le filtrage sera fait de manière robuste côté client dans searchItems.

    console.log('Search total items params:', httpParams.toString());

    if (params.source && params.source !== 'all') {
      const sourceId = this.resolveSourceId(params.source);
      httpParams = httpParams.set('item_set_id', sourceId);
    }

    return this.http.get(`${this.baseUrl}/api/items`, {
      params: httpParams,
      observe: 'response'
    }).pipe(
      map(response => {
        // Transformer les URLs dans la réponse
        const transformedBody = transformUrls(response.body);
        // Essayer de récupérer l'en-tête
        const totalResults = parseInt(response.headers.get('Omeka-S-Total-Results') || '0', 10);

        // Si l'en-tête n'est pas disponible, utiliser la longueur du body
        if (totalResults === 0 && transformedBody && Array.isArray(transformedBody)) {
          return transformedBody.length;
        }

        return totalResults;
      }),
      catchError(error => {
        return of(0);
      })
    );
  }

  private searchItems(params: any, page: number, perPage: number = 10): Observable<any> {
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (params.q) {
      httpParams = httpParams.set('search', params.q);
    }

    let propIdx = 0;
    if (params.title) {
      httpParams = httpParams.set(`property[${propIdx}][property]`, 'dcterms:title')
        .set(`property[${propIdx}][type]`, 'in')
        .set(`property[${propIdx}][text]`, params.title);
      propIdx++;
    }

    if (params.author) {
      httpParams = httpParams.set(`property[${propIdx}][property]`, 'dcterms:creator')
        .set(`property[${propIdx}][type]`, 'in')
        .set(`property[${propIdx}][text]`, params.author);
      propIdx++;
    }

    // Parser les mots-clés une seule fois: séparer par virgule, trim, et filtrer les vides
    let subjectKeywords: string[] = [];
    let subjectKeywordsLower: string[] = [];
    if (params.subject && typeof params.subject === 'string') {
      const originalKeywords = params.subject
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);
      
      subjectKeywords = originalKeywords;
      subjectKeywordsLower = originalKeywords.map((k: string) => k.toLowerCase());

      if (subjectKeywords.length > 0) {
        // Rechercher le premier mot-clé dans la description (propriété dcterms:description) - garder la casse originale
        httpParams = httpParams.set(`property[${propIdx}][property]`, 'dcterms:description')
          .set(`property[${propIdx}][type]`, 'in')
          .set(`property[${propIdx}][text]`, subjectKeywords[0]);
        propIdx++;
      }
    }

    // NOTE: On ne filtre plus par date au niveau de l'API Omeka S car cela semble retourner 0 résultats 
    // sur ce serveur spécifique. Le filtrage robuste est fait plus bas dans le pipe(map(...)).
    
    // S'assurer que le premier filtre a aussi un joiner si nécessaire
    // (certaines versions d'Omeka S le préfèrent)
    if (propIdx > 0) {
        httpParams = httpParams.set('property[0][joiner]', 'and');
    }

    console.log('Search items request params:', httpParams.toString());

    if (params.source && params.source !== 'all') {
      const sourceId = this.resolveSourceId(params.source);
      httpParams = httpParams.set('item_set_id', sourceId);
    }

    return this.http.get<OmekaItem[]>(`${this.baseUrl}/api/items`, {
      params: httpParams,
      observe: 'response'
    }).pipe(
      switchMap(response => {
        // Transformer les URLs dans la réponse
        const transformedBody: any = transformUrls(response.body);
        const items = transformedBody || [];

        // Essayer de récupérer le total depuis l'en-tête
        const totalResultsHeader = response.headers.get('Omeka-S-Total-Results');
        let totalResults = totalResultsHeader ? parseInt(totalResultsHeader, 10) : 0;

        // Si l'en-tête n'est pas disponible ou vaut 0, on fait une estimation
        if (totalResults === 0) {
          // Si on a reçu exactement perPage items, il y a probablement plus de résultats
          if (items.length === perPage) {
            // Estimation conservative : on suppose qu'il y a au moins une autre page
            totalResults = items.length * 2;
          } else {
            // Si on a moins que perPage, c'est probablement la dernière page
            totalResults = (page - 1) * perPage + items.length;
          }
        }

        if (items.length === 0) {
          return of({ docs: [], totalResults: 0 });
        }

        const mediaRequests = items.map((item: any) => {
          if (item['o:media'] && item['o:media'].length > 0) {
            const mediaId = item['o:media'][0]['o:id'];
            return this.getMedia(mediaId).pipe(
              catchError(() => of(null))
            );
          }
          return of(null);
        });

        return forkJoin(mediaRequests).pipe(
          map((mediaResults: any) => {
            const docs = items.map((item: any, index: number) => {
              const media = mediaResults[index] as any;
              const yearMatch = item['dcterms:date']?.[0]?.['@value']?.match(/\d{4}/);

              return {
                key: item['o:id'].toString(),
                title: item['o:title'] || 'Sans titre',
                author_name: item['dcterms:creator']?.map((c: any) => c['@value']) || [],
                first_publish_year: yearMatch ? parseInt(yearMatch[0]) : null,
                description: item['dcterms:description']?.[0]?.['@value'] || null,
                subject: item['dcterms:subject']?.map((s: any) => s['@value']) || [],
                thumbnail_url: media?.['o:thumbnail_urls']?.large ||
                  media?.['o:thumbnail_urls']?.medium || null,
                original_url: media?.['o:original_url'] || null
              };
            });

            // Filtrer par années ET par mots-clés (AND) si spécifié
            let filteredDocs = docs;

            // Filtrer par mots-clés (condition AND - tous les mots doivent être présents)
            if (subjectKeywordsLower.length > 0) {
              console.log('Filtering with keywords:', subjectKeywordsLower);
              console.log('Total docs before filter:', docs.length);
              
              filteredDocs = filteredDocs.filter((doc: any) => {
                // Extraire la description - peut être null, une chaîne, ou un objet
                let descriptionText = '';
                if (doc.description) {
                  if (typeof doc.description === 'string') {
                    descriptionText = doc.description;
                  } else if (doc.description['@value']) {
                    descriptionText = doc.description['@value'];
                  }
                }
                
                // Les sujets sont un tableau
                const subjectText = Array.isArray(doc.subject) ? doc.subject.join(' ') : '';
                // Recherche insensible à la casse
                const searchText = (descriptionText + ' ' + subjectText).toLowerCase();
                
                console.log('Doc description:', descriptionText);
                console.log('Search text:', searchText);
                
                // Tous les mots-clés doivent être présents (AND) - utiliser version lowercase
                const result = subjectKeywordsLower.every(keyword => searchText.includes(keyword));
                console.log('Keyword match result:', result);
                
                return result;
              });
              
              console.log('Total docs after filter:', filteredDocs.length);
            }

            // Filtrage LOCAL par dates (FALLBACK) - très important si l'API ignore les filtres
            const yearStart = params.yearStart ? parseInt(params.yearStart) : null;
            const yearEnd = params.yearEnd ? parseInt(params.yearEnd) : null;

            if (yearStart !== null || yearEnd !== null) {
              console.log('Applying local date filter fallback:', { yearStart, yearEnd });
              filteredDocs = filteredDocs.filter((doc: any) => {
                if (doc.first_publish_year === null) return false;
                
                let matches = true;
                if (yearStart !== null && doc.first_publish_year < yearStart) matches = false;
                if (yearEnd !== null && doc.first_publish_year > yearEnd) matches = false;
                
                return matches;
              });
              console.log('Total docs after local date filter:', filteredDocs.length);
            }

            return {
              docs: filteredDocs,
              // Utiliser le total de l'API (non filtré) pour la pagination
              // Cela permet à la pagination de fonctionner correctement même après filtrage AND
              totalResults: totalResults
            };
          })
        );
      }),
      catchError(error => {
        return of({ docs: [], totalResults: 0 });
      })
    );
  }

  private getMedia(mediaId: number): Observable<OmekaMedia | null> {
    return this.http.get<OmekaMedia>(`${this.baseUrl}/api/media/${mediaId}`).pipe(
      map(media => media ? transformUrls(media) : null),
      catchError(() => {
        return of(null);
      })
    );
  }

  private resolveSourceId(source: string): string {
    const mapping: { [key: string]: string } = {
      'Livres': '4',
      'P.A.MA.L': '2',
      'BUTANA': '3',
      'fonds-grandidier': '1',
    };
    // Retourne l'ID si trouvé, sinon retourne la source telle quelle (au cas où c'est déjà un ID)
    return mapping[source] || source;
  }
}