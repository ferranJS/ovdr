import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-video-result-previewer',
  templateUrl: './video-result-previewer.page.html',
  styleUrls: ['./video-result-previewer.page.scss'],
})
export class VideoResultPreviewerPage implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute) { }
    video_result: any

  ngOnInit() {
    this.video_result = document.getElementById('video_result')
    // this.route.paramMap.subscribe(src => this.video_result['src'] = src)
    this.video_result['src'] = this.route.snapshot.paramMap.get('src')
    console.log("this.video_result['src']", this.video_result['src']);
  }

}