import { FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi'
import { formatTime } from '../../utils/timeUtils'
import './style.css'

function TimerCard({ timer, isRunning, onStart, onStop, onReset, onClick }) {

  const handleStartStop = (e) => {
    e.stopPropagation()
    if (isRunning) {
      onStop(timer.id)
    } else {
      onStart(timer.id)
    }
  }

  const handleReset = (e) => {
    e.stopPropagation()
    onReset(timer)
  }

  const handleCardClick = () => {
    onClick(timer)
  }

  return (
    <div 
      className={`timer-card ${isRunning ? 'running' : ''}`}
      onClick={handleCardClick}
    >
      <div className="timer-card-content">
        <div className="timer-card-header">
          <h3>{timer.name}</h3>
        </div>
        
        <div className="timer-card-time">
          {formatTime(timer.timeLeft)}
        </div>
      </div>
      
      <div className="timer-card-controls">
        <button 
          className="timer-card-btn"
          onClick={handleReset}
        >
          <FiRotateCcw size={16} />
        </button>
        
        <button 
          className={`timer-card-btn ${isRunning ? 'stop' : 'primary'}`}
          onClick={handleStartStop}
        >
          {isRunning ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>
      </div>
    </div>
  )
}

export default TimerCard 