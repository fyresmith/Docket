import { FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi'
import './style.css'

function FullScreenTimer({ 
  timeRemaining, 
  durationSeconds, 
  isTimerRunning, 
  onStart, 
  onPause, 
  onReset,
  formatTime,
  className = ''
}) {
  return (
    <div className={`fullscreen-timer${isTimerRunning ? ' running' : ''}${className ? ` ${className}` : ''}`}>
      <div className="fullscreen-timer-circular-container">
        <svg 
          className="fullscreen-timer-circular" 
          width="120" 
          height="120" 
          viewBox="0 0 120 120" 
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle className="fullscreen-timer-bg" cx="60" cy="60" r="54" />
          <circle
            className="fullscreen-timer-progress-circle"
            cx="60" cy="60" r="54"
            strokeDasharray={2 * Math.PI * 54}
            strokeDashoffset={
              durationSeconds > 0
                ? (2 * Math.PI * 54) * ((durationSeconds - timeRemaining) / durationSeconds)
                : 0
            }
          />
        </svg>
        <div className="fullscreen-timer-circular-center">
          <div className="fullscreen-timer-circular-time">{formatTime(timeRemaining)}</div>
          <div className="fullscreen-timer-circular-duration">/ {formatTime(durationSeconds)}</div>
        </div>
      </div>
      <div className="fullscreen-timer-controls">
        <div className="fullscreen-timer-controls-row">
          <button 
            className="fullscreen-timer-btn fullscreen-timer-btn-reset"
            onClick={onReset}
          >
            <FiRotateCcw size={16} />
            Reset
          </button>
          {!isTimerRunning ? (
            <button 
              className="fullscreen-timer-btn fullscreen-timer-btn-start"
              onClick={onStart}
            >
              <FiPlay size={16} />
              Start
            </button>
          ) : (
            <button 
              className="fullscreen-timer-btn fullscreen-timer-btn-pause"
              onClick={onPause}
            >
              <FiPause size={16} />
              Pause
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FullScreenTimer 