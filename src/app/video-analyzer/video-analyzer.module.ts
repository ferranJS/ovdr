import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';


import { VideoAnalyzerPage } from './video-analyzer.page';
import { VideoResultPreviewerPageModule } from './video-result-previewer/video-result-previewer.module';
import { VideoResultPreviewerPage } from './video-result-previewer/video-result-previewer.page';
import { VideoAnalyzerPageRoutingModule } from './video-analyzer-routing.module';

@NgModule({
  entryComponents: [ VideoResultPreviewerPage ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VideoAnalyzerPageRoutingModule,
    VideoResultPreviewerPageModule,
    // ComponentsModule
  ],
  declarations: [VideoAnalyzerPage]
})
export class VideoAnalyzerPageModule {}
