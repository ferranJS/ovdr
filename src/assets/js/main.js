
let btn_pintar, btn_lineas, btn_grab, btn_borrar, slider, colorPicker, modo
let video_in, video_out, c_out, ctx_out, c_tmp, ctx_tmp, c_nodes, ctx_nodes, canvasContainer
let points = []
let x, y 
let x0, y0  // previous mouse click
let clicking = false
let hasDragged = false

let log = [[]]

function init() {

    slider = document.getElementById('slider')
    colorPicker = document.getElementById("colorPicker")

    video_in = document.getElementById('video_in')
    video_out = document.getElementById('video_out')

    c_out = document.getElementById('output-canvas')
    ctx_out = c_out.getContext('2d')

    c_tmp = document.getElementById('temp-canvas')
    c_nodes = document.getElementById('nodes-canvas')
    canvasContainer = document.getElementById('canvas-container')
    ctx_tmp = c_tmp.getContext('2d')
    ctx_nodes = c_nodes.getContext('2d')

    ctx_out.drawImage(c_tmp, 0, 0)
    // c_tmp.style.zIndex = 99

    btn_pintar = document.getElementById('modoPintar')
    btn_lineas = document.getElementById('modoLineas')
    btn_borrar = document.getElementById('modoBorrar')
    btn_grab = document.getElementById('modoGrab')

    canvasContainer.addEventListener('touchstart', startAction)
    canvasContainer.addEventListener('touchleave', stopAction)
    canvasContainer.addEventListener('touchcancel', stopAction)
    canvasContainer.addEventListener('touchend', stopAction)

    canvasContainer.addEventListener('touchmove', sketch)
    
    canvasContainer.addEventListener('mousedown', startAction)
    canvasContainer.addEventListener('mouseup', stopAction)
    canvasContainer.addEventListener('mouseleave', stopAction)
    canvasContainer.addEventListener('mousemove', sketch)

    slider.addEventListener('input', changeGrosor)

    colorPicker.addEventListener('input', changeColor)

    // velocidad del video
    video_in.playbackRate = 1
    initRecorder()
    video_in.addEventListener('play', prepareCanvas)
}

function prepareCanvas() {
    c_out.setAttribute('width', video_in.videoWidth) // *2
    c_out.setAttribute('height', video_in.videoHeight) // *2

    c_tmp.setAttribute('width', video_in.videoWidth) // *2
    c_tmp.setAttribute('height', video_in.videoHeight) // *2

    c_nodes.setAttribute('width', video_in.videoWidth) // *2
    c_nodes.setAttribute('height', video_in.videoHeight) // *2

    canvasContainer.setAttribute('width', video_in.videoWidth) // *2
    canvasContainer.setAttribute('height', video_in.videoHeight) // *2

    changeGrosor()
    ctx_tmp.strokeStyle = colorPicker.value
    ctx_tmp.lineCap = 'round'
    ctx_nodes.lineWidth = slider.value
 
    btn_lineas.click()  // botón presionado inicial!

    // video_in.removeEventListener('play', prepareCanvas)
    computeFrame()
}

function computeFrame(once=false) {
    // if (video_in.paused || video_in.ended) { return  }

    ctx_out.drawImage(video_in, 0, 0, video_in.videoWidth, video_in.videoHeight)
    // ctx_out.drawImage(video_in, 0, 0, video_in.videoWidth*2, video_in.videoHeight*2, 0, 0, video_in.videoWidth*4, video_in.videoHeight*4)
    
    // let frame = ctx_out.reateImageData()    //no
    // let frame = document.createElement('ImageData')
    let frame = new Image()
    // let frame = new ImageData(video_in.videoWidth, video_in.videoHeight)
    frame.crossOrigin = "anonymous"

    // ctx_out.drawImage(c_nodes, 0, 0, video_in.videoWidth*2, video_in.videoHeight*2, 0, 0, video_in.videoWidth*4, video_in.videoHeight*4)
    // ctx_out.drawImage(c_tmp, 0, 0, video_in.videoWidth*2, video_in.videoHeight*2, 0, 0, video_in.videoWidth*4, video_in.videoHeight*4)
    ctx_out.drawImage(c_tmp, 0, 0)
    ctx_out.drawImage(c_nodes, 0, 0)
    if(once) return
    setTimeout(computeFrame, 0)
}

function startAction(e) {
    if(last().length > 17 && modo != "grab") return
    clicking = true
    [x0, y0] = [x, y] 
    getPosition(e)
    if(modo == "paint") {
        points = []
        points.push({ x, y })
    } else if(modo == "lines")
        startLine(e)    
    else if(modo == "circles")
        startCircle(e)
    else if(modo == "grab")
        grabNode(e)
}

function stopAction(e) {
    try {
    if (clicking) {
        if(hasDragged) {
            if(modo == "grab" && grabedNodes.length || modo != "grab") {
                log.push([])
                fillLastLog()
            }
            getPosition(e)
            if(modo == "lines" || modo == "grab" && grabedNodes.length) {
                let p_x, p_y
                // conectar con un nodo!
                last().some((path) => {
                    if(path.type!="line") return //no interactuar consigo misma
                    // if(path.type!="line" || (modo == "grab" && grabedNodes.some(node => node.i == i || (node.i != i && ((path.points[0].x == last()[node.i].points[node.j].x && path.points[0].y == last()[node.i].points[node.j].y) || (path.points[1].x == last()[node.i].points[node.j].x && path.points[1].y == last()[node.i].points[node.j].y)) )))) return //no interactuar consigo misma

                    if(overNode(path.points[0])) {
                        [p_x, p_y] = [path.points[0].x, path.points[0].y]; return true
                    } else if(overNode(path.points[1])) {
                        [p_x, p_y] = [path.points[1].x, path.points[1].y]; return true
                    }
                })
                let origen = {x:x0, y:y0}
                let destino = {x:p_x||x, y:p_y||y}
                if(modo == "lines")
                    last().push({ points: [origen, destino], type:"line", color: colorPicker.value, grosor: slider.value})
                else if(modo == "grab") {
                    grabedNodes.forEach(node => {
                        last()[node.i].points[node.j] = destino
                        log[log.length-2][node.i].points[node.j] = origen
                    })
                    grabedNodes = []
                }   
            } else if(modo == "paint")
                last().push({points, type:"raya", color: colorPicker.value, grosor: slider.value})
            else if(modo == "circles"){
                midpoint(x0,y0,x,y)
                last().push({point:midpoint(x0,y0,x,y), radius:radius(x0,y0,x,y), type:"circle", color: colorPicker.value})
            }
            // else if(modo == "borrar")
            // console.log(log)
        }
    }} catch(e) { console.log(e) }
    x0 = 0; y0 = 0
    hasDragged = false
    clicking = false
    drawPaths()  // EN PRINCIPIO SOBRARÍA PERO NO HACE DAÑO
    if(modo!="paint") drawNodes()
    shortenLog() 
}

// https://stackoverflow.com/questions/53960651/how-to-make-an-undo-function-in-canvas/53961111
function sketch(e) {
    if(!clicking) return
    hasDragged = true
   if(modo == "paint") paint(e)
    // else if(modo == "borrar") erase(e)
    else if(modo == "lines") previewLine(e)
    else if(modo == "circles") previewCircle(e)
    else if(modo == "grab") 
        if(grabedNodes.length) moveNode(e)
}

function paint(e) {
    [x0, y0] = [x, y] 
    getPosition(e)
    // saving the points in the points array
    points.push({ x, y })
    ctx_tmp.beginPath()
    ctx_tmp.moveTo(x0, y0)
    ctx_tmp.lineTo(x, y)
    ctx_tmp.stroke()
}

// function erase(e) {
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
//                 // console.log("hola")
//             }
//             console.log(i)
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

function drawPaths() {
    ctx_tmp.clearRect(0, 0, c_tmp.width, c_tmp.height)
    try {
    last().forEach(path => {
        if(path.type=="circle") {
            ctx_tmp.beginPath()
            ctx_tmp.strokeStyle = path.color
            ctx_tmp.arc(...path.point, path.radius, 0, 2*Math.PI)
            changeGrosor(4)
            ctx_tmp.stroke()
            return
        }
        ctx_tmp.lineWidth = path.grosor
        ctx_tmp.strokeStyle = path.color
        ctx_tmp.beginPath()
        ctx_tmp.moveTo(path.points[0].x, path.points[0].y)
        for(let i = 1; i < path.points.length; i++) {
            ctx_tmp.lineTo(path.points[i].x, path.points[i].y)				
        }
        ctx_tmp.stroke()
        // changeColor()
    })
    } catch(e) {console.log("error al dibujar los elementos!: \n"+e)}
    changeColor()
    changeGrosor()
}

function clearCanvas() {
    if (!last().length) return
    ctx_nodes.clearRect(0, 0, c_nodes.width, c_nodes.height)
    ctx_tmp.clearRect(0, 0, c_tmp.width, c_tmp.height)
    log.push([])
}

function undo() {
    if(log.length == 1) return
    log.pop()
    drawPaths()
    drawNodes()
}

function getPosition(e) {
    var rect = c_tmp.getBoundingClientRect()
    if (e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel') {
        var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent
        var touch = evt.touches[0] || evt.changedTouches[0]

        x = touch.pageX - rect.left
        y = touch.pageY - rect.top
    } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover' || e.type == 'mouseout' || e.type == 'mouseenter' || e.type == 'mouseleave') {
        x = e.clientX - rect.left
        y = e.clientY - rect.top
    }
}

function changeColor() {
    let color = "#"
    if (colorPicker.value.substr(1, 2) < 7) color += "11"
    else color += colorPicker.value.substr(1, 2)
    if (colorPicker.value.substr(3, 2) < 7) color += "11"
    else color += colorPicker.value.substr(3, 2)
    if (colorPicker.value.substr(5, 2) < 7) color += "11"
    else color += colorPicker.value.substr(5, 2)

    ctx_tmp.strokeStyle = color
    colorPicker.value = color
}

function changeGrosor(grosor) { ctx_tmp.lineWidth = grosor || slider.value }

function selectMode(clickedMode) {
    computeFrame(true)

    if(modo == clickedMode) btn_grab.click()
    else modo = clickedMode
    if(modo == "paint" || modo == "circle") ctx_nodes.clearRect(0, 0, c_nodes.width, c_nodes.height)
    else drawNodes()
}

function last() { return log[log.length - 1] || [] }

function fillLastLog() {
    log[log.length - 2].forEach((path, i) => {
        if(path.type == "circle") {
            log[log.length - 1].push({ point: [...path.point], radius:path.radius, type: path.type, color: path.color})
            return
        }
        log[log.length - 1].push({ points: [], type: path.type, color: path.color, grosor: path.grosor })
        path.points.forEach((punto) => {
            log[log.length - 1][i].points.push({ x: punto.x, y: punto.y })
        })
    })
}

function next() {
    if(video_in.className == "hidden_video" && video_out.className == "hidden_video") {
        video_in.className = "video"
    } else if(video_in.className == "video"){
        video_in.className = "hidden_video"
        video_out.className = "video"
    } else {
        video_out.className = "hidden_video"
    }
}

function shortenLog() {
    if(log.length>30)
        log.splice(0,3)
}