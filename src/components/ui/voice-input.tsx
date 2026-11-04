'use client'

import { useState, useRef, useEffect } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  placeholder?: string
  className?: string
  children?: React.ReactNode
}

export function VoiceInput({ onTranscript, placeholder = 'Listening...', className = '', children }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.abort()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // Already started, ignore
      }
    }
  }

  if (children) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <button
          type="button"
          onClick={toggleListening}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
        {isListening && (
          <div className="absolute -top-8 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {placeholder}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  )
}
