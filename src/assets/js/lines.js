let grabedNodes = []
let nodeRadius = 11

function startLine() {
    if( !last().some(path => {  //requiere array no modif
        if(path.type!="line") return
        if(overNode(path.points[0])) {
            [x0, y0] = [path.points[0].x, path.points[0].y]; return true
        }
        if(overNode(path.points[1])) {
            [x0, y0] = [path.points[1].x, path.points[1].y]; return true
        }
    }) ) {
        [x0, y0] = [x, y]
    }
    draw1Node(x0, y0, colorPicker.value)
}

function previewLine(e)  {    
    drawPaths()
    let p_x, p_y
    last().some(path => {
        if(path.type != "line") return
        if(overNode(path.points[0], 10)) {
            [p_x, p_y] = [path.points[0].x, path.points[0].y]
            return true
        } else if(overNode(path.points[1], 10)){
            [p_x, p_y] = [path.points[1].x, path.points[1].y]
            return true
        }
    })
    getPosition(e)
    ctx_tmp.beginPath()
    ctx_tmp.moveTo(x0, y0)
    changeLineColor()
    ctx_tmp.lineTo(p_x||x, p_y||y)
    ctx_tmp.stroke()
}

function grabNode() {
    last().some((path, i) => {
        if(path.type!="line") return //no interactuar consigo misma
        // if(path.type!="line" || (modo == "grab" && grabedNodes.some(node => node.i == i || (node.i != i && ((path.points[0].x == last()[node.i].points[node.j].x && path.points[0].y == last()[node.i].points[node.j].y) || (path.points[1].x == last()[node.i].points[node.j].x && path.points[1].y == last()[node.i].points[node.j].y)) )))) return //no interactuar consigo misma

        if(overNode(path.points[0])) {
            [x0, y0] = [path.points[0].x, path.points[0].y]
            grabedNodes.push({i, j:0})
        }
        else if(overNode(path.points[1])) {
            [x0, y0] = [path.points[1].x, path.points[1].y]
            grabedNodes.push({i, j:1})
        }
    })
}

function moveNode(e) {
    getPosition(e)
    if( !last().some((path,i) => {
        if(path.type!="line" || grabedNodes.some(node => node.i == i)) return //no interactuar consigo misma
        
        let p_x, p_y
        if(overNode(path.points[0], 10)) 
            [p_x, p_y] = [path.points[0].x, path.points[0].y]
        else if(overNode(path.points[1], 10))
            [p_x, p_y] = [path.points[1].x, path.points[1].y]
        grabedNodes.forEach(node => {
            last()[node.i].points[node.j] = {x:p_x||x, y:p_y||y}
        })
        ctx_tmp.strokeStyle = path.color
        if(overNode(path.points[0], 10) || overNode(path.points[1], 10)) return true
    }) )
        grabedNodes.forEach(node => {
            last()[node.i].points[node.j] = {x, y}
        })
    drawPaths()
    drawNodes()
}

// https://stackoverflow.com/questions/56147279/how-to-find-angle-between-two-vectors-on-canvas
function draw1Angle(point0, point1, point2, color) { //, i, i_, j, j_
    ctx_nodes.beginPath()
    ctx_nodes.globalCompositeOperation = 'destination-out'
    let firstAngle = Math.atan2(point1.y - point0.y, point1.x - point0.x)
    let seconAngle = Math.atan2(point2.y - point0.y, point2.x - point0.x)
    
    let angle = seconAngle - firstAngle
    angle *= 180 / Math.PI
    // console.log("angle: ", angle)

    if(Math.abs(angle) < 15) return  // sirve además para quitar los ángulos complementarios y x lo tanto que no se repita

    let order = angle >= 180 || angle <= 0 && angle >= -180 ? [seconAngle,firstAngle] : [firstAngle,seconAngle]
    
    if(Math.abs(angle) > 180) angle = 360 - Math.abs(angle)
    
    ctx_nodes.moveTo(point0.x, point0.y)
    ctx_nodes.arc(point0.x, point0.y, 3*nodeRadius+500/Math.abs(angle), ...order)
    // ctx_nodes.strokeStyle = "grey"
    // ctx_nodes.lineTo(point0.x, point0.y)
    ctx_nodes.closePath()
    ctx_nodes.fillStyle = 'black'
    ctx_nodes.fill()
    // ctx_nodes.stroke()
    ctx_nodes.globalCompositeOperation = 'source-over'
    ctx_nodes.fillStyle = color + "50"
    ctx_nodes.fill()
    ctx_nodes.fillStyle = "black"
    ctx_nodes.font = "20px Arial"

    let angulo_txt = (order[0]+order[1])/2

    if(order[1]<0 && order[0]>0 && angulo_txt<0) {
        angulo_txt = (order[0]+order[1])/2 - Math.PI
    } else if(order[1]<0 && order[0]>0 && angulo_txt>0){
        angulo_txt = (order[0]+order[1])/2 + Math.PI
    }
    
    [x_txt, y_txt] = calcularPosTexto(point0.x, point0.y, angulo_txt, 5*nodeRadius+600/Math.abs(angle))

    ctx_nodes.textAlign = "center"
    ctx_nodes.textBaseline = 'middle'
    ctx_nodes.fillText(Math.trunc(Math.abs(angle)) + "º", x_txt, y_txt)
    ctx_nodes.fillStyle = "white"
    ctx_nodes.fillText(Math.trunc(Math.abs(angle)) + "º", x_txt+1, y_txt+1)
}

function drawNodes() {
    ctx_nodes.clearRect(0, 0, c_nodes.width, c_nodes.height)
    let pairs = []
    last().some((path,i) => {
        if(path.type!="line") return
        path.points.forEach(point => {
            draw1Node(point.x, point.y, path.color)
        })

        last().some((path_,j) => {
            if(j==i || path_.type!="line") return
            // if(pairs.includes(i+/./) || pairs.includes(j+/./)) return  // para que no dibuje dos veces lo mismo
            if(path.points[1].x == path_.points[0].x && path.points[1].y == path_.points[0].y) {           
                if(pairs.includes(i.toString()+1) || pairs.includes(j.toString()+0)) return
                draw1Angle(path.points[1], path.points[0], path_.points[1], path.color)
                pairs.push(i.toString()+1);  pairs.push(j.toString()+0)
            } else if(path.points[1].x == path_.points[1].x && path.points[1].y == path_.points[1].y) {
                if(pairs.includes(i.toString()+1) || pairs.includes(j.toString()+1)) return
                draw1Angle(path.points[1], path.points[0], path_.points[0], path.color)
                pairs.push(i.toString()+1);  pairs.push(j.toString()+1)
            } else if(path.points[0].x == path_.points[0].x && path.points[0].y == path_.points[0].y) {
                if(pairs.includes(i.toString()+0) || pairs.includes(j.toString()+0)) return
                draw1Angle(path.points[0], path.points[1], path_.points[1], path.color)
                pairs.push(i.toString()+0);  pairs.push(j.toString()+0)
            } else if(path.points[0].x == path_.points[1].x && path.points[0].y == path_.points[1].y) {
                if(pairs.includes(i.toString()+0) || pairs.includes(j.toString()+1)) return
                draw1Angle(path.points[0], path.points[1], path_.points[0], path.color)
                pairs.push(i.toString()+0);  pairs.push(j.toString()+1)
            }
        })
    })
}

function draw1Node(x, y, color) {
    ctx_nodes.beginPath()
    ctx_nodes.globalCompositeOperation = 'destination-out'
    ctx_nodes.arc(x, y, nodeRadius, 0, 2*Math.PI)
    ctx_nodes.fillStyle = 'black'
    ctx_nodes.fill()
    ctx_nodes.globalCompositeOperation = 'source-over'
    ctx_nodes.fillStyle = color+"50"
    ctx_nodes.fill()
}

function overNode(point, holgura=20) {
    let xDiff = point.x - x
    let yDiff = point.y - y

    return Math.sqrt(xDiff*xDiff + yDiff*yDiff) < nodeRadius+holgura
}

function changeLineColor() {
    let color = "#"
    let r = (parseInt(parseInt(colorPicker.value.substr(1,2),16).toString(10),10))
    let g = (parseInt(parseInt(colorPicker.value.substr(3,2),16).toString(10),10))
    let b = (parseInt(parseInt(colorPicker.value.substr(5,2),16).toString(10),10))
    let c_shift = 40
    if (r > 125) {
        if((r-c_shift).toString(16).length < 2) color += "0"
        color += (r-c_shift).toString(16)
    } else {
        if((r+c_shift).toString(16).length < 2) color += "0"
        color += (r+c_shift).toString(16)
    }
    if (g > 125) {
        if((g-c_shift).toString(16).length < 2) color += "0"
        color += (g-c_shift).toString(16)
    } else {
        if((g+c_shift).toString(16).length < 2) color += "0"
        color += (g+c_shift).toString(16)
    }
    if (b > 125) {
        if((b-c_shift).toString(16).length < 2) color += "0"
        color += (b-c_shift).toString(16)
    } else {
        if((b+c_shift).toString(16).length < 2) color += "0"
        color += (b+c_shift).toString(16)
    }
    ctx_tmp.strokeStyle = color
}

// https://stackoverflow.com/questions/14829621/formula-to-find-points-on-the-circumference-of-a-circle-given-the-center-of-the
function calcularPosTexto(x0, y0, alpha, r) {
    let x = Math.cos(alpha) * r + x0
    let y = Math.sin(alpha) * r + y0
    return [x, y]
}