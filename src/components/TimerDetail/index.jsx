import { FiPlay, FiPause, FiRotateCcw, FiX, FiTag } from 'react-icons/fi'
import { formatTime } from '../../utils/timeUtils'
import './style.css'

function TimerDetail({ 
  timer, 
  isRunning, 
  onBack, 
  onDelete, 
  onStart, 
  onStop, 
  onReset 
}) {

  const handleStartStop = () => {
    if (isRunning) {
      onStop(timer.id)
    } else {
      onStart(timer.id)
    }
  }

  return (
    <div className={`timer-detail ${isRunning ? 'running' : ''}`}>
      <div className="timer-detail-header">
        <button 
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Entries
        </button>
        <button 
          className="delete-btn"
          onClick={() => onDelete(timer.id)}
        >
          <FiX size={24} />
        </button>
      </div>
      
      <div className="timer-info-above">
        <h2>{timer.name}</h2>
        <div className="timer-category">
          <FiTag size={16} />
          {timer.category}
        </div>
      </div>
      
      <div className="timer-display">
        <div className="circular-timer">
          <svg className="circular-progress" width="300" height="300" viewBox="0 0 300 300">
            <circle
              className="circular-progress-bg"
              cx="150"
              cy="150"
              r="140"
            />
            <circle
              className="circular-progress-fill"
              cx="150"
              cy="150"
              r="140"
              strokeDasharray={`${2 * Math.PI * 140}`}
              strokeDashoffset={`${2 * Math.PI * 140 * (1 - (timer.timeLeft / timer.duration))}`}
            />
          </svg>
          <div className="time-display">
            {formatTime(timer.timeLeft)}
          </div>
        </div>
      </div>
      
      <div className="timer-controls">
        <button 
          className="control-btn reset-btn"
          onClick={() => onReset(timer)}
        >
          <FiRotateCcw size={24} />
        </button>
        
        <button 
          className={`control-btn ${isRunning ? 'stop-btn' : 'start-btn'}`}
          onClick={handleStartStop}
        >
          {isRunning ? <FiPause size={32} /> : <FiPlay size={32} />}
        </button>
      </div>
    </div>
  )
}

export default TimerDetail 