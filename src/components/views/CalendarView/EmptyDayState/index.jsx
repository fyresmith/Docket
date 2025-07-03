import { FiCalendar, FiPlus, FiClock, FiTag, FiTarget } from 'react-icons/fi'
import './style.css'

function EmptyDayState({ date, onAddNotch, disabled = false }) {
  const formatDate = (date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const getEmptyStateTitle = () => {
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return 'No tasks for today yet!'
    } else {
      return 'Day is wide open'
    }
  }

  const getEmptyStateDescription = () => {
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return 'Your day is ready for intention. Start timeboxing by creating your first task.'
    } else {
      return `Nothing scheduled for ${formatDate(date)} yet. Time to plan something meaningful.`
    }
  }

  return (
    <div className="empty-day-state">
      <div className="beautiful-empty-state">
        <div className="empty-state-icon">
          <FiCalendar size={48} />
        </div>
        <div className="empty-state-content">
          <h2 className="empty-state-title">{getEmptyStateTitle()}</h2>
          <p className="empty-state-description">
            {getEmptyStateDescription()}
          </p>
          <div className="empty-state-features">
            <div className="feature-item">
              <FiClock size={20} />
              <span>Block time for focused work</span>
            </div>
            <div className="feature-item">
              <FiTag size={20} />
              <span>Organize by project or context</span>
            </div>
            <div className="feature-item">
              <FiTarget size={20} />
              <span>Turn intentions into action</span>
            </div>
          </div>
          <button 
            className="empty-state-cta"
            onClick={onAddNotch}
            disabled={disabled}
          >
            <FiPlus size={20} />
            {disabled ? 'Initializing...' : 'Schedule your first task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmptyDayState 