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

  shareVideo = () => {

  }

  downloadVideo = (url = this.src) => {
    this.http.get(url, { 
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).subscribe(async (event) => {
      if (event.type === HttpEventType.DownloadProgress) {
        this.downloadProgress = Math.round(100 * event.loaded / event.total);
      } else if (event.type === HttpEventType.Response) {
        this.downloadProgress = 100

        const name = url.substring(url.lastIndexOf('/') + 1)
        const base64 = await this.blobToBase64(event.body) as string

        const saved = Filesystem.writeFile({
          path: name,  // genera un .webm (no reproducible en Android (y iOS?)) | .mp4 (reproducible en iOS y Android)
          data: base64,
          directory: Directory.Documents
        }).then(() => {
          // alert('Video saved to DOCUMENTS')
          console.log("saved: ", saved);   //saved.uri
        }).catch((e) => {
          // alert('Error saving video')
          console.log(e)
        })

        //aquí iría mimeType.. fileopner etc. pero no se como hacerlo
                                          // ↗ generado por github copilot xd
      }
    })
  }

  blobToBase64(blob) {
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