import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VideoAnalyzerPage } from '../video-analyzer/video-analyzer.page';

import { VideoSelectorPage } from './video-selector.page';

const routes: Routes = [
  {
    path: '',
    component: VideoSelectorPage
  }, 
  {
    path: 'video-analyzer',
    component: VideoAnalyzerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoSelectorPageRoutingModule {}
