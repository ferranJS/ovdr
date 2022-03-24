import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoAnalyzerPage } from './video-analyzer.page';

const routes: Routes = [
  {
    path: '',
    component: VideoAnalyzerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoAnalyzerPageRoutingModule {}
