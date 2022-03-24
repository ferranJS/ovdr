import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideoAnalyzerPageRoutingModule } from './video-analyzer-routing.module';

import { VideoAnalyzerPage } from './video-analyzer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VideoAnalyzerPageRoutingModule
  ],
  declarations: [VideoAnalyzerPage]
})
export class VideoAnalyzerPageModule {}
