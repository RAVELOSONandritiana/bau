import { Routes } from '@angular/router';
import { Search } from './features/search/search';
import { Result } from './features/result/result';
import { HomeComponent } from './features/home/home';
import { Help } from './features/help/help';
import { MainLayout } from './layout/main-layout/main-layout';
import { NotFound } from './features/not-found/not-found';
import { Omeka } from './features/omeka/omeka';
import { FileViewer } from './features/file-viewer/file-viewer';

export const routes: Routes = [
    { path: 'result', component: Result, runGuardsAndResolvers: 'paramsOrQueryParamsChange' },
    { path: 'omeka/:collection', component: Omeka, runGuardsAndResolvers: 'paramsOrQueryParamsChange' },
    // New Collection Routes
    { path: 'collection', loadComponent: () => import('./features/collection-listing/collection-listing').then(m => m.CollectionListing) },
    { path: 'collection/:collection', component: Search },
    { path: 'collection/:collection/result', component: Result, runGuardsAndResolvers: 'paramsOrQueryParamsChange' },
    { path: 'collection/:collection/:title', component: FileViewer },

    { path: ':collection/files/:title', component: FileViewer },
    { path: 'search', component: Search },
    {
        path: '', component: MainLayout, children: [
            { path: '', component: HomeComponent },
            { path: 'help', component: Help }
        ]
    },
    { path: '**', component: NotFound }
];
