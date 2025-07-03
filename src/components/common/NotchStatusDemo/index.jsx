import React from 'react'
import { FiCheck, FiClock, FiPlay, FiX, FiCalendar } from 'react-icons/fi'
import { useNotchDB } from '../../../hooks/useNotchDB'
import './style.css'

function NotchStatusDemo({ notch, onStatusChange }) {
  const { 
    markNotchCompleted, 
    markNotchStarted, 
    markNotchCancelled,
    calculateNotchStatus
  } = useNotchDB()

  if (!notch) return null

  const handleMarkCompleted = async () => {
    const success = await markNotchCompleted(notch.id)
    if (success && onStatusChange) {
      onStatusChange()
    }
  }

  const handleMarkStarted = async () => {
    const success = await markNotchStarted(notch.id)
    if (success && onStatusChange) {
      onStatusChange()
    }
  }

  const handleMarkCancelled = async () => {
    const success = await markNotchCancelled(notch.id)
    if (success && onStatusChange) {
      onStatusChange()
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck size={16} />
      case 'ongoing':
        return <FiPlay size={16} />
      case 'upcoming':
        return <FiClock size={16} />
      case 'missed':
        return <FiX size={16} />
      case 'cancelled':
        return <FiX size={16} />
      default:
        return <FiCalendar size={16} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981' // Green
      case 'ongoing':
        return '#3B82F6' // Blue
      case 'upcoming':
        return '#F59E0B' // Orange
      case 'missed':
        return '#EF4444' // Red
      case 'cancelled':
        return '#6B7280' // Gray
      default:
        return '#6B7280'
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Not set'
    return new Date(timestamp).toLocaleString()
  }

  const currentStatus = notch.status || calculateNotchStatus(notch)

  return (
    <div className="notch-status-demo">
      <div className="status-header">
        <div 
          className="status-badge"
          style={{ 
            backgroundColor: getStatusColor(currentStatus),
            color: 'white'
          }}
        >
          {getStatusIcon(currentStatus)}
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </div>
      </div>

      <div className="status-timestamps">
        <div className="timestamp-item">
          <label>Created:</label>
          <span>{formatTimestamp(notch.createdAt)}</span>
        </div>
        <div className="timestamp-item">
          <label>Updated:</label>
          <span>{formatTimestamp(notch.updatedAt)}</span>
        </div>
        {notch.started_at && (
          <div className="timestamp-item">
            <label>Started:</label>
            <span>{formatTimestamp(notch.started_at)}</span>
          </div>
        )}
        {notch.completed_at && (
          <div className="timestamp-item">
            <label>Completed:</label>
            <span>{formatTimestamp(notch.completed_at)}</span>
          </div>
        )}
        {notch.syncTimestamp && (
          <div className="timestamp-item">
            <label>Last Sync:</label>
            <span>{formatTimestamp(notch.syncTimestamp)}</span>
          </div>
        )}
      </div>

      <div className="status-actions">
        {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
          <>
            {currentStatus === 'upcoming' && (
              <button 
                className="status-btn start-btn"
                onClick={handleMarkStarted}
              >
                <FiPlay size={14} />
                Start Task
              </button>
            )}
            
            <button 
              className="status-btn complete-btn"
              onClick={handleMarkCompleted}
            >
              <FiCheck size={14} />
              Mark Complete
            </button>
            
            <button 
              className="status-btn cancel-btn"
              onClick={handleMarkCancelled}
            >
              <FiX size={14} />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default NotchStatusDemo 