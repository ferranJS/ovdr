import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { VideoSelectorPage } from './video-selector/video-selector.page';

const routes: Routes = [
  {
    path: '',
    component: VideoSelectorPage
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'video-analyzer',
    loadChildren: () => import('./video-analyzer/video-analyzer.module').then( m => m.VideoAnalyzerPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
