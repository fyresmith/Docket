import { useState, useEffect, useRef } from 'react'
import { FiArrowLeft, FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi'
import { useTimer } from '../../../contexts/TimerContext'
import './style.css'

function TimerView({ notch, onBack }) {
  const { 
    startNotchTimer, 
    stopNotchTimer, 
    resetNotchTimer, 
    getNotchTimer, 
    isNotchTimerRunning, 
    formatTime 
  } = useTimer()
  
  const [timer, setTimer] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // Initialize timer for the notch
  useEffect(() => {
    if (notch) {
      console.log('TimerView: Setting up timer for notch:', notch.id)
      
      // Get existing timer or it will be created when started
      const existingTimer = getNotchTimer(notch.id)
      console.log('TimerView: Existing timer found:', existingTimer)
      
      setTimer(existingTimer)
      setIsRunning(isNotchTimerRunning(notch.id))
    }
  }, [notch, getNotchTimer, isNotchTimerRunning])

  // Update timer state when timers change
  useEffect(() => {
    if (notch) {
      const currentTimer = getNotchTimer(notch.id)
      const running = isNotchTimerRunning(notch.id)
      
      if (currentTimer !== timer) {
        console.log('TimerView: Timer updated:', currentTimer)
        setTimer(currentTimer)
      }
      
      if (running !== isRunning) {
        console.log('TimerView: Running state updated:', running)
        setIsRunning(running)
      }
    }
  }, [notch, getNotchTimer, isNotchTimerRunning, timer, isRunning])

  // Handle timer controls
  const handlePlayPause = async () => {
    if (!notch) return

    try {
      if (isRunning) {
        console.log('TimerView: Stopping timer for notch:', notch.id)
        stopNotchTimer(notch.id)
      } else {
        console.log('TimerView: Starting timer for notch:', notch.id)
        const startedTimer = await startNotchTimer(notch)
        if (startedTimer) {
          console.log('TimerView: Timer started successfully:', startedTimer.id)
          setTimer(startedTimer)
        }
      }
    } catch (error) {
      console.error('TimerView: Error controlling timer:', error)
    }
  }

  const handleReset = () => {
    if (!notch) return
    
    console.log('TimerView: Resetting timer for notch:', notch.id)
    resetNotchTimer(notch.id)
  }

  // Get notch color
  const getNotchColor = () => {
    return notch?.categoryColor || '#007AFF'
  }

  // Calculate duration and time remaining
  const getDuration = () => {
    if (timer) return timer.duration
    
    if (!notch) return 0
    
    // Calculate from notch times if no timer exists yet
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    return durationMinutes * 60
  }

  const getTimeRemaining = () => {
    return timer ? timer.timeLeft : getDuration()
  }

  if (!notch) return null

  const timeRemaining = getTimeRemaining()
  const duration = getDuration()

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
          disabled={!timer}
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

export default TimerView 