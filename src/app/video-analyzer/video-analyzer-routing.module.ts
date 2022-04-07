import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoAnalyzerPage } from './video-analyzer.page';
import { VideoResultPreviewerPage } from './video-result-previewer/video-result-previewer.page';

const routes: Routes = [
  {
    path: '',
    component: VideoAnalyzerPage
  },
  {
    path: 'result',
    component: VideoResultPreviewerPage
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoAnalyzerPageRoutingModule {}
