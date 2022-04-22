import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { VideoAnalyzerPage } from './video-analyzer.page';
import { VideoAnalyzerPageRoutingModule } from './video-analyzer-routing.module';
import { VideoResultPreviewerPage } from './video-result-previewer/video-result-previewer.page';

@NgModule({
  // entryComponents: [ VideoResultPreviewerPage ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VideoAnalyzerPageRoutingModule,
    HttpClientModule
    // ComponentsModule
  ],
  declarations: [VideoAnalyzerPage, VideoResultPreviewerPage]
})
export class VideoAnalyzerPageModule {}
