import { useState, useEffect } from 'react'
import { FiClock, FiTag, FiFileText, FiCalendar, FiRepeat, FiEdit3, FiEdit } from 'react-icons/fi'
import Modal from '../Modal'
import EditNotchModal from '../EditNotchModal'
import NotchStatusDemo from '../NotchStatusDemo'
import './style.css'

function NotchDetailModal({ isOpen, onClose, notch, onUpdateNotch, onDeleteNotch }) {
  const [liveCountdown, setLiveCountdown] = useState('00:00:00')
  const [countdownInterval, setCountdownInterval] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Calculate duration in seconds
  const [startHour, startMin] = notch?.startTime?.split(':').map(Number) || [0, 0]
  const [endHour, endMin] = notch?.endTime?.split(':').map(Number) || [0, 0]
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const durationMinutes = endMinutes - startMinutes

  // Format time display with HH:MM:SS
  const formatTime = (totalSeconds) => {
    const totalSecs = Math.floor(totalSeconds)
    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const seconds = totalSecs % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Format duration display
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
    }
  }

  // Format date display
  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      })
    }
  }

  // Format recurrence display
  const formatRecurrence = (recurrence) => {
    if (!recurrence || recurrence.type !== 'weekly') return null
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const selectedDays = recurrence.days.map(dayIndex => dayNames[dayIndex])
    
    if (selectedDays.length === 7) {
      return 'Every day'
    } else if (selectedDays.length === 5 && recurrence.days.every(day => day >= 1 && day <= 5)) {
      return 'Weekdays (Mon-Fri)'
    } else if (selectedDays.length === 2 && recurrence.days.includes(0) && recurrence.days.includes(6)) {
      return 'Weekends (Sat-Sun)'
    } else {
      return `Every ${selectedDays.join(', ')}`
    }
  }

  // Calculate live countdown
  const calculateLiveCountdown = () => {
    if (!notch) return '00:00:00'
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentSecond = now.getSeconds()
    const currentMinutes = currentHour * 60 + currentMinute
    const currentTotalSeconds = currentMinutes * 60 + currentSecond
    
    const startTotalSeconds = startMinutes * 60
    const endTotalSeconds = endMinutes * 60
    
    // If event hasn't started yet
    if (currentTotalSeconds < startTotalSeconds) {
      const timeUntilStart = startTotalSeconds - currentTotalSeconds
      return `${formatTime(timeUntilStart)}`
    }
    
    // If event is ongoing
    if (currentTotalSeconds >= startTotalSeconds && currentTotalSeconds < endTotalSeconds) {
      const timeRemaining = endTotalSeconds - currentTotalSeconds
      return formatTime(timeRemaining)
    }
    
    // If event has ended
    return 'Task ended'
  }

  // Live countdown effect
  useEffect(() => {
    if (isOpen && notch) {
      // Update immediately
      setLiveCountdown(calculateLiveCountdown())
      
      // Set up interval for live updates
      const interval = setInterval(() => {
        setLiveCountdown(calculateLiveCountdown())
      }, 1000)
      
      setCountdownInterval(interval)
      
      return () => {
        clearInterval(interval)
        setCountdownInterval(null)
      }
    }
  }, [isOpen, notch])

  const handleClose = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      setCountdownInterval(null)
    }
    onClose()
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleEditClose = () => {
    setShowEditModal(false)
  }

  const handleUpdateNotch = (updatedNotch) => {
    onUpdateNotch(updatedNotch)
    setShowEditModal(false)
    handleClose() // Close detail modal and return to timeline
  }

  if (!notch) return null

  // Determine if we should show the live clock
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentSecond = now.getSeconds()
  const currentMinutes = currentHour * 60 + currentMinute
  const currentTotalSeconds = currentMinutes * 60 + currentSecond
  const startTotalSeconds = startMinutes * 60
  const endTotalSeconds = endMinutes * 60
  const isUpcoming = currentTotalSeconds < startTotalSeconds
  const isOngoing = currentTotalSeconds >= startTotalSeconds && currentTotalSeconds < endTotalSeconds
  const showLiveClock = isUpcoming || isOngoing

  const footerActions = (
    <div className="notch-actions">
      <button 
        className="notch-btn-secondary"
        onClick={handleClose}
      >
        Close
      </button>
      
      <button 
        className="notch-btn-primary"
        onClick={handleEdit}
      >
        <FiEdit size={16} />
        Edit Task
      </button>
    </div>
  )

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        title={notch.title}
        subtitle={`${notch.startTime} - ${notch.endTime}`}
        className="notch-detail-modal"
        footerActions={footerActions}
      >
        <div className="notch-detail-content">
          {/* Live Clock Section - Only show for upcoming/ongoing events */}
          {showLiveClock && (
            <div className="detail-item">
              <div className="detail-label">
                <FiClock size={16} />
                Live Clock
              </div>
              <div className="detail-value live-clock-value">
                <div className="live-clock-time">
                  {liveCountdown}
                </div>
                <div className="live-clock-status">
                  {isUpcoming ? 'Task starting soon' : 'Task in progress'}
                </div>
              </div>
            </div>
          )}

          {/* Notch Details */}
          <div className="notch-details">
            {/* Date & Time */}
            <div className="detail-item">
              <div className="detail-label">
                <FiCalendar size={16} />
                Date & Time
              </div>
              <div className="detail-value">
                <div className="detail-primary">{formatDateDisplay(notch.date)}</div>
                <div className="detail-secondary">{notch.startTime} - {notch.endTime} ({formatDuration(durationMinutes)})</div>
              </div>
            </div>

            {/* Recurrence */}
            {notch.recurrence && (
              <div className="detail-item">
                <div className="detail-label">
                  <FiRepeat size={16} />
                  Repeats
                </div>
                <div className="detail-value recurrence">
                  <div className="recurrence-info">
                    <div className="detail-primary">{formatRecurrence(notch.recurrence)}</div>
                    <div className="detail-secondary">Weekly recurring event</div>
                  </div>
                </div>
              </div>
            )}

            {/* Category */}
            {(notch.categoryName || notch.category) && (
              <div className="detail-item">
                <div className="detail-label">
                  <FiTag size={16} />
                  Category
                </div>
                <div className="detail-value category" style={{ 
                  borderLeftColor: notch.categoryColor || '#007AFF',
                  backgroundColor: `${notch.categoryColor || '#007AFF'}15` 
                }}>
                  <div className="category-indicator" style={{ backgroundColor: notch.categoryColor || '#007AFF' }}></div>
                  {notch.categoryName || notch.category}
                </div>
              </div>
            )}

            {/* Notes */}
            {notch.notes && (
              <div className="detail-item">
                <div className="detail-label">
                  <FiFileText size={16} />
                  Notes
                </div>
                <div className="detail-value notes">
                  {notch.notes}
                </div>
              </div>
            )}

            {/* Task Metadata - Only show if we have notes or other useful info */}
            {(notch.notes || notch.createdAt || notch.isRecurringInstance) && (
              <div className="detail-item metadata">
                <div className="detail-label">
                  <FiEdit3 size={16} />
                  Task Details
                </div>
                <div className="detail-value metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-key">Created:</span>
                    <span className="metadata-value">
                      {notch.createdAt ? new Date(notch.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  {notch.isRecurringInstance && (
                    <div className="metadata-item">
                      <span className="metadata-key">Type:</span>
                      <span className="metadata-value">Recurring Instance</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Management Demo */}
          <div className="detail-section">
            <h3 className="section-title">Task Status & Management</h3>
            <NotchStatusDemo 
              notch={notch} 
              onStatusChange={() => {
                // Force a re-render by calling the update handler with current notch
                // This will refresh the modal with updated status information
                const refreshedNotch = { ...notch }
                onUpdateNotch(refreshedNotch)
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Notch Modal */}
      <EditNotchModal
        isOpen={showEditModal}
        onClose={handleEditClose}
        onUpdateNotch={handleUpdateNotch}
        onDeleteNotch={onDeleteNotch}
        notch={notch}
      />
    </>
  )
}

export default NotchDetailModal 