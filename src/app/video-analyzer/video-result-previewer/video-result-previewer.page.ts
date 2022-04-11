import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
@Component({
  selector: 'app-video-result-previewer',
  templateUrl: './video-result-previewer.page.html',
  styleUrls: ['./video-result-previewer.page.scss'],
})
export class VideoResultPreviewerPage implements OnInit {

  @Input() src: string
  video_result: any

  downloadProgress: number = 0

  constructor(private modalController: ModalController, private http: HttpClient) { }

  ngOnInit() {
    this.video_result = document.getElementById('video_result')
    this.video_result['src'] = this.src
  }

  cancel() {
    this.modalController.dismiss(true)
  }

  // https://www.npmjs.com/package/webm-to-mp4
  downloadVideo(url = this.src) {
    this.http.get(url, { 
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    },
    ).subscribe(async (event) => {
      console.log("event: ", event);
      if (event.type === HttpEventType.DownloadProgress) {
        this.downloadProgress = Math.round(100 * event.loaded / event.total);
      } else if (event.type === HttpEventType.Response) {
        this.downloadProgress = 100

        const name = url.substring(url.lastIndexOf('/') + 1)
        const base64 = await this.blobToBase64(event.body) as string

        const saved = await Filesystem.writeFile({
          path: "vid.webm", //'videoRes.mp4', ??
          data: base64,
          directory: Directory.Documents
        })
        //aquí iría mimeType.. fileopner etc..
        console.log("saved: ", saved);   //saved.uri
        
        const path = saved.uri
        console.log("name: ", name);
        const mimeType = this.getMimetype(name)
        console.log("mimeType: ", mimeType);
      }
    })
  }

  private getMimetype(filename) {
    if (filename.indexOf('mp4')>=0) 
      return 'video/mp4'
    else if (filename.indexOf('webm')>=0)
      return 'video/webm'
    else if (filename.indexOf('ogg')>=0)
      return 'video/ogg'
    else if (filename.indexOf('ogv')>=0)
      return 'video/ogv'
    else if (filename.indexOf('mov')>=0)
      return 'video/mov'
    return "a"
    // const ext = filename.split('.').pop()
    // switch (ext) {
    //   case 'mp4':
    //     return 'video/mp4'
    //   case 'webm':
    //     return 'video/webm'
    //   case 'ogg':
    //     return 'video/ogg'
    //   case 'ogv':
    //     return 'video/ogv'
    //   case 'mov':
    //     return 'video/mov'
    //   case 'wmv':
    //     return 'video/wmv'
    //   case 'avi':
    //     return 'video/avi'
    //   case 'flv':
    //     return 'video/flv'
    //   case 'mkv':
    //     return 'video/mkv'
    //   case 'm4v':
    //     return 'video/m4v'
    //   case 'mpg':
    //     return 'video/mpg'
    //   case 'mpeg':
    //     return 'video/mpeg'
    //   case '3gp':
    //     return 'video/3gp'
    //   case '3g2':
    //     return 'video/3g2'
    //   case 'm4a':
    //     return 'video/m4a'
    //   case 'm4b':
    //     return 'video/m4b'
    //   case 'm4p':
    //     return 'video/m4p'
    //   case 'm4r':
    //     return 'video/m4r'
    //   case 'm4v':
    //     return 'video/m4v'
    //   case 'f4v':
    //     return 'video/f4v'
    //   case 'f4p':
    //     return 'video/f4p'
    //   case 'f4a':
    //     return 'video/f4a'
    //   case 'f4b':
    //     return 'video/f4b'
    // }
  }

  private blobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onloadend = () => {
        resolve(reader.result)
      }
      reader.readAsDataURL(blob)
    })
  }
}