import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-selector',
  templateUrl: './video-selector.page.html',
  styleUrls: ['./video-selector.page.scss'],
})
export class VideoSelectorPage implements OnInit {

  constructor(private router: Router, private sanitizer: DomSanitizer) { }

  ngOnInit() {
  }
  
  uploadFile = (e) => {
    let videoObject:any = document.getElementById('uploadFile')
    console.log("videoObject: ", videoObject);
    // crea url del vídeo porque no se puede acceder desde el html
    console.log("videoObject.files: ", videoObject.files);
    let url = window.URL.createObjectURL(videoObject.files[0])
    console.log("url: ", url);
    this.router.navigate(['video-analyzer'], {queryParams: {src: url}})
 }

}
