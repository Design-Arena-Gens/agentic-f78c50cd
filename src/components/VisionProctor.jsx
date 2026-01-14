import { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, AlertTriangle, CheckCircle, Loader2, Eye, User } from 'lucide-react'
import { Pose } from '@mediapipe/pose'
import { FaceDetection } from '@mediapipe/face_detection'

function VisionProctor() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [posture, setPosture] = useState('CHECKING...')
  const [eyeContact, setEyeContact] = useState('CHECKING...')

  const poseRef = useRef(null)
  const faceDetectionRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (poseRef.current) {
        poseRef.current.close()
      }
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close()
      }
    }
  }, [])

  const initializeModels = async () => {
    setIsLoading(true)
    try {
      // Initialize Pose Detection
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      pose.onResults(onPoseResults)
      poseRef.current = pose

      // Initialize Face Detection
      const faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        }
      })

      faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5
      })

      faceDetection.onResults(onFaceResults)
      faceDetectionRef.current = faceDetection

      setIsLoading(false)
      setIsActive(true)
      detectFrame()
    } catch (error) {
      console.error('Error initializing models:', error)
      setIsLoading(false)
      addAlert('Failed to initialize vision models', 'error')
    }
  }

  const onPoseResults = (results) => {
    if (!results.poseLandmarks) return

    const landmarks = results.poseLandmarks
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pose landmarks
    ctx.fillStyle = '#8b5cf6'
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 2

    // Draw connections
    const connections = [
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 12], // Shoulders
      [11, 23], [12, 24], // Body
      [23, 24], // Hips
    ]

    connections.forEach(([start, end]) => {
      const startLandmark = landmarks[start]
      const endLandmark = landmarks[end]

      if (startLandmark && endLandmark) {
        ctx.beginPath()
        ctx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height)
        ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height)
        ctx.stroke()
      }
    })

    // Draw landmarks
    landmarks.forEach((landmark) => {
      ctx.beginPath()
      ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Posture Analysis
    const nose = landmarks[0]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]

    if (nose && leftShoulder && rightShoulder) {
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2
      const noseToShoulderDistance = Math.abs(nose.y - shoulderMidY)

      if (noseToShoulderDistance < 0.25) {
        setPosture('LOW CONFIDENCE')
        addAlert('⚠️ POSTURE: LOW CONFIDENCE - Sit upright', 'warning')
      } else {
        setPosture('OPTIMAL')
      }
    }
  }

  const onFaceResults = (results) => {
    if (!results.detections || results.detections.length === 0) {
      setEyeContact('NO FACE DETECTED')
      return
    }

    const detection = results.detections[0]
    const noseTip = detection.landmarks[2] // Nose tip landmark

    if (noseTip) {
      // Check if nose is centered (eye contact proxy)
      const xPos = noseTip.x

      if (xPos < 0.4 || xPos > 0.6) {
        setEyeContact('OFF CENTER')
        addAlert('⚠️ MAINTAIN EYE CONTACT - Look at the camera', 'warning')
      } else {
        setEyeContact('CENTERED')
      }
    }
  }

  const detectFrame = async () => {
    if (!isActive || !webcamRef.current || !webcamRef.current.video) {
      return
    }

    const video = webcamRef.current.video

    if (video.readyState === 4) {
      // Send to MediaPipe models
      if (poseRef.current) {
        await poseRef.current.send({ image: video })
      }
      if (faceDetectionRef.current) {
        await faceDetectionRef.current.send({ image: video })
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectFrame)
  }

  const addAlert = (message, type) => {
    const alertId = Date.now()
    setAlerts(prev => [...prev, { id: alertId, message, type }])

    // Remove alert after 3 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    }, 3000)
  }

  const stopProctoring = () => {
    setIsActive(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (poseRef.current) {
      poseRef.current.close()
      poseRef.current = null
    }
    if (faceDetectionRef.current) {
      faceDetectionRef.current.close()
      faceDetectionRef.current = null
    }
    setPosture('STOPPED')
    setEyeContact('STOPPED')
    setAlerts([])
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-electric-purple" />
            <h2 className="text-2xl font-bold">Biometric Vision Proctor</h2>
          </div>

          {!isActive && !isLoading && (
            <button
              onClick={initializeModels}
              className="px-6 py-3 bg-electric-purple hover:bg-electric-purple/80 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Start Proctoring
            </button>
          )}

          {isActive && (
            <button
              onClick={stopProctoring}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-all"
            >
              Stop Proctoring
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 text-electric-purple animate-spin mb-4" />
            <p className="text-lg font-medium">Initializing Vision Models...</p>
            <p className="text-sm text-gray-400 mt-2">Loading MediaPipe Pose & Face Detection</p>
          </div>
        )}

        {!isActive && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-400">Click "Start Proctoring" to begin</p>
            <p className="text-sm text-gray-500 mt-2">We'll monitor your posture and eye contact in real-time</p>
          </div>
        )}

        {isActive && (
          <div className="space-y-6">
            {/* Video Feed */}
            <div className="relative rounded-xl overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: 'user'
                }}
                className="w-full"
                onUserMedia={() => {
                  if (canvasRef.current && webcamRef.current) {
                    canvasRef.current.width = webcamRef.current.video.videoWidth
                    canvasRef.current.height = webcamRef.current.video.videoHeight
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`glass-card rounded-lg p-4 ${
                posture === 'OPTIMAL' ? 'border-emerald-green/30' : 'border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <User className={`w-6 h-6 ${
                    posture === 'OPTIMAL' ? 'text-emerald-green' : 'text-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-400">Posture Status</p>
                    <p className={`font-bold ${
                      posture === 'OPTIMAL' ? 'text-emerald-green' : 'text-yellow-500'
                    }`}>
                      {posture === 'OPTIMAL' ? '✅ POSTURE: OPTIMAL' : '⚠️ POSTURE: ' + posture}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`glass-card rounded-lg p-4 ${
                eyeContact === 'CENTERED' ? 'border-emerald-green/30' : 'border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <Eye className={`w-6 h-6 ${
                    eyeContact === 'CENTERED' ? 'text-emerald-green' : 'text-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-400">Eye Contact</p>
                    <p className={`font-bold ${
                      eyeContact === 'CENTERED' ? 'text-emerald-green' : 'text-yellow-500'
                    }`}>
                      {eyeContact === 'CENTERED' ? '✅ CENTERED' : '⚠️ ' + eyeContact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="fixed top-24 right-6 space-y-2 z-50">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`glass-card rounded-lg p-4 border-l-4 ${
                alert.type === 'warning' ? 'border-yellow-500' : 'border-red-500'
              } animate-slide-in`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <p className="font-medium">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VisionProctor
