import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { VideoResultPreviewerPage } from './video-result-previewer/video-result-previewer.page';

@Component({
   selector: 'video-analyzer',
   templateUrl: './video-analyzer.page.html',
   styleUrls: ['./video-analyzer.page.scss'],
})
export class VideoAnalyzerPage {
   btnPaint: HTMLElement
   btnLines: HTMLElement
   btnGrab: HTMLElement
   btnErase: HTMLElement
   btnRecord: HTMLElement
   btnClear: HTMLElement;
   btnUndo: HTMLElement;

   slider: any
   colorPicker: any
   mode: string
   video_in: any
   c_out: any
   ctx_out: any
   c_tmp: any
   ctx_tmp: any
   c_nodes: any
   ctx_nodes: any
   canvasContainer: any
   canvas_height: number
   
   timelineNob: any;

   points: any = []
   x: number  // x e y tras getPosition
   y: number
   x0: number // x e y inicial (asignados una vez x línea/círculo)
   y0: number
   
   clicking: boolean = false
   hasDragged = false

   log = [[]] // historial de dibujado

   grabedNodes = []
   nodeRadius = 11

   mediaRecorder: MediaRecorder
   recording = false

   // timelineTiles = (i) => Array(100) 
   duration: number = 0
   onTimeline: boolean;
   /**
      valor adimensional
    */
   speed: number = 500
   timelineTiles = () => Array(300) 



   constructor(private modalController: ModalController, private actRoute: ActivatedRoute) { }
   
   ionViewWillEnter() {
      this.actRoute.queryParams.subscribe(params => {
         console.log("params.src: ", params.src);
         if(!params.src) {  // realmente checkeaar si la ruta da a un vídeo real 
            window.history.back()
            return
         }
         this.video_in = document.getElementById('video_in')
         this.video_in.src = params.src
      })
      this.slider = document.getElementById('slider')
      this.colorPicker = document.getElementById("colorPicker")

      this.c_out = document.getElementById('output-canvas')
      this.ctx_out = this.c_out.getContext('2d')

      this.c_tmp = document.getElementById('temp-canvas')
      this.c_nodes = document.getElementById('nodes-canvas')
      this.canvasContainer = document.getElementById('canvas-container')
      this.ctx_tmp = this.c_tmp.getContext('2d')
      this.ctx_nodes = this.c_nodes.getContext('2d')

      this.ctx_out.drawImage(this.c_tmp, 0, 0)

      this.btnPaint = document.getElementById('modePaint')
      this.btnLines = document.getElementById('modeLines')
      this.btnGrab = document.getElementById('modeGrab')
      this.btnErase = document.getElementById('modeErase')
      this.btnRecord = document.getElementById('videoRecord')

      this.canvasContainer.ontouchstart = this.startAction
      this.canvasContainer.ontouchleave = this.stopAction
      this.canvasContainer.ontouchcance = this.stopAction
      this.canvasContainer.ontouchend = this.stopAction
      this.canvasContainer.ontouchmove = this.sketch

      this.canvasContainer.onmousedown = this.startAction
      this.canvasContainer.onmouseup = this.stopAction
      this.canvasContainer.onmouseleave = this.stopAction
      this.canvasContainer.onmousemove = this.sketch

      this.timelineNob = document.getElementById('timelineNob')

      this.slider.addEventListener('input', this.changeThickness)
      this.colorPicker.addEventListener('input', this.changeColor)


      // velocidad del video
      this.video_in.playbackRate = 1

      this.video_in.addEventListener('play', this.prepareCanvas)
      this.btnRecord.addEventListener('click', () => {
         if (this.recording) this.stopRecording()
         else this.startRecording()
      })
   }

    //////  DOCS  //////
   // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
   // CODECS https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter
   async startRecording() {
      console.log("recording");
      let devices = navigator.mediaDevices
      console.log("navigator: ", navigator);
      console.log("devices: ", !devices?'no devices':devices)
      // devices.enumerateDevices().then(devices => {
      //    devices.forEach(device => { console.log(device.kind.toUpperCase(), device.label) })
      // }).catch(err => { console.log(err.name, err.message. err) })
      // console.log(MediaRecorder.isTypeSupported('video/webm;codecs=h264'))
      
      const audioStream = await devices.getUserMedia({
         audio: true,
         video: false
      })
      const canvasStream = this.c_out.captureStream(40 /*fps*/)
      const combinedStream = new MediaStream([
         ...audioStream.getAudioTracks(), ...canvasStream.getVideoTracks()
      ])
      
      const options = { 
         bitsPerSecond: 812800000,  //Clamping calculated audio bitrate (800000bps) to the maximum (128000bps)
         audioBitsPerSecond: 128000, // A EDITAR!
         videoBitsPerSecond: 800000000,
         mimeType: 'video/webm; codecs=vp9' 
      } // codecs=vp9
      
      this.mediaRecorder = new MediaRecorder(combinedStream, options)
      let chunks = []

      this.mediaRecorder.ondataavailable = async (ev: any) => {
         if(ev.data && ev.data.size > 0) 
            chunks.push(ev.data)
      }
      // https://gist.github.com/AVGP/4c2ce4ab3c67760a0f30a9d54544a060
      // https://www.npmjs.com/package/webm-to-mp4
      // ffmpeg -i input.webm -preset superfast output.mp4 !!! seguramente lo mejor
      // INVESTIGAR: https://github.com/spite/ccapture.js/
      // https://www.npmjs.com/package/ts-ebml
      this.mediaRecorder.onstop = (ev) => {
         const blob = new Blob(chunks, { 'type': 'video/webm;' })
         const src =   window.URL.createObjectURL(blob)
         // que pase al vídeo resultado !!!
         this.openVideoResultModal(src)
         // this.video_in.className = "hidden_video"
      }
      this.mediaRecorder.start()
   }

   stopRecording() {
      console.log("recording stopped");
      setTimeout( _ => {    // xq deja de grabar bastante antes
         this.mediaRecorder.stop()
         this.mediaRecorder = null
      }, 10)
   }

   async openVideoResultModal(src:string) {
      const modal = await this.modalController.create({
         component: VideoResultPreviewerPage,
         componentProps: { src }
      })
      await modal.present()

      modal.onDidDismiss().then(({data: hasCanceled}) => {
         if (hasCanceled) {
            this.clearCanvas()
            this.log = [[]]
         }
      })
   }

   prepareCanvas = () => {
      // FULL SCREEN WIDTH Y ALTURA PROPORCIONAL      
      this.video_in.currentTime = 1000
      this.video_in.play().then(()=>{
         this.duration = this.video_in.currentTime
         this.video_in.currentTime = 0.01
         console.log("duration: ", this.duration);
         this.timelineNob.style.width = this.duration*this.speed +'px'
         this.timelineNob.style.right = -this.duration*this.speed +'px'
      })

      this.canvas_height = (this.video_in.videoHeight/this.video_in.videoWidth)*window.innerWidth
      this.video_in.removeEventListener('play', this.prepareCanvas)
      this.video_in.muted = true  //hay q hacerlo manual xq en html no va

      this.c_out.setAttribute('width', window.innerWidth) // *2
      this.c_out.setAttribute('height', this.canvas_height) // *2

      this.c_tmp.setAttribute('width', window.innerWidth) // *2
      this.c_tmp.setAttribute('height', this.canvas_height) // *2

      this.c_nodes.setAttribute('width', window.innerWidth) // *2
      this.c_nodes.setAttribute('height', this.canvas_height) // *2

      this.canvasContainer.setAttribute('width', window.innerWidth) // *2
      this.canvasContainer.setAttribute('height', this.canvas_height) // *2

      this.timelineNob.addEventListener('touchstart', (e:any) => {
         this.momentum = []
         this.onTimeline = true
         this.getPosition(e)
      })
      this.timelineNob.ontouchend = this.timelineNob.onmouseup = (() => {
         this.applyMomentum(this.momentum.length ? this.momentum.reduce((a,b)=> a*0.8+b)/5 : 0, 10)
         console.log("this.momentum.reduce((a,b)=> a*0.8+b)/5: ", this.momentum.reduce((a,b)=> a*0.8+b)/5);
         this.onTimeline = false
      })
      this.timelineNob.ontouchmove = this.timelineNob.onmousemove = this.manualTimelineFlow

      this.changeThickness(null)
      this.ctx_tmp.strokeStyle = this.colorPicker.value
      this.ctx_tmp.lineCap = 'round'
      this.ctx_nodes.lineWidth = this.slider.value
      this.btnLines.click()  // botón presionado inicial!

      this.computeFrame()
      this.speed = 150

      this.autoTimelineFlow()
   }

   momentum = []
// no está bien hecha  :(  pero casi
   applyMomentum = (momentum:number,i:number) => {
      console.log("momentum: ", momentum);
      let newPosition = Number(this.timelineNob.style.right.substring(0,this.timelineNob.style.right.length-2))+momentum;
      this.timelineNob.style.right = `${newPosition}px`
      // cambiar tiempo respecto a la posicion del timeline

      let newMoment = Math.round( newPosition/this.speed * 100) / 100;
      
      this.video_in.currentTime = newMoment 
      if(i==0) return
      setTimeout(()=>this.applyMomentum(momentum*0.9,--i), 23)
   }

   autoTimelineFlow = () => {
      if(!this.video_in.paused || !this.onTimeline) {
         let curr = this.video_in.currentTime*this.speed
         this.timelineNob.style.right = `${curr}px`
      }
      setTimeout(this.autoTimelineFlow,23) // esto dicta los fps
   }

   manualTimelineFlow = async (e) => {
      if(!this.onTimeline) return
      this.video_in.pause()

      let x = this.x
      this.getPosition(e)
      // recorrido desde que he comenzado a tocar hasta que he movido el dedo
      let increment = x - this.x

      let newPosition = Number(this.timelineNob.style.right.substring(0,this.timelineNob.style.right.length-2))+increment
      this.timelineNob.style.right = `${newPosition}px`
      console.log("this.momentum: ", this.momentum);
      console.log("increment: ", increment);
      let sum = this.momentum.length ? this.momentum.reduce((a,b)=>a+b)/10 : 0
      if((sum<=0 && increment<=0) || (sum>=0 && increment>=0))
         this.momentum.push(increment)
      else 
         this.momentum = []

      // cambiar tiempo respecto a la posicion del timeline
      let newMoment = Math.round( newPosition/this.speed * 100) / 100;

      if(Math.round(this.video_in.currentTime*100) / 100 == newMoment) return
      if(newMoment > this.duration) newMoment = newMoment - this.duration
      if(newMoment < 0) newMoment = this.duration - newMoment

      this.video_in.currentTime = newMoment 
   }

   computeFrame = () => {
      // if (video_in.paused || video_in.ended) { return  }
      this.ctx_out.drawImage(this.video_in, 0, 0, this.video_in.getBoundingClientRect().width, this.video_in.getBoundingClientRect().height)
      this.ctx_out.drawImage(this.c_tmp, 0, 0)
      this.ctx_out.drawImage(this.c_nodes, 0, 0)
      setTimeout(this.computeFrame, 0)
   }

   startCircle = (e) => {
      this.getPosition(e)
      this.x0 = this.x
      this.y0 = this.y
   }

   previewCircle = (e: any) => {
      this.drawPaths()
      this.ctx_tmp.beginPath()
      this.getPosition(e)
      this.ctx_tmp.arc(
         ...this.midpoint(this.x0, this.y0, this.x, this.y), 
         this.radius(this.x0, this.y0, this.x, this.y), 0, 2 * Math.PI
      )
      this.changeThickness(null)
      this.ctx_tmp.stroke()
   }

   startLine = (e) => {
      this.getPosition(e)
      if(!this.last().some(path => {  //requiere array no modif
            if (path.type != "line") return
            if (this.overNode(path.points[0])) {
               [this.x0, this.y0] = [path.points[0].x, path.points[0].y]; return true
            }
            if (this.overNode(path.points[1])) {
               [this.x0, this.y0] = [path.points[1].x, path.points[1].y]; return true
            }
         })
      ) {
         [this.x0, this.y0] = [this.x, this.y]
      }
      this.draw1Node(this.x0, this.y0, this.colorPicker.value)
   }

   previewLine = (e: any) => {
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

   grabNode = (e) => {
      this.getPosition(e)
      this.last().some((path, i) => {
         if (path.type != "line") return //no interactuar consigo misma

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

   moveNode = (e: any) => {
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

  
   startAction = (e) => {
         //num máximo de elementos 
         console.log("e: ", e);
      if (e.targetTouches.length == 2 && e.changedTouches.length == 2) {
         this.start_handler(e)
         return
      }
      if (this.last().length > 27 && this.mode != "grab") return
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

   stopAction = (e: any) => {
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
                  this.last().push({ point: this.midpoint(this.x0, this.y0, this.x, this.y), radius: this.radius(this.x0, this.y0, this.x, this.y), type: "circle", color: this.colorPicker.value, thickness: this.slider.value })
               }
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
   sketch = (e: any) => {
      if (!this.clicking) return
      this.hasDragged = true
      if (this.mode == "paint") this.paint(e)
      // else if(mode == "borrar") erase(e)
      else if (this.mode == "lines") this.previewLine(e)
      else if (this.mode == "circles") this.previewCircle(e)
      else if (this.mode == "grab")
         if (this.grabedNodes.length) this.moveNode(e)
   }

   paint = (e: any) => {
      [this.x0, this.y0] = [this.x, this.y]
      this.getPosition(e)
      // saving the points in the points array
      this.points.push({ x: this.x, y: this.y })
      this.ctx_tmp.beginPath()
      this.ctx_tmp.moveTo(this.x0, this.y0)
      this.ctx_tmp.lineTo(this.x, this.y)
      this.ctx_tmp.stroke()
   }

   drawPaths = () => {
      this.ctx_tmp.clearRect(0, 0, this.c_tmp.width, this.c_tmp.height)
      try {
         this.last().forEach(path => {
            if (path.type == "circle") {
               this.ctx_tmp.beginPath()
               this.ctx_tmp.strokeStyle = path.color
               this.ctx_tmp.arc(...path.point, path.radius, 0, 2 * Math.PI)
               this.changeThickness(path.thickness)
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
   
   midpoint = (x1: any, y1: any, x2: any, y2: any) => {
      return [(x1 + x2) / 2, (y1 + y2) / 2]
   }

   radius = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.hypot(x2 - x1, y2 - y1) / 2
   }

   // https://stackoverflow.com/questions/56147279/how-to-find-angle-between-two-vectors-on-canvas
   draw1Angle = (point0: { y: number; x: number; }, point1: { y: number; x: number; }, point2: { y: number; x: number; }, color: string) => { //, i, i_, j, j_
      this.ctx_nodes.beginPath()
      this.ctx_nodes.globalCompositeOperation = 'destination-out'
      let firstAngle = Math.atan2(point1.y - point0.y, point1.x - point0.x)
      let seconAngle = Math.atan2(point2.y - point0.y, point2.x - point0.x)

      let angle = seconAngle - firstAngle
      angle *= 180 / Math.PI

      if (Math.abs(angle) < 15) return  // sirve además para quitar los ángulos complementarios y que no se repitan

      let order = angle >= 180 || angle <= 0 && angle >= -180 ? 
                    [seconAngle, firstAngle] : [firstAngle, seconAngle]

      if (Math.abs(angle) > 180) angle = 360 - Math.abs(angle)

      this.ctx_nodes.moveTo(point0.x, point0.y)
      this.ctx_nodes.arc(point0.x, point0.y, 3 * this.nodeRadius + 500 / Math.abs(angle), ...order)
      this.ctx_nodes.closePath()
      this.ctx_nodes.fillStyle = 'black' // black no es black, es para que on se superponga
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
   calcularPosTexto = (x0: number, y0: number, alpha: number, r: number) => {
      let x = Math.cos(alpha) * r + x0
      let y = Math.sin(alpha) * r + y0
      return [x, y]
   }

   draw1Node = (x: any, y: any, color: string) => {
      this.ctx_nodes.beginPath()
      this.ctx_nodes.globalCompositeOperation = 'destination-out'
      this.ctx_nodes.arc(x, y, this.nodeRadius, 0, 2 * Math.PI)
      this.ctx_nodes.fillStyle = 'black'
      this.ctx_nodes.fill()
      this.ctx_nodes.globalCompositeOperation = 'source-over'
      this.ctx_nodes.fillStyle = color + "50"
      this.ctx_nodes.fill()
   }

   drawNodes = () => {
      // setTimeout(() => {
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
      // }, 0)
   }

   getPosition = (e: { type: string; originalEvent: any; clientX: number; clientY: number; }) => {
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

   overNode = (point: { x: number; y: number; }, holgura = 20) => {
      let xDiff = point.x - this.x
      let yDiff = point.y - this.y

      return Math.sqrt(xDiff * xDiff + yDiff * yDiff) < this.nodeRadius + holgura
   }

   changeColor = () => {
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

   changeThickness = (thickness: number) => { this.ctx_tmp.lineWidth = thickness || this.slider.value }

   changeLineColor = () => {
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

   selectMode = (clickedMode: string) => {
      if (this.mode == clickedMode) this.btnGrab.click()
      else this.mode = clickedMode
      if (this.mode == "paint" || this.mode == "circle") 
         this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      else this.drawNodes()
   }

   // retorna la referencia a la última versión(log) del canvas
   last = () => { return this.log[this.log.length - 1] || [] }

   fillLastLog = () => { // los arrays solo se puede copiar así 
      this.log[this.log.length - 2].forEach((path, i) => {
         if (path.type == "circle") {
            this.log[this.log.length - 1].push({ point: [...path.point], radius: path.radius, type: path.type, color: path.color, thickness: path.thickness })
            return
         }
         this.log[this.log.length - 1].push({ points: [], type: path.type, color: path.color, thickness: path.thickness })
         path.points.forEach((punto: { x: any; y: any; }) => {
            this.log[this.log.length - 1][i].points.push({ x: punto.x, y: punto.y })
         })
      })
   }

   shortenLog = () => {
      if (this.log.length > 30)
         this.log.splice(0, 3)
   }

   undo = () => {
      if (this.log.length == 1) return
      this.log.pop()
      this.drawPaths()
      if (this.mode == "paint" || this.mode == "circle") this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      else this.drawNodes()
   }

   clearCanvas = () => {
      if (!this.last().length) return
      this.ctx_nodes.clearRect(0, 0, this.c_nodes.width, this.c_nodes.height)
      this.ctx_tmp.clearRect(0, 0, this.c_tmp.width, this.c_tmp.height)
      this.log.push([])
   }  


// // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Multi-touch_interaction
// // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Multi-touch_interaction
   
// //  // Log events flaghttps://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Multi-touch_interaction
    logEvents = false
    // Touch Point cache
    tpCache = new Array()
    private handle_pinch_zoom(e: any) {
       // Check if the two target touches are the same ones that started the 2-touch
       var point1 = -1, point2 = -1;
       for (var i = 0; i < this.tpCache.length; i++) {
          if (this.tpCache[i].identifier == e.targetTouches[0].identifier)
             point1 = i;
          if (this.tpCache[i].identifier == e.targetTouches[1].identifier)
             point2 = i;
       }
       if (point1 >=0 && point2 >= 0) {
          // Calculate the difference between the start and move coordinates
          var diff1 = Math.abs(this.tpCache[point1].clientX - e.targetTouches[0].clientX);
          var diff2 = Math.abs(this.tpCache[point2].clientX - e.targetTouches[1].clientX);
     
          // This threshold is device dependent as well as application specific
          var PINCH_THRESHOLD = e.target.clientWidth / 10;
          if (diff1 >= PINCH_THRESHOLD && diff2 >= PINCH_THRESHOLD)
              e.target.style.background = "green";
        }
        else {
          // empty tpCache
          this.tpCache = new Array();
        }
    }
 
    start_handler = (ev) => {
       ev.preventDefault();
       // Cache the touch points for later processing of 2-touch pinch/zoom
       if (ev.targetTouches.length == 2) {
         for (var i=0; i < ev.targetTouches.length; i++) {
           this.tpCache.push(ev.targetTouches[i]);
         }
       }
       if (this.logEvents) console.log("touchStart", ev, true);
       this.update_background(ev);
      }
 
      move_handler = (ev) => {
       ev.preventDefault();
       if (this.logEvents) console.log("touchMove", ev, false);
       // To avoid too much color flashing many touchmove events are started,
       // don't update the background if two touch points are active
       if (!(ev.touches.length == 2 && ev.targetTouches.length == 2))
         this.update_background(ev);
      
       // Set the target element's border to dashed to give a clear visual
       // indication the element received a move event.
       ev.target.style.border = "dashed";
      
       // Check this event for 2-touch Move/Pinch/Zoom gesture
       this.handle_pinch_zoom(ev);
      }
      
      end_handler = (ev) => {
       ev.preventDefault();
       if (this.logEvents) console.log(ev.type, ev, false);
       if (ev.targetTouches.length == 0) {
         // Restore background and border to original values
         ev.target.style.background = "white";
         ev.target.style.border = "1px solid black";
       }
     }
 
     update_background = (ev) => {
       switch (ev.targetTouches.length) {
         case 1:
           // Single tap`
           ev.target.style.background = "yellow";
           break;
         case 2:
           // Two simultaneous touches
           ev.target.style.background = "pink";
           break;
         default:
           // More than two simultaneous touches
           ev.target.style.background = "lightblue";
       }
      }
}