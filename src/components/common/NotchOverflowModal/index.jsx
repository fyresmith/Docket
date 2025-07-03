import { FiClock, FiTag, FiCalendar } from 'react-icons/fi'
import Modal from '../Modal'
import { useNotchDB } from '../../../hooks/useNotchDB'
import './style.css'

function NotchOverflowModal({ isOpen, onClose, overflowNotches, onNotchClick }) {
  const { getCategoryById } = useNotchDB()
  
  if (!overflowNotches || overflowNotches.length === 0) return null

  const getNotchColor = (notch) => {
    // Use the stored categoryColor first
    if (notch.categoryColor) {
      return notch.categoryColor
    }
    
    // Fallback to category from database if category ID is available
    if (notch.category) {
      const categoryFromDB = getCategoryById(notch.category)
      if (categoryFromDB?.color) {
        return categoryFromDB.color
      }
    }
    
    // Final fallback to default blue
    return '#007AFF'
  }

  const formatDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    
    if (durationMinutes < 60) {
      return `${durationMinutes}m`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
  }

  const handleNotchClick = (notch) => {
    onClose()
    onNotchClick(notch)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Additional Tasks"
      subtitle={`${overflowNotches.length} overlapping event${overflowNotches.length > 1 ? 's' : ''}`}
      className="notch-overflow-modal"
    >
      <div className="overflow-notches-list">
        {overflowNotches.map((notch) => {
          const notchColor = getNotchColor(notch)
          
          return (
            <div 
              key={notch.id}
              className="overflow-notch-card"
              style={{
                borderLeftColor: notchColor,
                backgroundColor: `${notchColor}10`
              }}
              onClick={() => handleNotchClick(notch)}
            >
              <div className="overflow-notch-header">
                <div className="overflow-notch-title">{notch.title}</div>
                <div className="overflow-notch-time">
                  <FiClock size={12} />
                  {notch.startTime} - {notch.endTime}
                </div>
              </div>
              
              <div className="overflow-notch-details">
                {(notch.categoryName || notch.category) && (
                  <div className="overflow-notch-category" style={{ color: notchColor }}>
                    <FiTag size={12} />
                    {notch.categoryName || notch.category}
                  </div>
                )}
                
                <div className="overflow-notch-duration">
                  <FiCalendar size={12} />
                  {formatDuration(notch.startTime, notch.endTime)}
                </div>
              </div>
              
              {notch.description && (
                <div className="overflow-notch-description">
                  {notch.description}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default NotchOverflowModal