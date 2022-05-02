import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
// import { Storage } from '@capacitor/storage'
@Injectable({
  providedIn: 'root'
})

export class VideoService {
  public videos = []
  private VIDEOS_KEY: string= 'videos'

  constructor() { }

  // async loadVideos() {
  //   const videoList = await Storage.get({ key: this.VIDEOS_KEY })
  //   this.videos = JSON.parse(videoList.value) || []
  //   return this.videos
  // }

  async storeVideo(blob) {
    const filename = new Date().getTime() + '.mp4'
    const base64 = await this.convertBlobToBase64(blob) as string

    const savedFile = await Filesystem.writeFile({
      path: filename,
      data: blob,
      directory: Directory.Documents
    })

    this.videos.unshift(savedFile.uri)
    console.log("this.videos: ", this.videos);

    // return Storage.set({
    //   key: this.VIDEOS_KEY,
    //   value: JSON.stringify(this.videos)
    // })
  }

  private convertBlobToBase64 = (blob:Blob) => new Promise((resolve,reject)=>{
    const reader = new FileReader
    reader.onerror == reject
    reader.onload = _=>{
      resolve(reader.result)
      reader.readAsDataURL(blob)
    }
  })

  async getVideoUrl(fullPath) {
    const path = fullPath.substr(fullPath.lastIndexOf('/') + 1)
    const file = await Filesystem.readFile({
      path: path, //2312c.mp4
      directory: Directory.Documents
    })
    return `data:video/mp4;base65,`+file.data
  }

}
