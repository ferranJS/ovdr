import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-video-result-previewer',
  templateUrl: './video-result-previewer.page.html',
  styleUrls: ['./video-result-previewer.page.scss'],
})
export class VideoResultPreviewerPage implements OnInit {

  @Input() src: string
  video_result: any

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    console.log("hola módulo!")
    this.video_result = document.getElementById('video_result')
    this.video_result['src'] = this.src
    console.log("this.video_result['src']", this.video_result);
  }

  exitModal() {
    this.modalController.dismiss()
  }
}