import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VideoResultPreviewerPage } from './video-result-previewer.page';

const routes: Routes = [
  {
    path: '',
    component: VideoResultPreviewerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VideoResultPreviewerPageRoutingModule {}
