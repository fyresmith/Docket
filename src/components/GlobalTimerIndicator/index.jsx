import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiClock } from 'react-icons/fi'
import { useTimer } from '../../contexts/TimerContext'
import './style.css'

function GlobalTimerIndicator({ onTimerClick }) {
  const { getRunningTimersInfo, formatTime } = useTimer()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  
  const runningTimers = getRunningTimersInfo()
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on trigger button
      if (triggerRef.current && triggerRef.current.contains(event.target)) {
        return
      }
      
      // Check if click is on dropdown (now in portal)
      const dropdown = document.querySelector('.header-timer-dropdown--portal')
      if (dropdown && dropdown.contains(event.target)) {
        return
      }
      
      // Click is outside both trigger and dropdown, close it
      setIsDropdownOpen(false)
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])
  
  // Don't render if no running timers
  if (runningTimers.length === 0) {
    return null
  }
  
  const handleToggleDropdown = () => {
    if (!isDropdownOpen && triggerRef.current) {
      // Calculate dropdown position when opening
      const rect = triggerRef.current.getBoundingClientRect()
      const rightOffset = window.innerWidth - rect.right
      setDropdownPosition({
        top: rect.bottom + 12,
        right: rightOffset
      })
    }
    setIsDropdownOpen(!isDropdownOpen)
  }
  
  const handleTimerClick = (timer) => {
    setIsDropdownOpen(false)
    if (onTimerClick && timer.notchId) {
      onTimerClick(timer.notchId)
    }
  }
  
  return (
    <>
      <div className="header-timer-indicator" ref={dropdownRef}>
        <button 
          ref={triggerRef}
          className="header-timer-btn"
          onClick={handleToggleDropdown}
          title={`${runningTimers.length} timer${runningTimers.length !== 1 ? 's' : ''} running`}
        >
          <FiClock size={20} />
          <span className="header-timer-count">{runningTimers.length}</span>
        </button>
      </div>
      
      {isDropdownOpen && createPortal(
        <div 
          className="header-timer-dropdown header-timer-dropdown--portal"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 2147483647
          }}
        >
          <div className="dropdown-header">
            <span>Running Timers</span>
          </div>
          <div className="dropdown-list">
            {runningTimers.map((timer) => (
              <div 
                key={timer.id} 
                className="dropdown-timer-item"
                onClick={() => handleTimerClick(timer)}
              >
                <div className="timer-item-info">
                  <div className="timer-item-name">{timer.name}</div>
                  <div className="timer-item-time">{formatTime(timer.timeLeft)}</div>
                </div>
                <div className="timer-item-status">
                  <div className="status-dot running"></div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default GlobalTimerIndicator 