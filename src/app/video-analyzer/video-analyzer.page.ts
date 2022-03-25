import { Component, OnInit } from '@angular/core';

@Component({
   selector: 'video-analyzer',
   templateUrl: './video-analyzer.page.html',
   styleUrls: ['./video-analyzer.page.scss'],
})
export class VideoAnalyzerPage {
   private btnPaint: HTMLElement
   private btnLines: HTMLElement
   private btnGrab: HTMLElement
   private btnErase: HTMLElement
   private slider: any
   private colorPicker: any
   public mode: string
   private video_in: any
   private video_out: HTMLElement
   private c_out: any
   private ctx_out: any
   private c_tmp: any
   private ctx_tmp: any
   private c_nodes: any
   private ctx_nodes: any
   private canvasContainer: HTMLElement

   private points: any = []
   private x: number  // x e y tras getPosition
   private y: number
   private x0: number // x e y inicial (asignados una vez x línea/círculo)
   private y0: number
   private clicking: boolean = false
   private hasDragged = false
   private recording = false

   private log = [[]] // historial de dibujado

   private grabedNodes = []
   private nodeRadius = 11

   // access microphone 
   private constraintObj = {
      audio: true,
      video: false
   }

   constructor() { }

   
   ionViewWillEnter() {
      this.slider = document.getElementById('slider')
      this.colorPicker = document.getElementById("colorPicker")

      this.video_in = document.getElementById('video_in')
      this.video_out = document.getElementById('video_out')

      this.c_out = document.getElementById('output-canvas')
      this.ctx_out = this.c_out.getContext('2d')

      this.c_tmp = document.getElementById('temp-canvas')
      this.c_nodes = document.getElementById('nodes-canvas')
      this.canvasContainer = document.getElementById('canvas-container')
      this.ctx_tmp = this.c_tmp.getContext('2d')
      this.ctx_nodes = this.c_nodes.getContext('2d')

      this.ctx_out.drawImage(this.c_tmp, 0, 0)
      // c_tmp.style.zIndex = 99

      this.btnPaint = document.getElementById('modePaint')
      this.btnLines = document.getElementById('modeLines')
      this.btnGrab = document.getElementById('modeGrab')
      this.btnErase = document.getElementById('modeErase')

      this.canvasContainer.addEventListener('touchstart', this.startAction)
      this.canvasContainer.addEventListener('touchleave', this.stopAction)
      this.canvasContainer.addEventListener('touchcancel', this.stopAction)
      this.canvasContainer.addEventListener('touchend', this.stopAction)
      this.canvasContainer.addEventListener('touchmove', this.sketch)

      this.canvasContainer.addEventListener('mousedown', this.startAction)
      this.canvasContainer.addEventListener('mouseup', this.stopAction)
      this.canvasContainer.addEventListener('mouseleave', this.stopAction)
      this.canvasContainer.addEventListener('mousemove', this.sketch)

      this.slider.addEventListener('input', this.changeThickness)
      this.colorPicker.addEventListener('input', this.changeColor)

      // velocidad del video
      this.video_in.playbackRate = 1
      this.initRecorder()
      this.video_in.addEventListener('play', this.prepareCanvas)
   }

   private initRecorder = () => {
      if (navigator.mediaDevices === undefined) {
         // navigator['mediaDevices'] = {}   //dice q es read-only
         navigator.mediaDevices.getUserMedia = function (constraintObj) {
            let getUserMedia = navigator['webkitGetUserMedia'] || navigator['mozGetUserMedia']
            if (!getUserMedia) {
               return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
            }
            return new Promise(function (resolve, reject) {
               getUserMedia.call(navigator, constraintObj, resolve, reject)
            })
         }
      } else {
         navigator.mediaDevices.enumerateDevices().then(devices => {
            devices.forEach(device => { console.log(device.kind.toUpperCase(), device.label) })
         })
            .catch(err => { console.log(err.name, err.message) })
      }
      navigator.mediaDevices.getUserMedia(this.constraintObj)
         .then((audioStreamObj) => {
            let videoRecordBtn = document.getElementById('videoRecord')
            let vidSave = document.getElementById('video_out')
            let canvasStreamObj = this.c_out.captureStream(40 /*fps*/)
            let combinedStreamObj = new MediaStream([...audioStreamObj.getAudioTracks(), ...canvasStreamObj.getVideoTracks()])
            let mediaRecorder = new MediaRecorder(combinedStreamObj)
            let chunks = []

            videoRecordBtn.addEventListener('click', () => {
               if (this.recording) {
                  mediaRecorder.stop()
               } else {
                  mediaRecorder.start()
               }
               this.recording = !this.recording
               console.log(mediaRecorder.state)
            })
            mediaRecorder.ondataavailable = function (ev) {
               chunks.push(ev.data)
            }
            mediaRecorder.onstop = (ev) => {
               let blob = new Blob(chunks, { 'type': 'video/mp4' })
               chunks = []
               let videoURL = window.URL.createObjectURL(blob)
               vidSave['src'] = videoURL

               // que pase al vídeo resultado !!!
               this.video_in.className = "hidden_video"
               this.video_out.className = "video"
            }
         })
   }

   private prepareCanvas = () => {
      this.c_out.setAttribute('width', this.video_in.videoWidth) // *2
      this.c_out.setAttribute('height', this.video_in.videoHeight) // *2

      this.c_tmp.setAttribute('width', this.video_in.videoWidth) // *2
      this.c_tmp.setAttribute('height', this.video_in.videoHeight) // *2

      this.c_nodes.setAttribute('width', this.video_in.videoWidth) // *2
      this.c_nodes.setAttribute('height', this.video_in.videoHeight) // *2

      this.canvasContainer.setAttribute('width', this.video_in.videoWidth) // *2
      this.canvasContainer.setAttribute('height', this.video_in.videoHeight) // *2

      this.changeThickness(null)
      this.ctx_tmp.strokeStyle = this.colorPicker.value
      this.ctx_tmp.lineCap = 'round'
      this.ctx_nodes.lineWidth = this.slider.value

      this.btnLines.click()  // botón presionado inicial!

      // video_in.removeEventListener('play', prepareCanvas)
      setInterval(this.computeFrame,0)
   }

   private computeFrame = (once = false) => {
      // if (video_in.paused || video_in.ended) { return  }

      this.ctx_out.drawImage(this.video_in, 0, 0, this.video_in.videoWidth, this.video_in.videoHeight)
      // ctx_out.drawImage(video_in, 0, 0, video_in.videoWidth*2, video_in.videoHeight*2, 0, 0, video_in.videoWidth*4, video_in.videoHeight*4)

      // let frame = ctx_out.reateImageData()    //no
      // let frame = document.createElement('ImageData')
      // let frame = new Image()
      // let frame = new ImageData(video_in.videoWidth, video_in.videoHeight)
      // frame.crossOrigin = "anonymous"

      // ctx_out.drawImage(c_nodes, 0, 0, video_in.videoWidth*2, video_in.videoHeight*2, 0, 0, video_in.videoWidth*4, video_in.videoHeight*4)
      // ctx_out.drawImage(c_tmp, 0, 0, video_in.videoWidth*2, video_in.videoHeight*2, 0, 0, video_in.videoWidth*4, video_in.videoHeight*4)
      this.ctx_out.drawImage(this.c_tmp, 0, 0)
      this.ctx_out.drawImage(this.c_nodes, 0, 0)
      if (once) return
      setTimeout(this.computeFrame, 0)
   }

   private startCircle = (e) => {
      this.getPosition(e)
      this.x0 = this.x
      this.y0 = this.y
   }

   private previewCircle = (e: any) => {
      this.drawPaths()
      this.ctx_tmp.beginPath()
      this.getPosition(e)
      this.ctx_tmp.arc(...this.midpoint(this.x0, this.y0, this.x, this.y), this.radius(this.x0, this.y0, this.x, this.y), 0, 2 * Math.PI)
      this.changeThickness(4)
      this.ctx_tmp.stroke()
      this.changeThickness(null)
   }

   private startLine = (e) => {
      this.getPosition(e)
      if (!this.last().some(path => {  //requiere array no modif
         if (path.type != "line") return
         if (this.overNode(path.points[0])) {
            [this.x0, this.y0] = [path.points[0].x, path.points[0].y]; return true
         }
         if (this.overNode(path.points[1])) {
            [this.x0, this.y0] = [path.points[1].x, path.points[1].y]; return true
         }
      })) {
         [this.x0, this.y0] = [this.x, this.y]
      }
      this.draw1Node(this.x0, this.y0, this.colorPicker.value)
   }

   private previewLine = (e: any) => {
      this.drawPaths()
      let p_x: any, p_y: any
      this.last().some(path => {
         if (path.type != "line") return
         if (this.overNode(path.points[0], 10)) {
            [p_x, p_y] = [path.points[0].x, path.points[0].y]
            return true
         } else if (this.overNode(path.points[1], 10)) {
            [p_x, p_y] = [path.points[1].x, path.points[1].y]
            return true
         }
      })
      this.getPosition(e)
      this.ctx_tmp.beginPath()
      this.ctx_tmp.moveTo(this.x0, this.y0)
      this.changeLineColor()
      this.ctx_tmp.lineTo(p_x || this.x, p_y || this.y)
      this.ctx_tmp.stroke()
   }

   private grabNode = (e) => {
      this.getPosition(e)
      this.last().some((path, i) => {
         if (path.type != "line") return //no interactuar consigo misma
         // if(path.type!="line" || (mode == "grab" && grabedNodes.some(node => node.i == i || (node.i != i && ((path.points[0].x == last()[node.i].points[node.j].x && path.points[0].y == last()[node.i].points[node.j].y) || (path.points[1].x == last()[node.i].points[node.j].x && path.points[1].y == last()[node.i].points[node.j].y)) )))) return //no interactuar consigo misma

         if (this.overNode(path.points[0])) {
            [this.x0, this.y0] = [path.points[0].x, path.points[0].y]
            this.grabedNodes.push({ i, j: 0 })
         }
         else if (this.overNode(path.points[1])) {
            [this.x0, this.y0] = [path.points[1].x, path.points[1].y]
            this.grabedNodes.push({ i, j: 1 })
         }
      })
   }

   private moveNode = (e: any) => {
      this.getPosition(e)
      if (!this.last().some((path, i) => {
         if (path.type != "line" || this.grabedNodes.some(node => node.i == i)) return //no interactuar consigo misma

         let p_x: any, p_y: any
         if (this.overNode(path.points[0], 10))
            [p_x, p_y] = [path.points[0].x, path.points[0].y]
         else if (this.overNode(path.points[1], 10))
            [p_x, p_y] = [path.points[1].x, path.points[1].y]
         this.grabedNodes.forEach(node => {
            this.last()[node.i].points[node.j] = { x: p_x || this.x, y: p_y || this.y }
         })
         this.ctx_tmp.strokeStyle = path.color
         if (this.overNode(path.points[0], 10) || this.overNode(path.points[1], 10)) return true
      }))
         this.grabedNodes.forEach(node => {
            this.last()[node.i].points[node.j] = { x: this.x, y: this.y }
         })
      this.drawPaths()
      this.drawNodes()
   }

   private startAction = (e: any) => {

      if (this.last().length > 17 && this.mode != "grab") return
      // var before = performance.now() 
      this.clicking = true
      this.x0 = this.x
      this.y0 = this.y
      if (this.mode == "paint") {
         this.getPosition(e)
         this.points = []
         this.points.push({ x: this.x, y: this.y })
      } else if (this.mode == "lines")
         this.startLine(e)
      else if (this.mode == "circles")
         this.startCircle(e)
      else if (this.mode == "grab")
         this.grabNode(e)
      this.clicking = true
      // console.log((performance.now()-before)/3)
   }

   private stopAction = (e: any) => {
      try {
         if (this.clicking) {
            if (this.hasDragged) {
               if (this.mode == "grab" && this.grabedNodes.length || this.mode != "grab") {
                  this.log.push([])
                  this.fillLastLog()
               }
               this.getPosition(e)
               if (this.mode == "lines" || this.mode == "grab" && this.grabedNodes.length) {
                  let p_x: any, p_y: any
                  // conectar con un nodo!
                  this.last().some((path) => {
                     if (path.type != "line") return //no interactuar consigo misma
                     // if(path.type!="line" || (mode == "grab" && grabedNodes.some(node => node.i == i || (node.i != i && ((path.points[0].x == last()[node.i].points[node.j].x && path.points[0].y == last()[node.i].points[node.j].y) || (path.points[1].x == last()[node.i].points[node.j].x && path.points[1].y == last()[node.i].points[node.j].y)) )))) return //no interactuar consigo misma

                     if (this.overNode(path.points[0])) {
                        [p_x, p_y] = [path.points[0].x, path.points[0].y]; return true
                     } else if (this.overNode(path.points[1])) {
                        [p_x, p_y] = [path.points[1].x, path.points[1].y]; return true
                     }
                  })
                  let origen = { x: this.x0, y: this.y0 }
                  let destino = { x: p_x || this.x, y: p_y || this.y }
                  if (this.mode == "lines")
                     this.last().push({ points: [origen, destino], type: "line", color: this.colorPicker.value, thickness: this.slider.value })
                  else if (this.mode == "grab") {
                     this.grabedNodes.forEach(node => {
                        this.last()[node.i].points[node.j] = destino
                        this.log[this.log.length - 2][node.i].points[node.j] = origen
                     })
                     this.grabedNodes = []
                  }
               } else if (this.mode == "paint")
                  this.last().push({ points: this.points, type: "raya", color: this.colorPicker.value, thickness: this.slider.value })
               else if (this.mode == "circles") {
                  this.midpoint(this.x0, this.y0, this.x, this.y)
                  this.last().push({ point: this.midpoint(this.x0, this.y0, this.x, this.y), radius: this.radius(this.x0, this.y0, this.x, this.y), type: "circle", color: this.colorPicker.value })
               }
               // else if(mode == "borrar")
               // console.log(log)
            }
         }
      } catch (e) { console.log(e) }
      this.x0 = 0; this.y0 = 0
      this.hasDragged = false
      this.clicking = false
      this.drawPaths()  // EN PRINCIPIO SOBRARÍA PERO NO HACE DAÑO
      if (this.mode != "paint") this.drawNodes()
      this.shortenLog()
   }

   // https://stackoverflow.com/questions/53960651/how-to-make-an-undo-function-in-canvas/53961111
   private sketch = (e: any) => {
      if (!this.clicking) return
      this.hasDragged = true
      if (this.mode == "paint") this.paint(e)
      // else if(mode == "borrar") erase(e)
      else if (this.mode == "lines") this.previewLine(e)
      else if (this.mode == "circles") this.previewCircle(e)
      else if (this.mode == "grab")
         if (this.grabedNodes.length) this.moveNode(e)
   }

   private paint = (e: any) => {
      [this.x0, this.y0] = [this.x, this.y]
      this.getPosition(e)
      // saving the points in the points array
      this.points.push({ x: this.x, y: this.y })
      this.ctx_tmp.beginPath()
      this.ctx_tmp.moveTo(this.x0, this.y0)
      this.ctx_tmp.lineTo(this.x, this.y)
      this.ctx_tmp.stroke()
   }

   // erase(e) {
   //     getPosition(e)
   //     last().some((path,i) => {   // con líneas va bastante bien ! rayas no xD desabilitao
   //        if(path.type=="line") {
   //             var xDist = x - path.points[0].x;
   //             var yDist = y - path.points[0].y;
   //             var dist = parseInt(Math.sqrt(xDist * xDist + yDist * yDist));
   //             var xDist_ = x - path.points[1].x;
   //             var yDist_ = y - path.points[1].y;
   //             var dist_ = parseInt(Math.sqrt(xDist_ * xDist_ + yDist_ * yDist_));

   //             var xDist__ = path.points[0].x - path.points[1].x;
   //             var yDist__ = path.points[0].y - path.points[1].y;
   //             var dist__ = parseInt(Math.sqrt(xDist__ * xDist__ + yDist__ * yDist__));
   //             if(dist__ == dist+dist_) {
   //                 log.push([])
   //                 fillLastLog()
   //                 last().splice(i,1)
   //                 return true
   //             }
   //         } else if(path.type=="raya") {
   //             path.points.forEach(punto=>{
   //                 if(punto.x=x && punto.y==y){
   //                     log.push([])
   //                     fillLastLog()
   //                     last().splice(i,1)
   //                     return true
   //                 }
   //             })
   //         }
   //     })
   //     drawPaths()
   //     drawNodes()
   // }

   private drawPaths = () => {
      this.ctx_tmp.clearRect(0, 0, this.c_tmp.width, this.c_tmp.height)
      try {
         this.last().forEach(path => {
            if (path.type == "circle") {
               this.ctx_tmp.beginPath()
               this.ctx_tmp.strokeStyle = path.color
               this.ctx_tmp.arc(...path.point, path.radius, 0, 2 * Math.PI)
               this.changeThickness(4)
               this.ctx_tmp.stroke()
               return
            }
            this.ctx_tmp.lineWidth = path.thickness
            this.ctx_tmp.strokeStyle = path.color
            this.ctx_tmp.beginPath()
            this.ctx_tmp.moveTo(path.points[0].x, path.points[0].y)
            for (let i = 1; i < path.points.length; i++) {
               this.ctx_tmp.lineTo(path.points[i].x, path.points[i].y)
            }
            this.ctx_tmp.stroke()
            // changeColor()
         })
      } catch (e) { console.log("error al dibujar los elementos!: \n" + e) }
      this.changeColor()
      this.changeThickness(null)
   }
   
   private midpoint = (x1: any, y1: any, x2: any, y2: any) => {
      return [(x1 + x2) / 2, (y1 + y2) / 2]
   }

   private radius = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.hypot(x2 - x1, y2 - y1) / 2
   }

   // https://stackoverflow.com/questions/56147279/how-to-find-angle-between-two-vectors-on-canvas
   private draw1Angle = (point0: { y: number; x: number; }, point1: { y: number; x: number; }, point2: { y: number; x: number; }, color: string) => { //, i, i_, j, j_
      this.ctx_nodes.beginPath()
      this.ctx_nodes.globalCompositeOperation = 'destination-out'
      let firstAngle = Math.atan2(point1.y - point0.y, point1.x - point0.x)
      let seconAngle = Math.atan2(point2.y - point0.y, point2.x - point0.x)

      let angle = seconAngle - firstAngle
      angle *= 180 / Math.PI

      if (Math.abs(angle) < 15) return  // sirve además para quitar los ángulos complementarios y x lo tanto que no se repita

      let order = angle >= 180 || angle <= 0 && angle >= -180 ? [seconAngle, firstAngle] : [firstAngle, seconAngle]

      if (Math.abs(angle) > 180) angle = 360 - Math.abs(angle)

      this.ctx_nodes.moveTo(point0.x, point0.y)
      this.ctx_nodes.arc(point0.x, point0.y, 3 * this.nodeRadius + 500 / Math.abs(angle), ...order)
      this.ctx_nodes.closePath()
      this.ctx_nodes.fillStyle = 'black'
      this.ctx_nodes.fill()
      // ctx_nodes.stroke()
      this.ctx_nodes.globalCompositeOperation = 'source-over'
      this.ctx_nodes.fillStyle = color + "50"
      this.ctx_nodes.fill()
      this.ctx_nodes.fillStyle = "black"
      this.ctx_nodes.font = "20px Arial"

      let angulo_txt = (order[0] + order[1]) / 2

      if (order[1] < 0 && order[0] > 0 && angulo_txt < 0) {
         angulo_txt = (order[0] + order[1]) / 2 - Math.PI
      } else if (order[1] < 0 && order[0] > 0 && angulo_txt > 0) {
         angulo_txt = (order[0] + order[1]) / 2 + Math.PI
      }
      let x_txt: number, y_txt: number
      [x_txt, y_txt] = this.calcularPosTexto(point0.x, point0.y, angulo_txt, 5 * this.nodeRadius + 600 / Math.abs(angle))

      this.ctx_nodes.textAlign = "center"
      this.ctx_nodes.textBaseline = 'middle'
      this.ctx_nodes.fillText(Math.trunc(Math.abs(angle)) + "º", x_txt, y_txt)
      this.ctx_nodes.fillStyle = "white"
      this.ctx_nodes.fillText(Math.trunc(Math.abs(angle)) + "º", x_txt + 1, y_txt + 1)
   }

   // https://stackoverflow.com/questions/14829621/formula-to-find-points-on-the-circumference-of-a-circle-given-the-center-of-the
   private calcularPosTexto = (x0: number, y0: number, alpha: number, r: number) => {
      let x = Math.cos(alpha) * r + x0
      let y = Math.sin(alpha) * r + y0
      return [x, y]
   }

   private draw1Node = (x: any, y: any, color: string) => {
      this.ctx_nodes.beginPath()
      this.ctx_nodes.globalCompositeOperation = 'destination-out'
      this.ctx_nodes.arc(x, y, this.nodeRadius, 0, 2 * Math.PI)
      this.ctx_nodes.fillStyle = 'black'
      this.ctx_nodes.fill()
      this.ctx_nodes.globalCompositeOperation = 'source-over'
      this.ctx_nodes.fillStyle = color + "50"
      this.ctx_nodes.fill()
   }

   private drawNodes = () => {
      this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      let pairs = []
      this.last().some((path, i) => {
         if (path.type != "line") return
         path.points.forEach((point: { x: any; y: any; }) => {
            this.draw1Node(point.x, point.y, path.color)
         })

         this.last().some((path_, j) => {
            if (j == i || path_.type != "line") return
            // if(pairs.includes(i+/./) || pairs.includes(j+/./)) return  // para que no dibuje dos veces lo mismo
            if (path.points[1].x == path_.points[0].x && path.points[1].y == path_.points[0].y) {
               if (pairs.includes(i.toString() + 1) || pairs.includes(j.toString() + 0)) return
               this.draw1Angle(path.points[1], path.points[0], path_.points[1], path.color)
               pairs.push(i.toString() + 1); pairs.push(j.toString() + 0)
            } else if (path.points[1].x == path_.points[1].x && path.points[1].y == path_.points[1].y) {
               if (pairs.includes(i.toString() + 1) || pairs.includes(j.toString() + 1)) return
               this.draw1Angle(path.points[1], path.points[0], path_.points[0], path.color)
               pairs.push(i.toString() + 1); pairs.push(j.toString() + 1)
            } else if (path.points[0].x == path_.points[0].x && path.points[0].y == path_.points[0].y) {
               if (pairs.includes(i.toString() + 0) || pairs.includes(j.toString() + 0)) return
               this.draw1Angle(path.points[0], path.points[1], path_.points[1], path.color)
               pairs.push(i.toString() + 0); pairs.push(j.toString() + 0)
            } else if (path.points[0].x == path_.points[1].x && path.points[0].y == path_.points[1].y) {
               if (pairs.includes(i.toString() + 0) || pairs.includes(j.toString() + 1)) return
               this.draw1Angle(path.points[0], path.points[1], path_.points[0], path.color)
               pairs.push(i.toString() + 0); pairs.push(j.toString() + 1)
            }
         })
      })
   }

   private getPosition = (e: { type: string; originalEvent: any; clientX: number; clientY: number; }) => {
      var rect = this.c_tmp.getBoundingClientRect()
      if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
         var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent
         var touch = evt.touches[0] || evt.changedTouches[0]

         this.x = touch.pageX - rect.left
         this.y = touch.pageY - rect.top
      } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover' || e.type == 'mouseout' || e.type == 'mouseenter' || e.type == 'mouseleave') {
         this.x = e.clientX - rect.left
         this.y = e.clientY - rect.top
      }
   }

   private overNode = (point: { x: number; y: number; }, holgura = 20) => {
      let xDiff = point.x - this.x
      let yDiff = point.y - this.y

      return Math.sqrt(xDiff * xDiff + yDiff * yDiff) < this.nodeRadius + holgura
   }

   private changeColor = () => {
      let color = "#"
      if (this.colorPicker.value.substr(1, 2) < 7) color += "11"
      else color += this.colorPicker.value.substr(1, 2)
      if (this.colorPicker.value.substr(3, 2) < 7) color += "11"
      else color += this.colorPicker.value.substr(3, 2)
      if (this.colorPicker.value.substr(5, 2) < 7) color += "11"
      else color += this.colorPicker.value.substr(5, 2)

      this.ctx_tmp.strokeStyle = color
      this.colorPicker.value = color
   }

   private changeThickness = (thickness: number) => { this.ctx_tmp.lineWidth = thickness || this.slider.value }

   private changeLineColor = () => {
      let color = "#"
      let r = (parseInt(parseInt(this.colorPicker.value.substr(1, 2), 16).toString(10), 10))
      let g = (parseInt(parseInt(this.colorPicker.value.substr(3, 2), 16).toString(10), 10))
      let b = (parseInt(parseInt(this.colorPicker.value.substr(5, 2), 16).toString(10), 10))
      let c_shift = 40
      if (r > 125) {
         if ((r - c_shift).toString(16).length < 2) color += "0"
         color += (r - c_shift).toString(16)
      } else {
         if ((r + c_shift).toString(16).length < 2) color += "0"
         color += (r + c_shift).toString(16)
      }
      if (g > 125) {
         if ((g - c_shift).toString(16).length < 2) color += "0"
         color += (g - c_shift).toString(16)
      } else {
         if ((g + c_shift).toString(16).length < 2) color += "0"
         color += (g + c_shift).toString(16)
      }
      if (b > 125) {
         if ((b - c_shift).toString(16).length < 2) color += "0"
         color += (b - c_shift).toString(16)
      } else {
         if ((b + c_shift).toString(16).length < 2) color += "0"
         color += (b + c_shift).toString(16)
      }
      this.ctx_tmp.strokeStyle = color
   }

   public selectMode = (clickedMode: any) => {
      this.computeFrame(true)

      if (this.mode == clickedMode) this.btnGrab.click()
      else this.mode = clickedMode
      if (this.mode == "paint" || this.mode == "circle") this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      else this.drawNodes()
   }

   private last = () => { return this.log[this.log.length - 1] || [] }

   private fillLastLog = () => { //los arrays solo se puede copiar así 
      this.log[this.log.length - 2].forEach((path, i) => {
         if (path.type == "circle") {
            this.log[this.log.length - 1].push({ point: [...path.point], radius: path.radius, type: path.type, color: path.color })
            return
         }
         this.log[this.log.length - 1].push({ points: [], type: path.type, color: path.color, thickness: path.thickness })
         path.points.forEach((punto: { x: any; y: any; }) => {
            this.log[this.log.length - 1][i].points.push({ x: punto.x, y: punto.y })
         })
      })
   }

   private shortenLog = () => {
      if (this.log.length > 30)
         this.log.splice(0, 3)
   }

   public undo = () => {
      if (this.log.length == 1) return
      this.log.pop()
      this.drawPaths()
      if (this.mode == "paint" || this.mode == "circle") this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      else this.drawNodes()
   }

   public clearCanvas = () => {
      if (!this.last().length) return
      this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      this.ctx_tmp.clearRect(0, 0, this.c_tmp.width, this.c_tmp.height)
      this.log.push([])
   }

   public next = () => {
      if (this.video_in.className == "hidden_video" && this.video_out.className == "hidden_video") {
         this.video_in.className = "video"
      } else if (this.video_in.className == "video") {
         this.video_in.className = "hidden_video"
         this.video_out.className = "video"
      } else {
         this.video_out.className = "hidden_video"
      }
   }
}