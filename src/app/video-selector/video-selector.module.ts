import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideoSelectorPageRoutingModule } from './video-selector-routing.module';

import { VideoSelectorPage } from './video-selector.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VideoSelectorPageRoutingModule
  ],
  declarations: [VideoSelectorPage]
})
export class VideoSelectorPageModule {}
