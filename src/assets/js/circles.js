

function startCircle() {
    [x0, y0] = [x, y]
}

function previewCircle(e)  {    
    drawPaths()
    ctx_tmp.beginPath()
    getPosition(e)
    ctx_tmp.arc(...midpoint(x0,y0,x,y), radius(x0,y0,x,y), 0, 2*Math.PI)
    changeGrosor(4)
    ctx_tmp.stroke()
    changeGrosor()
}


//?? se puede redimensionar y/o cojer ??
function grabCircle() { // !!!!!!!!
    last().some(path => {
        if(path.type!="circle") return
        if(overNode(path.point, path.radius)) return
    })
}

function midpoint(x1, y1, x2, y2) {
	return [(x1 + x2)/2, (y1 + y2)/2]
}

function radius(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1)/2
  }