
let recording = false

// access microphone 
let constraintObj = {
    audio: true,
    video: false
}
if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {}
    navigator.mediaDevices.getUserMedia = function (constraintObj) {
        let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
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

function initRecorder() {
    navigator.mediaDevices.getUserMedia(constraintObj)
        .then((audioStreamObj) => {
            let videoRecordBtn = document.getElementById('videoRecord')
            let vidSave = document.getElementById('video_out')
            let canvasStreamObj = c_out.captureStream(40 /*fps*/)
            let combinedStreamObj = new MediaStream([...audioStreamObj.getAudioTracks(), ...canvasStreamObj.getVideoTracks()])
            let mediaRecorder = new MediaRecorder(combinedStreamObj)
            let chunks = []

            videoRecordBtn.addEventListener('click', () => {
                if (recording) {
                    mediaRecorder.stop()
                } else {
                    mediaRecorder.start()
                }
                recording = !recording
                console.log(mediaRecorder.state)
            })
            mediaRecorder.ondataavailable = function (ev) {
                chunks.push(ev.data)
            }
            mediaRecorder.onstop = (ev) => {
                let blob = new Blob(chunks, { 'type': 'video/mp4' })
                chunks = []
                let videoURL = window.URL.createObjectURL(blob)
                vidSave.src = videoURL
                
                // que pase al vídeo resultado !!!
                video_in.className = "hidden_video"
                video_out.className = "video"
            }
        })
}

