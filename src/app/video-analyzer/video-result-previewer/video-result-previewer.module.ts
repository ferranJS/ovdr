import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideoResultPreviewerPageRoutingModule } from './video-result-previewer-routing.module';

import { VideoResultPreviewerPage } from './video-result-previewer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VideoResultPreviewerPageRoutingModule
  ],
  declarations: [VideoResultPreviewerPage]
})
export class VideoResultPreviewerPageModule {}
