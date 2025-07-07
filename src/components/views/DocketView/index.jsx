import { useState, useEffect, useRef, useMemo } from 'react'
import { FiClock, FiTag, FiCalendar, FiCheck, FiX, FiPlay, FiMoreHorizontal, FiEye, FiRefreshCw } from 'react-icons/fi'
import { useNotchDB } from '../../../hooks/useNotchDB'
import { useTimer } from '../../../contexts/TimerContext'
import NotchDetailModal from '../../common/NotchDetailModal'
import Modal from '../../common/Modal'
import SwipeableCard from '../../common/SwipeableCard'
import './style.css'

function DocketView({ onStartTimer, onOpenTimer }) {
  const { 
    getNotchesByDate, 
    getCategoryById, 
    markNotchCompleted, 
    markNotchCancelled,
    updateNotch 
  } = useNotchDB()
  const { isNotchTimerRunning, getNotchTimer, formatTime } = useTimer()
  
  const [selectedNotch, setSelectedNotch] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [processingStatus, setProcessingStatus] = useState(new Set())
  const [showMoreModal, setShowMoreModal] = useState(false) // Track more modal visibility
  const [moreModalNotch, setMoreModalNotch] = useState(null) // Track which notch the more modal is for
  const [userInteracting, setUserInteracting] = useState(false) // Track user interaction
  const [lastActiveNotch, setLastActiveNotch] = useState(null) // Track active notch changes
  const [showActiveToast, setShowActiveToast] = useState(false) // Show toast when active changes
  const [activeToastNotch, setActiveToastNotch] = useState(null) // Which notch the toast is for
  const [currentTime, setCurrentTime] = useState(new Date()) // Current time for live updates
  
  const docketRef = useRef(null)
  const activeCardRef = useRef(null) // Track ref for active card
  const userInteractionTimer = useRef(null) // Timer for user interaction tracking

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Track user interactions for auto-scroll behavior
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracting(true)
      clearTimeout(userInteractionTimer.current)
      userInteractionTimer.current = setTimeout(() => {
        setUserInteracting(false)
      }, 5000) // Consider user inactive after 5 seconds
    }

    const events = ['scroll', 'touchstart', 'touchmove', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
      clearTimeout(userInteractionTimer.current)
    }
  }, [])


  
  // Create a stable today date that only updates when needed
  const [todayDate, setTodayDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })
  
  // Update date at midnight
  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      const newToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      setTodayDate(newToday)
    }
    
    // Check for date change every minute
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])
  
  // Get today's notches directly (like CalendarView does)
  const todayNotches = getNotchesByDate(todayDate)

  // Sort all notches chronologically by start time
  const sortedNotches = useMemo(() => {
    return [...todayNotches].sort((a, b) => {
      const [aHour, aMin] = a.startTime.split(':').map(Number)
      const [bHour, bMin] = b.startTime.split(':').map(Number)
      const aMinutes = aHour * 60 + aMin
      const bMinutes = bHour * 60 + bMin
      return aMinutes - bMinutes
    })
  }, [todayNotches])

  // Auto-scroll to current/next event
  useEffect(() => {
    if (sortedNotches.length === 0 || !docketRef.current) return

    const scrollToCurrentEvent = () => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      // Find the current or next event
      let targetIndex = -1
      
      for (let i = 0; i < sortedNotches.length; i++) {
        const notch = sortedNotches[i]
        const [startHour, startMin] = notch.startTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        
        if (startMinutes >= currentMinutes) {
          targetIndex = i
          break
        }
      }

      // If no future events, scroll to the last ongoing event or stay at top
      if (targetIndex === -1) {
        // Find the last ongoing event
        for (let i = sortedNotches.length - 1; i >= 0; i--) {
          const notch = sortedNotches[i]
          const status = calculateNotchStatus(notch)
          if (status === 'ongoing') {
            targetIndex = i
            break
          }
        }
      }

      if (targetIndex >= 0) {
        const cardElement = docketRef.current.children[targetIndex]
        if (cardElement) {
          setTimeout(() => {
            cardElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }, 100)
        }
      }
    }

    scrollToCurrentEvent()
  }, [sortedNotches.length]) // Only depend on length to avoid infinite re-renders

  // Calculate notch status based on current time
  const calculateNotchStatus = (notch) => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    // Check if task is manually completed or cancelled
    if (notch.status === 'completed') return 'completed'
    if (notch.status === 'cancelled') return 'cancelled'
    
    // Auto-calculate status based on time
    if (currentMinutes < startMinutes) {
      return 'upcoming'
    } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'ongoing' // This is our "active runner"
    } else {
      // Past end time - check if it needs to be pending
      return 'pending'
    }
  }

  // Format duration display
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

  // Get notch color from category
  const getNotchColor = (notch) => {
    if (notch.categoryColor) {
      return notch.categoryColor
    }
    
    if (notch.category) {
      const categoryFromDB = getCategoryById(notch.category)
      if (categoryFromDB?.color) {
        return categoryFromDB.color
      }
    }
    
    return '#007AFF'
  }

  // Format time display
  const formatTimeRange = (startTime, endTime) => {
    const formatTime = (time) => {
      const [hour, minute] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hour, minute)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase()
    }

    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  // Get active runner notch (ongoing task)
  const getActiveRunnerNotch = () => {
    return todayNotches.find(notch => calculateNotchStatus(notch) === 'ongoing')
  }

  // Calculate remaining time for active runner
  const getActiveRunnerTimeRemaining = (notch) => {
    const now = new Date()
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    const endTime = new Date()
    endTime.setHours(endHour, endMin, 0, 0)
    
    const remainingMs = endTime.getTime() - now.getTime()
    return Math.max(0, Math.floor(remainingMs / 1000))
  }

  // Track active runner changes for auto-scroll and toast
  useEffect(() => {
    const currentActiveNotch = getActiveRunnerNotch()
    
    if (currentActiveNotch && currentActiveNotch.id !== lastActiveNotch?.id) {
      setLastActiveNotch(currentActiveNotch)
      
      // Handle auto-scroll or toast based on user interaction
      if (!userInteracting && docketRef.current) {
        // Auto-scroll to active task
        setTimeout(() => {
          const activeCardElement = activeCardRef.current
          if (activeCardElement) {
            activeCardElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 500)
      } else if (lastActiveNotch) {
        // Show toast when user is interacting
        setActiveToastNotch(currentActiveNotch)
        setShowActiveToast(true)
        setTimeout(() => setShowActiveToast(false), 4000)
      }
    } else if (!currentActiveNotch && lastActiveNotch) {
      setLastActiveNotch(null)
    }
  }, [sortedNotches, userInteracting, lastActiveNotch])

  // Handle toast "Jump to Now" action
  const handleJumpToNow = () => {
    setShowActiveToast(false)
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }

  // Handle marking notch as completed
  const handleMarkCompleted = async (notchId) => {
    if (processingStatus.has(notchId)) return

    setProcessingStatus(prev => new Set([...prev, notchId]))
    
    try {
      await markNotchCompleted(notchId)
    } catch (error) {
      console.error('Error marking notch as completed:', error)
      alert('Failed to mark task as completed: ' + error.message)
    } finally {
      setProcessingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(notchId)
        return newSet
      })
      // Reset swipe state after action
      resetSwipeState(notchId)
    }
  }

  // Handle marking notch as missed
  const handleMarkMissed = async (notchId) => {
    if (processingStatus.has(notchId)) return

    setProcessingStatus(prev => new Set([...prev, notchId]))
    
    try {
      await markNotchCancelled(notchId)
    } catch (error) {
      console.error('Error marking notch as missed:', error)
      alert('Failed to mark task as missed: ' + error.message)
    } finally {
      setProcessingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(notchId)
        return newSet
      })
      // Reset swipe state after action
      resetSwipeState(notchId)
    }
  }

  // Create swipe actions configuration based on notch status
  const getSwipeActions = (notch, status) => {
    const leftActions = []
    const rightActions = []

    switch (status) {
      case 'pending':
        // Pending tasks: Complete + Missed (right) - multi-option
        rightActions.push({
          id: 'complete',
          type: 'complete',
          icon: <FiCheck />,
          label: 'Complete',
          primary: true,
          onAction: () => handleMarkCompleted(notch.id)
        })
        rightActions.push({
          id: 'missed',
          type: 'missed',
          icon: <FiX />,
          label: 'Missed',
          primary: false,
          onAction: () => handleMarkMissed(notch.id)
        })
        break

      case 'upcoming':
      case 'ongoing':
        // Active tasks: Timer + Complete (left) / Details + Reschedule (right)
        leftActions.push({
          id: 'timer',
          type: 'timer',
          icon: <FiPlay />,
          label: 'Timer',
          primary: true,
          onAction: () => onStartTimer && onStartTimer(notch, 'docket')
        })
        leftActions.push({
          id: 'complete',
          type: 'complete',
          icon: <FiCheck />,
          label: 'Complete',
          primary: false,
          onAction: () => handleMarkCompleted(notch.id)
        })
        rightActions.push({
          id: 'details',
          type: 'details',
          icon: <FiEye />,
          label: 'Details',
          primary: true,
          onAction: () => handleCardClick(notch)
        })
        rightActions.push({
          id: 'reschedule',
          type: 'reschedule',
          icon: <FiRefreshCw />,
          label: 'Reschedule',
          primary: false,
          onAction: () => handleReschedule(notch)
        })
        break

      case 'cancelled':
        // Cancelled tasks: Do Now + Reschedule (right) - multi-option
        rightActions.push({
          id: 'do-now',
          type: 'timer',
          icon: <FiPlay />,
          label: 'Do Now',
          primary: true,
          onAction: () => handleDoNow(notch)
        })
        rightActions.push({
          id: 'reschedule',
          type: 'reschedule',
          icon: <FiRefreshCw />,
          label: 'Reschedule',
          primary: false,
          onAction: () => handleReschedule(notch)
        })
        break

      case 'completed':
        // Completed tasks: Details (right) - single option
        rightActions.push({
          id: 'details',
          type: 'details',
          icon: <FiEye />,
          label: 'Details',
          primary: true,
          onAction: () => handleCardClick(notch)
        })
        break

      default:
        break
    }

    return { leftActions, rightActions }
  }



  // More modal handling functions
  const openMoreModal = (notch) => {
    setMoreModalNotch(notch)
    setShowMoreModal(true)
  }

  const closeMoreModal = () => {
    setShowMoreModal(false)
    setMoreModalNotch(null)
  }

  // Handle card click - active runner goes to timer, others to details
  const handleCardClick = (notch) => {
    const status = calculateNotchStatus(notch)
    
    if (status === 'ongoing') {
      // Active runner - open fullscreen timer
      if (onOpenTimer) {
        onOpenTimer(notch)
      } else {
        // Fallback to starting timer if onOpenTimer not provided
        onStartTimer && onStartTimer(notch, 'docket')
      }
    } else {
      // All other statuses - show detail modal
      setSelectedNotch(notch)
      setShowDetailModal(true)
    }
  }

  // Handle timer button click
  const handleTimerClick = (e, notch) => {
    e.stopPropagation()
    onStartTimer && onStartTimer(notch, 'docket')
  }

  // Handle detail modal close
  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedNotch(null)
  }

  // Handle do now action for missed tasks
  const handleDoNow = async (notch) => {
    try {
      // Reset the task to upcoming status and start timer
      const updatedNotch = {
        ...notch,
        status: 'upcoming'
      }
      await updateNotch(updatedNotch)
      onStartTimer && onStartTimer(updatedNotch, 'docket')
    } catch (error) {
      console.error('Error handling do now:', error)
      alert('Failed to start task: ' + error.message)
    }
  }

  // Handle reschedule action for missed tasks
  const handleReschedule = (notch) => {
    // Open the detail modal for editing
    setSelectedNotch(notch)
    setShowDetailModal(true)
  }

  // Handle notch update from modal
  const handleUpdateNotch = async (updatedNotch) => {
    try {
      await updateNotch(updatedNotch)
      // The component will automatically re-render with updated data
      setShowDetailModal(false)
      setSelectedNotch(null)
    } catch (error) {
      console.error('Error updating notch:', error)
      alert('Failed to update task: ' + error.message)
    }
  }

  const renderNotchCard = (notch, index) => {
    const status = calculateNotchStatus(notch)
    const categoryColor = getNotchColor(notch) // Keep for category tag
    const timeRange = formatTimeRange(notch.startTime, notch.endTime)
    const duration = formatDuration(notch.startTime, notch.endTime)
    const isProcessing = processingStatus.has(notch.id)
    const isTimerRunning = isNotchTimerRunning(notch.id)
    const isActiveRunner = status === 'ongoing'
    
    // Calculate remaining time for active runner
    const remainingTime = isActiveRunner ? getActiveRunnerTimeRemaining(notch) : 0
    const remainingTimeFormatted = isActiveRunner ? formatTime(remainingTime) : null
    
    // Get swipe actions for this notch
    const { leftActions, rightActions } = getSwipeActions(notch, status)

    return (
      <SwipeableCard
        key={notch.id}
        leftActions={leftActions}
        rightActions={rightActions}
        disabled={isProcessing}
      >
        <div
          ref={isActiveRunner ? activeCardRef : null}
          className={`docket-card ${status} ${isActiveRunner ? 'active-runner' : ''}`}
          onClick={() => handleCardClick(notch)}
          data-notch-id={notch.id}
        >
          <div className="docket-card-content">
            {/* Main Row - All content in one row */}
            <div className="docket-card-row">
              {/* Left Side - Task Info */}
              <div className="docket-task-info">
                <div className="docket-title-row">
                  <h3 className="docket-notch-title">{notch.title}</h3>
                  {isActiveRunner && (
                    <div className="docket-now-indicator">
                      <span className="docket-now-text">Now</span>
                    </div>
                  )}
                </div>
                <div className="docket-meta-info">
                  <span className="docket-time-range">{timeRange}</span>
                  <span className="docket-duration">({duration})</span>
                  {(notch.categoryName || notch.category) && (
                    <span className="docket-category" style={{ color: categoryColor }}>
                      <FiTag size={12} />
                      {notch.categoryName || notch.category}
                    </span>
                  )}
                </div>
                {isActiveRunner && remainingTimeFormatted && (
                  <div className="docket-countdown">
                    <FiClock size={14} />
                    <span className="docket-countdown-text">
                      {remainingTimeFormatted} remaining
                    </span>
                  </div>
                )}
                {notch.notes && (
                  <p className="docket-notch-description">{notch.notes}</p>
                )}
              </div>

              {/* Right Side - Status-specific Actions */}
              <div className="docket-actions">
                {/* Pending cards: complete/missed buttons only */}
                {status === 'pending' && (
                  <>
                    <button
                      className="docket-action-btn complete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkCompleted(notch.id)
                      }}
                      title="Mark Complete"
                      disabled={isProcessing}
                    >
                      <FiCheck size={24} />
                    </button>
                    <button
                      className="docket-action-btn missed"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkMissed(notch.id)
                      }}
                      title="Mark Missed"
                      disabled={isProcessing}
                    >
                      <FiX size={24} />
                    </button>
                  </>
                )}

                {/* Missed/Cancelled cards: do now, reschedule, and more */}
                {status === 'cancelled' && (
                  <>
                    <button
                      className="docket-action-btn do-now"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDoNow(notch)
                      }}
                      title="Do Now"
                    >
                      <FiPlay size={24} />
                    </button>
                    <button
                      className="docket-action-btn reschedule"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReschedule(notch)
                      }}
                      title="Reschedule"
                    >
                      <FiRefreshCw size={24} />
                    </button>
                    <button
                      className="docket-action-btn menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMoreModal(notch)
                      }}
                      title="More actions"
                    >
                      <FiMoreHorizontal size={24} />
                    </button>
                  </>
                )}

                {/* All other statuses: just more button */}
                {(status === 'upcoming' || status === 'ongoing' || status === 'completed') && (
                  <button
                    className="docket-action-btn menu"
                    onClick={(e) => {
                      e.stopPropagation()
                      openMoreModal(notch)
                    }}
                    title="More actions"
                  >
                    <FiMoreHorizontal size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SwipeableCard>
    )
  }

  return (
    <div className="docket-view">
      <div className="docket-content" ref={docketRef}>
        {sortedNotches.length === 0 ? (
          <div className="docket-empty-state">
            <FiCalendar size={48} />
            <h2>No tasks scheduled for today</h2>
            <p>Your day is wide open! Consider adding some timeboxed tasks to make the most of your time.</p>
          </div>
        ) : (
          <div className="docket-cards">
            {sortedNotches.map((notch, index) => 
              renderNotchCard(notch, index)
            )}
          </div>
        )}
      </div>

      {/* Active Runner Toast */}
      {showActiveToast && activeToastNotch && (
        <div className="docket-active-toast">
          <div className="docket-active-toast-content">
            <div className="docket-active-toast-info">
              <span className="docket-active-toast-label">Now:</span>
              <span className="docket-active-toast-title">{activeToastNotch.title}</span>
            </div>
            <button 
              className="docket-active-toast-button"
              onClick={handleJumpToNow}
            >
              Jump to Now
            </button>
          </div>
        </div>
      )}

      {/* Notch Detail Modal */}
      <NotchDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        notch={selectedNotch}
        onUpdateNotch={handleUpdateNotch}
        onDeleteNotch={(notchId) => {
          // The component will automatically re-render with updated data
          handleCloseDetailModal()
        }}
      />

      {/* More Actions Modal */}
      <Modal
        isOpen={showMoreModal}
        onClose={closeMoreModal}
        title="Task Actions"
        subtitle={moreModalNotch?.title}
      >
        <div className="docket-more-actions">
          {/* Timer actions for upcoming/ongoing */}
          {moreModalNotch && (calculateNotchStatus(moreModalNotch) === 'upcoming' || calculateNotchStatus(moreModalNotch) === 'ongoing') && (
            <button
              className="docket-more-action-item primary"
              onClick={(e) => {
                e.stopPropagation()
                closeMoreModal()
                handleTimerClick(e, moreModalNotch)
              }}
            >
              <div className="docket-more-action-icon">
                <FiPlay size={20} />
              </div>
              <div className="docket-more-action-content">
                <span className="docket-more-action-title">
                  {isNotchTimerRunning(moreModalNotch?.id) ? 'Timer Running' : 'Start Timer'}
                </span>
                <span className="docket-more-action-subtitle">
                  {isNotchTimerRunning(moreModalNotch?.id) ? 'Timer is currently active for this task' : 'Begin working on this task'}
                </span>
              </div>
            </button>
          )}

          {/* Do Now action for cancelled tasks */}
          {moreModalNotch && calculateNotchStatus(moreModalNotch) === 'cancelled' && (
            <button
              className="docket-more-action-item primary"
              onClick={(e) => {
                e.stopPropagation()
                closeMoreModal()
                handleDoNow(moreModalNotch)
              }}
            >
              <div className="docket-more-action-icon">
                <FiPlay size={20} />
              </div>
              <div className="docket-more-action-content">
                <span className="docket-more-action-title">Do Now</span>
                <span className="docket-more-action-subtitle">Start this task immediately</span>
              </div>
            </button>
          )}

          {/* Mark Complete action for pending and upcoming tasks */}
          {moreModalNotch && (calculateNotchStatus(moreModalNotch) === 'pending' || calculateNotchStatus(moreModalNotch) === 'upcoming') && (
            <button
              className="docket-more-action-item"
              onClick={(e) => {
                e.stopPropagation()
                closeMoreModal()
                handleMarkCompleted(moreModalNotch.id)
              }}
            >
              <div className="docket-more-action-icon">
                <FiCheck size={20} />
              </div>
              <div className="docket-more-action-content">
                <span className="docket-more-action-title">Mark Complete</span>
                <span className="docket-more-action-subtitle">Mark this task as completed</span>
              </div>
            </button>
          )}

          {/* Cancel/Mark Missed action for pending and upcoming tasks */}
          {moreModalNotch && (calculateNotchStatus(moreModalNotch) === 'pending' || calculateNotchStatus(moreModalNotch) === 'upcoming') && (
            <button
              className="docket-more-action-item"
              onClick={(e) => {
                e.stopPropagation()
                closeMoreModal()
                handleMarkMissed(moreModalNotch.id)
              }}
            >
              <div className="docket-more-action-icon">
                <FiX size={20} />
              </div>
              <div className="docket-more-action-content">
                <span className="docket-more-action-title">
                  {calculateNotchStatus(moreModalNotch) === 'pending' ? 'Mark Missed' : 'Cancel'}
                </span>
                <span className="docket-more-action-subtitle">
                  {calculateNotchStatus(moreModalNotch) === 'pending' ? 'Mark this task as missed' : 'Cancel this scheduled task'}
                </span>
              </div>
            </button>
          )}

          {/* Reschedule action for all tasks except completed */}
          {moreModalNotch && calculateNotchStatus(moreModalNotch) !== 'completed' && (
            <button
              className="docket-more-action-item"
              onClick={(e) => {
                e.stopPropagation()
                closeMoreModal()
                handleReschedule(moreModalNotch)
              }}
            >
              <div className="docket-more-action-icon">
                <FiRefreshCw size={20} />
              </div>
              <div className="docket-more-action-content">
                <span className="docket-more-action-title">Reschedule</span>
                <span className="docket-more-action-subtitle">Change the time or date for this task</span>
              </div>
            </button>
          )}
          
          {/* View/Edit Details - always available */}
          <button
            className="docket-more-action-item"
            onClick={(e) => {
              e.stopPropagation()
              closeMoreModal()
              handleCardClick(moreModalNotch)
            }}
          >
            <div className="docket-more-action-icon">
              <FiEye size={20} />
            </div>
            <div className="docket-more-action-content">
              <span className="docket-more-action-title">Edit Details</span>
              <span className="docket-more-action-subtitle">View and edit task details</span>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default DocketView 