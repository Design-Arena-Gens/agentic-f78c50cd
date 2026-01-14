import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, Loader2, MessageCircle } from 'lucide-react'

function VoiceInterview() {
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechSynthesis = window.speechSynthesis

    if (!SpeechRecognition || !SpeechSynthesis) {
      setIsSupported(false)
      return
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const last = event.results.length - 1
      const transcript = event.results[last][0].transcript

      if (event.results[last].isFinal) {
        setCurrentTranscript('')
        handleUserMessage(transcript)
      } else {
        setCurrentTranscript(transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      if (isListening) {
        recognition.start()
      }
    }

    recognitionRef.current = recognition
    synthRef.current = SpeechSynthesis

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      addSystemMessage('🎤 Listening... Speak now!')
    } catch (error) {
      console.error('Error starting recognition:', error)
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    recognitionRef.current.stop()
    setIsListening(false)
    setCurrentTranscript('')
    addSystemMessage('🛑 Stopped listening')
  }

  const handleUserMessage = async (text) => {
    if (!text.trim()) return

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }])

    // Simulate AI thinking
    setIsThinking(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsThinking(false)

    // Generate AI response
    const aiResponse = generateAIResponse(text)
    setMessages(prev => [...prev, { type: 'ai', text: aiResponse, timestamp: new Date() }])

    // Speak the response
    speakText(aiResponse)
  }

  const generateAIResponse = (userText) => {
    const responses = [
      `That's an interesting point about "${userText.slice(0, 30)}...". Could you elaborate on your approach to solving this problem?`,
      `I see you mentioned "${userText.slice(0, 30)}...". How would you optimize this solution for scale?`,
      `Great! Based on what you said about "${userText.slice(0, 30)}...", can you explain the time complexity?`,
      `Thank you for sharing. Regarding "${userText.slice(0, 30)}...", what trade-offs would you consider here?`,
      `Interesting perspective on "${userText.slice(0, 30)}...". Can you walk me through your thought process?`
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const speakText = (text) => {
    if (!synthRef.current) return

    setIsSpeaking(true)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
    }

    synthRef.current.speak(utterance)
  }

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { type: 'system', text, timestamp: new Date() }])
  }

  if (!isSupported) {
    return (
      <div className="glass-card rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MicOff className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Speech Not Supported</h3>
          <p className="text-gray-400">
            Your browser doesn't support the Web Speech API. Please use Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-electric-purple" />
            <h2 className="text-2xl font-bold">Voice-to-Voice Interview</h2>
          </div>

          {!isListening ? (
            <button
              onClick={startListening}
              className="px-6 py-3 bg-electric-purple hover:bg-electric-purple/80 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              Start Interview
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <MicOff className="w-5 h-5" />
              Stop Interview
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`glass-card rounded-lg p-4 ${
            isListening ? 'border-emerald-green/30' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <Mic className={`w-6 h-6 ${isListening ? 'text-emerald-green animate-pulse' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm text-gray-400">Microphone</p>
                <p className={`font-bold ${isListening ? 'text-emerald-green' : 'text-gray-500'}`}>
                  {isListening ? 'LISTENING' : 'IDLE'}
                </p>
              </div>
            </div>
          </div>

          <div className={`glass-card rounded-lg p-4 ${
            isThinking ? 'border-electric-purple/30' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <Loader2 className={`w-6 h-6 ${isThinking ? 'text-electric-purple animate-spin' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm text-gray-400">AI Status</p>
                <p className={`font-bold ${isThinking ? 'text-electric-purple' : 'text-gray-500'}`}>
                  {isThinking ? 'THINKING' : 'READY'}
                </p>
              </div>
            </div>
          </div>

          <div className={`glass-card rounded-lg p-4 ${
            isSpeaking ? 'border-blue-500/30' : 'border-white/10'
          }`}>
            <div className="flex items-center gap-3">
              <Volume2 className={`w-6 h-6 ${isSpeaking ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm text-gray-400">Speaker</p>
                <p className={`font-bold ${isSpeaking ? 'text-blue-500' : 'text-gray-500'}`}>
                  {isSpeaking ? 'SPEAKING' : 'SILENT'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="mb-6 p-4 bg-electric-purple/10 border border-electric-purple/30 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Transcribing...</p>
            <p className="text-electric-purple italic">{currentTranscript}</p>
          </div>
        )}

        {/* Conversation History */}
        <div className="glass-card rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[380px] text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-400">Start the interview to begin</p>
              <p className="text-sm text-gray-500 mt-2">Your conversation will appear here</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-electric-purple/20 border border-electric-purple/30'
                      : message.type === 'ai'
                      ? 'bg-emerald-green/20 border border-emerald-green/30'
                      : 'bg-gray-700/20 border border-gray-600/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.type === 'user' ? (
                      <Mic className="w-4 h-4 text-electric-purple" />
                    ) : message.type === 'ai' ? (
                      <Volume2 className="w-4 h-4 text-emerald-green" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {message.type === 'user' ? 'You' : message.type === 'ai' ? 'AI Interviewer' : 'System'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">How It Works</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-electric-purple font-bold">1.</span>
            <p>Click "Start Interview" to begin the voice session</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-electric-purple font-bold">2.</span>
            <p>Speak your answer clearly into the microphone</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-electric-purple font-bold">3.</span>
            <p>The AI will listen, think (2 seconds), and respond verbally</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-electric-purple font-bold">4.</span>
            <p>All conversations are displayed in the chat window above</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceInterview
