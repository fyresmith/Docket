import { useState, useEffect, useRef } from 'react'
import { FiArrowLeft, FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi'
import './LibraryView.css'

function LibraryView({ notch, onBack }) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [initialDuration, setInitialDuration] = useState(0)
  const timerRef = useRef(null)

  // Calculate duration from notch times
  const calculateNotchDuration = (notch) => {
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    return durationMinutes * 60 // Convert to seconds
  }

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize timer
  useEffect(() => {
    if (notch) {
      const duration = calculateNotchDuration(notch)
      setInitialDuration(duration)
      setTimeRemaining(duration)
    }
  }, [notch])

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isRunning, timeRemaining])

  // Handle timer controls
  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeRemaining(initialDuration)
  }

  // Get notch color
  const getNotchColor = () => {
    return notch?.categoryColor || '#007AFF'
  }

  if (!notch) return null

  return (
    <div className="timer-view">
      {/* Timer Header */}
      <div className="timer-view-header">
        <button className="timer-back-btn" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <div className="timer-header-content">
          <h1 className="timer-view-title">{notch.title}</h1>
          <div className="timer-view-subtitle">
            {notch.startTime} - {notch.endTime}
          </div>
        </div>
        <div className="timer-header-spacer"></div>
      </div>

      {/* Timer Content */}
      <div className="timer-view-content">
        <div className="timer-display-section">
          {/* Category Badge */}
          {notch.categoryName && (
            <div className="timer-category-badge" style={{ 
              backgroundColor: `${getNotchColor()}20`,
              color: getNotchColor(),
              borderColor: `${getNotchColor()}40`
            }}>
              {notch.categoryName}
            </div>
          )}

          {/* Main Timer */}
          <div className="timer-main-display">
            <div className="timer-time-large">
              {formatTime(timeRemaining)}
            </div>
            
            <div className={`timer-status-text ${isRunning ? 'running' : timeRemaining === 0 ? 'completed' : 'paused'}`}>
              {timeRemaining === 0 ? 'Completed!' : isRunning ? 'Focus Time' : 'Paused'}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="timer-view-controls">
        <button 
          className="timer-view-btn secondary"
          onClick={handleReset}
          disabled={timeRemaining === initialDuration}
        >
          <FiRotateCcw size={20} />
          <span>Reset</span>
        </button>
        
        <button 
          className={`timer-view-btn ${isRunning ? 'pause' : 'primary'}`}
          onClick={handlePlayPause}
          disabled={timeRemaining === 0}
        >
          {isRunning ? <FiPause size={20} /> : <FiPlay size={20} />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>
      </div>
    </div>
  )
}

export default LibraryView 