import { useState, useEffect, useRef, useMemo } from 'react'
import { FiClock, FiTag, FiCalendar, FiCheck, FiX, FiPlay, FiMoreHorizontal, FiEye, FiRefreshCw } from 'react-icons/fi'
import { useNotchDB } from '../../../hooks/useNotchDB'
import { useTimer } from '../../../contexts/TimerContext'
import NotchDetailModal from '../../common/NotchDetailModal'
import Dropdown, { DropdownItem } from '../../common/Dropdown'
import './style.css'

function DocketView({ onStartTimer }) {
  const { 
    getNotchesByDate, 
    getCategoryById, 
    markNotchCompleted, 
    markNotchCancelled,
    updateNotch 
  } = useNotchDB()
  const { isNotchTimerRunning } = useTimer()
  
  const [selectedNotch, setSelectedNotch] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [processingStatus, setProcessingStatus] = useState(new Set())
  const [swipeStates, setSwipeStates] = useState({}) // Track swipe state per card
  const [dropdownStates, setDropdownStates] = useState({}) // Track dropdown state per card
  const [movingCards, setMovingCards] = useState(new Set()) // Track cards that are animating
  
  const docketRef = useRef(null)
  const swipeRefs = useRef({}) // Track refs for each card
  const dropdownRefs = useRef({}) // Track refs for dropdown triggers

  // Cleanup swipe states when component unmounts
  useEffect(() => {
    return () => {
      setSwipeStates({})
    }
  }, [])

  // Reset swipe states when clicking outside of cards
  useEffect(() => {
    const handleTouchOutside = (e) => {
      // Check if touch is outside any swipeable card
      const isOutside = !Object.values(swipeRefs.current).some(ref => 
        ref && ref.contains(e.target)
      )
      
      if (isOutside) {
        // Reset any active swipe states
        const hasActiveSwipes = Object.values(swipeStates).some(state => state?.showAction)
        if (hasActiveSwipes) {
          setSwipeStates({})
        }
      }
    }

    document.addEventListener('touchstart', handleTouchOutside)
    document.addEventListener('click', handleTouchOutside)
    
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside)
      document.removeEventListener('click', handleTouchOutside)
    }
  }, [swipeStates])
  
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

  // Auto-scroll to current/next event
  useEffect(() => {
    if (todayNotches.length === 0 || !docketRef.current) return

    const scrollToCurrentEvent = () => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      // Find the current or next event
      let targetIndex = -1
      
      for (let i = 0; i < todayNotches.length; i++) {
        const notch = todayNotches[i]
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
        for (let i = todayNotches.length - 1; i >= 0; i--) {
          const notch = todayNotches[i]
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
  }, [todayNotches.length]) // Only depend on length to avoid infinite re-renders

  // Calculate notch status based on current time
  const calculateNotchStatus = (notch) => {
    // Don't auto-calculate status if it's already been manually set
    if (notch.status === 'completed' || notch.status === 'cancelled') {
      return notch.status
    }

    const now = new Date()
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    
    const startTime = new Date(todayDate)
    startTime.setHours(startHour, startMin, 0, 0)
    
    const endTime = new Date(todayDate)
    endTime.setHours(endHour, endMin, 0, 0)
    
    if (now < startTime) {
      return 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      return 'ongoing'
    } else {
      return 'pending' // Past end time, waiting for user action
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

  // Handle marking notch as completed
  const handleMarkCompleted = async (notchId) => {
    if (processingStatus.has(notchId)) return

    setProcessingStatus(prev => new Set([...prev, notchId]))
    
    try {
      // Animate card movement before status change
      const currentNotch = todayNotches.find(n => n.id === notchId)
      const currentStatus = calculateNotchStatus(currentNotch)
      
      await markNotchCompleted(notchId)
      
      // Animate the card moving to completed section
      await animateCardMovement(notchId, currentStatus, 'completed')
      
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
      // Animate card movement before status change
      const currentNotch = todayNotches.find(n => n.id === notchId)
      const currentStatus = calculateNotchStatus(currentNotch)
      
      await markNotchCancelled(notchId)
      
      // Animate the card moving to missed section
      await animateCardMovement(notchId, currentStatus, 'cancelled')
      
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

  // Enhanced swipe handling functions
  const getSwipeThresholds = () => ({
    REVEAL_THRESHOLD: 40,    // Show first action
    SECONDARY_THRESHOLD: 80, // Show second action  
    HALFWAY_THRESHOLD: 160,  // Auto-trigger default action (50% of screen)
    AUTO_ACTION_THRESHOLD: 240 // Auto-trigger specific action
  })
  
  // Animation utilities
  const animateCardMovement = async (notchId, fromStatus, toStatus) => {
    setMovingCards(prev => new Set([...prev, notchId]))
    
    // Add moving-out class to trigger exit animation
    const cardElement = document.querySelector(`[data-notch-id="${notchId}"]`)
    if (cardElement) {
      cardElement.classList.add('moving-out')
    }
    
    // Wait for exit animation to complete
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Update the status and allow re-render
    setMovingCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(notchId)
      return newSet
    })
    
    // Add entry animation after re-render
    setTimeout(() => {
      const newCardElement = document.querySelector(`[data-notch-id="${notchId}"]`)
      if (newCardElement) {
        newCardElement.classList.add('moving-in')
        requestAnimationFrame(() => {
          newCardElement.classList.add('animate-in')
          setTimeout(() => {
            newCardElement.classList.remove('moving-in', 'animate-in')
          }, 400)
        })
      }
    }, 50)
  }

  const resetSwipeState = (notchId) => {
    setSwipeStates(prev => {
      const newStates = { ...prev }
      delete newStates[notchId]
      return newStates
    })
  }

  const handleSwipeStart = (notchId, clientX) => {
    setSwipeStates(prev => ({
      ...prev,
      [notchId]: {
        startX: clientX,
        currentX: clientX,
        isDragging: true,
        offset: 0,
        direction: null,
        showAction: false
      }
    }))
  }

  const handleSwipeMove = (notchId, clientX) => {
    const swipeState = swipeStates[notchId]
    if (!swipeState?.isDragging) return

    const deltaX = clientX - swipeState.startX
    const direction = deltaX > 0 ? 'right' : 'left'
    const absOffset = Math.abs(deltaX)
    const thresholds = getSwipeThresholds()

    // Determine which actions to show based on swipe distance
    let showPrimary = absOffset >= thresholds.REVEAL_THRESHOLD
    let showSecondary = absOffset >= thresholds.SECONDARY_THRESHOLD
    let nearHalfway = absOffset >= thresholds.HALFWAY_THRESHOLD
    let autoTrigger = absOffset >= thresholds.AUTO_ACTION_THRESHOLD

    setSwipeStates(prev => ({
      ...prev,
      [notchId]: {
        ...swipeState,
        currentX: clientX,
        offset: deltaX,
        direction,
        showAction: showPrimary,
        showSecondary,
        nearHalfway,
        autoTrigger,
        progress: Math.min(absOffset / thresholds.HALFWAY_THRESHOLD, 1)
      }
    }))
  }

  const handleSwipeEnd = async (notchId, status) => {
    const swipeState = swipeStates[notchId]
    if (!swipeState?.isDragging) return

    const absOffset = Math.abs(swipeState.offset)
    const thresholds = getSwipeThresholds()

    // Auto-trigger specific action if swiped all the way
    if (absOffset >= thresholds.AUTO_ACTION_THRESHOLD) {
      if (swipeState.direction === 'left') {
        // Swipe left action based on status
        if (status === 'pending') {
          await handleMarkCompleted(notchId)
        } else if (['upcoming', 'ongoing'].includes(status)) {
          const notch = todayNotches.find(n => n.id === notchId)
          if (notch && onStartTimer) {
            onStartTimer(notch, 'docket')
          }
        }
      } else if (swipeState.direction === 'right') {
        // Swipe right action based on status
        if (status === 'pending') {
          await handleMarkMissed(notchId)
        } else if (['upcoming', 'ongoing'].includes(status)) {
          const notch = todayNotches.find(n => n.id === notchId)
          if (notch) {
            handleCardClick(notch)
          }
        }
      }
    } 
    // Auto-trigger default action if swiped halfway across screen
    else if (absOffset >= thresholds.HALFWAY_THRESHOLD) {
      // Default action based on status and direction
      if (status === 'pending') {
        // Default for pending: left = complete, right = missed
        if (swipeState.direction === 'left') {
          await handleMarkCompleted(notchId)
        } else {
          await handleMarkMissed(notchId)
        }
      } else if (['upcoming', 'ongoing'].includes(status)) {
        // Default for active tasks: always start timer
        const notch = todayNotches.find(n => n.id === notchId)
        if (notch && onStartTimer) {
          onStartTimer(notch, 'docket')
        }
      } else if (status === 'cancelled') {
        // Default for missed: do now
        const notch = todayNotches.find(n => n.id === notchId)
        if (notch) {
          await handleDoNow(notch)
        }
      }
    } 
    // Show action buttons if swiped enough to reveal
    else if (absOffset >= thresholds.REVEAL_THRESHOLD) {
      setSwipeStates(prev => ({
        ...prev,
        [notchId]: {
          ...swipeState,
          isDragging: false,
          offset: swipeState.direction === 'left' ? -thresholds.SECONDARY_THRESHOLD : thresholds.SECONDARY_THRESHOLD,
          showAction: true,
          showSecondary: true
        }
      }))
      return // Don't reset, keep showing actions
    } 
    // Reset to original position
    else {
      resetSwipeState(notchId)
    }
  }

  const handleActionClick = async (notchId, action) => {
    if (action === 'complete') {
      await handleMarkCompleted(notchId)
    } else if (action === 'missed') {
      await handleMarkMissed(notchId)
    }
    // Close dropdown after action
    setDropdownStates(prev => ({ ...prev, [notchId]: false }))
  }

  // Dropdown handling functions
  const toggleDropdown = (notchId) => {
    setDropdownStates(prev => ({
      ...prev,
      [notchId]: !prev[notchId]
    }))
  }

  const closeDropdown = (notchId) => {
    setDropdownStates(prev => ({ ...prev, [notchId]: false }))
  }

  // Handle card click to show details
  const handleCardClick = (notch) => {
    setSelectedNotch(notch)
    setShowDetailModal(true)
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

  // Separate notches by status for display order
  const upcomingAndOngoingNotches = todayNotches.filter(notch => {
    const status = calculateNotchStatus(notch)
    return ['upcoming', 'ongoing', 'pending'].includes(status)
  })

  const completedNotches = todayNotches.filter(notch => {
    const status = calculateNotchStatus(notch)
    return ['completed', 'cancelled'].includes(status)
  })

  const renderNotchCard = (notch, index) => {
    const status = calculateNotchStatus(notch)
    const color = getNotchColor(notch)
    const timeRange = formatTimeRange(notch.startTime, notch.endTime)
    const duration = formatDuration(notch.startTime, notch.endTime)
    const isProcessing = processingStatus.has(notch.id)
    const isTimerRunning = isNotchTimerRunning(notch.id)
    const swipeState = swipeStates[notch.id]
    const isPending = status === 'pending'

    // Touch event handlers for swiping (all cards can be swiped)
    const handleTouchStart = (e) => {
      e.stopPropagation()
      handleSwipeStart(notch.id, e.touches[0].clientX)
    }

    const handleTouchMove = (e) => {
      if (!swipeState?.isDragging) return
      e.preventDefault()
      handleSwipeMove(notch.id, e.touches[0].clientX)
    }

    const handleTouchEnd = (e) => {
      e.stopPropagation()
      handleSwipeEnd(notch.id, status)
    }

    return (
      <div
        key={notch.id}
        className="docket-card-container swipeable"
        data-notch-id={notch.id}
        ref={el => {
          if (el) swipeRefs.current[notch.id] = el
        }}
      >
        {/* Enhanced Swipe Actions with Progress */}
        {swipeState?.showAction && (
          <div className="docket-swipe-backdrop">
            {/* Progress indicator */}
            <div 
              className={`docket-swipe-progress ${swipeState.direction}`}
              style={{
                width: `${(swipeState.progress || 0) * 100}%`,
                opacity: swipeState.nearHalfway ? 0.3 : 0.1
              }}
            />
            
            {/* Left swipe actions */}
            {swipeState.direction === 'left' && (
              <>
                {/* Primary action */}
                <div 
                  className={`docket-swipe-action left-1 ${
                    status === 'pending' ? 'complete' : 
                    status === 'cancelled' ? 'do-now' : 'timer'
                  } ${swipeState.nearHalfway ? 'primary revealed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (status === 'pending') {
                      handleActionClick(notch.id, 'complete')
                    } else if (['upcoming', 'ongoing'].includes(status)) {
                      onStartTimer && onStartTimer(notch, 'docket')
                    } else if (status === 'cancelled') {
                      handleDoNow(notch)
                    }
                  }}
                >
                  {status === 'pending' ? (
                    <>
                      <FiCheck size={swipeState.nearHalfway ? 28 : 20} />
                      <span>Complete</span>
                    </>
                  ) : status === 'cancelled' ? (
                    <>
                      <FiPlay size={swipeState.nearHalfway ? 28 : 20} />
                      <span>Do Now</span>
                    </>
                  ) : (
                    <>
                      <FiPlay size={swipeState.nearHalfway ? 28 : 20} />
                      <span>Timer</span>
                    </>
                  )}
                </div>
                
                {/* Secondary action for cancelled tasks */}
                {status === 'cancelled' && swipeState.showSecondary && (
                  <div 
                    className="docket-swipe-action left-2 reschedule"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReschedule(notch)
                    }}
                  >
                    <FiRefreshCw size={20} />
                    <span>Reschedule</span>
                  </div>
                )}
              </>
            )}
            
            {/* Right swipe actions */}
            {swipeState.direction === 'right' && (
              <>
                {/* Primary action */}
                <div 
                  className={`docket-swipe-action right-1 ${
                    status === 'pending' ? 'missed' : 'details'
                  } ${swipeState.nearHalfway ? 'primary revealed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (status === 'pending') {
                      handleActionClick(notch.id, 'missed')
                    } else {
                      handleCardClick(notch)
                    }
                  }}
                >
                  {status === 'pending' ? (
                    <>
                      <FiX size={swipeState.nearHalfway ? 28 : 20} />
                      <span>Missed</span>
                    </>
                  ) : (
                    <>
                      <FiEye size={swipeState.nearHalfway ? 28 : 20} />
                      <span>Details</span>
                    </>
                  )}
                </div>
                
                {/* Secondary action for some statuses */}
                {swipeState.showSecondary && ['upcoming', 'ongoing'].includes(status) && (
                  <div 
                    className="docket-swipe-action right-2 timer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartTimer && onStartTimer(notch, 'docket')
                    }}
                  >
                    <FiPlay size={20} />
                    <span>Start</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Main card */}
                <div
          className={`docket-card ${status}`}
          onClick={() => !swipeState?.isDragging && handleCardClick(notch)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            borderLeftColor: color,
            backgroundColor: `${color}15`,
            transform: swipeState ? `translateX(${swipeState.offset}px)` : 'translateX(0)',
            transition: swipeState?.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="docket-card-content">
            {/* Main Row - All content in one row */}
            <div className="docket-card-row">
              {/* Left Side - Task Info */}
              <div className="docket-task-info">
                <h3 className="docket-notch-title">{notch.title}</h3>
                <div className="docket-meta-info">
                  <span className="docket-time-range">{timeRange}</span>
                  <span className="docket-duration">({duration})</span>
                  {(notch.categoryName || notch.category) && (
                    <span className="docket-category" style={{ color: color }}>
                      <FiTag size={12} />
                      {notch.categoryName || notch.category}
                    </span>
                  )}
                </div>
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
                        handleActionClick(notch.id, 'complete')
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
                        handleActionClick(notch.id, 'missed')
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
                    <div className="docket-dropdown-container">
                      <button
                        ref={el => {
                          if (el) dropdownRefs.current[notch.id] = el
                        }}
                        className="docket-action-btn menu"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDropdown(notch.id)
                        }}
                        title="More actions"
                      >
                        <FiMoreHorizontal size={24} />
                      </button>
                      
                      <Dropdown
                        isOpen={dropdownStates[notch.id] || false}
                        onClose={() => closeDropdown(notch.id)}
                        triggerRef={dropdownRefs.current[notch.id] ? { current: dropdownRefs.current[notch.id] } : undefined}
                      >
                        <DropdownItem
                          onClick={(e) => {
                            e.stopPropagation()
                            closeDropdown(notch.id)
                            handleCardClick(notch)
                          }}
                        >
                          <FiEye size={16} />
                          View Details
                        </DropdownItem>
                      </Dropdown>
                    </div>
                  </>
                )}

                {/* All other statuses: just more button */}
                {(status === 'upcoming' || status === 'ongoing' || status === 'completed') && (
                  <div className="docket-dropdown-container">
                    <button
                      ref={el => {
                        if (el) dropdownRefs.current[notch.id] = el
                      }}
                      className="docket-action-btn menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleDropdown(notch.id)
                      }}
                      title="More actions"
                    >
                      <FiMoreHorizontal size={24} />
                    </button>
                    
                    <Dropdown
                      isOpen={dropdownStates[notch.id] || false}
                      onClose={() => closeDropdown(notch.id)}
                      triggerRef={dropdownRefs.current[notch.id] ? { current: dropdownRefs.current[notch.id] } : undefined}
                    >
                      {/* Timer actions for upcoming/ongoing */}
                      {(status === 'upcoming' || status === 'ongoing') && (
                        <DropdownItem
                          onClick={(e) => {
                            e.stopPropagation()
                            closeDropdown(notch.id)
                            handleTimerClick(e, notch)
                          }}
                          variant="primary"
                        >
                          <FiPlay size={16} />
                          {isTimerRunning ? 'Timer Running' : 'Start Timer'}
                        </DropdownItem>
                      )}
                      
                      {/* Common actions for all tasks */}
                      <DropdownItem
                        onClick={(e) => {
                          e.stopPropagation()
                          closeDropdown(notch.id)
                          handleCardClick(notch)
                        }}
                      >
                        <FiEye size={16} />
                        View Details
                      </DropdownItem>
                    </Dropdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="docket-view">
      <div className="docket-content" ref={docketRef}>
        {todayNotches.length === 0 ? (
          <div className="docket-empty-state">
            <FiCalendar size={48} />
            <h2>No tasks scheduled for today</h2>
            <p>Your day is wide open! Consider adding some timeboxed tasks to make the most of your time.</p>
          </div>
        ) : (
          <>
            {/* Active Tasks Section */}
            {upcomingAndOngoingNotches.length > 0 && (
              <div className="docket-section">
                <h2 className="docket-section-title">
                  Today's Schedule
                  <span className="docket-section-count">
                    {upcomingAndOngoingNotches.length}
                  </span>
                </h2>
                <div className="docket-cards">
                  {upcomingAndOngoingNotches.map((notch, index) => 
                    renderNotchCard(notch, index)
                  )}
                </div>
              </div>
            )}

            {/* Completed Tasks Section */}
            {completedNotches.length > 0 && (
              <div className="docket-section completed-section">
                <h2 className="docket-section-title">
                  Completed
                  <span className="docket-section-count">
                    {completedNotches.length}
                  </span>
                </h2>
                <div className="docket-cards">
                  {completedNotches.map((notch, index) => 
                    renderNotchCard(notch, index)
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
    </div>
  )
}

export default DocketView 