import { useState, useRef, useEffect, useCallback } from 'react'
import './style.css'

const SwipeableCard = ({ 
  children, 
  leftActions = [], 
  rightActions = [], 
  onSwipeStart,
  onSwipeEnd,
  disabled = false,
  threshold = {
    reveal: 60,      // Distance to reveal actions
    trigger: 140,    // Distance to trigger default action
    autoTrigger: 200 // Distance to auto-trigger without release
  }
}) => {
  const [swipeState, setSwipeState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    deltaX: 0,
    direction: null,
    progress: 0,
    revealed: false,
    willTrigger: false
  })

  const cardRef = useRef(null)
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const isDraggingRef = useRef(false)

  // Reset swipe state
  const resetSwipe = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    setSwipeState({
      isDragging: false,
      startX: 0,
      currentX: 0,
      deltaX: 0,
      direction: null,
      progress: 0,
      revealed: false,
      willTrigger: false
    })
    isDraggingRef.current = false
  }, [])

  // Smooth animation frame update
  const updateSwipeState = useCallback((newState) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    animationRef.current = requestAnimationFrame(() => {
      setSwipeState(prevState => ({ ...prevState, ...newState }))
    })
  }, [])

  // Handle swipe start
  const handleSwipeStart = useCallback((clientX) => {
    if (disabled) return
    
    isDraggingRef.current = true
    onSwipeStart?.()
    
    updateSwipeState({
      isDragging: true,
      startX: clientX,
      currentX: clientX,
      deltaX: 0,
      direction: null,
      progress: 0,
      revealed: false,
      willTrigger: false
    })
  }, [disabled, onSwipeStart, updateSwipeState])

  // Handle swipe move with progressive calculations
  const handleSwipeMove = useCallback((clientX) => {
    if (!isDraggingRef.current || disabled) return

    const deltaX = clientX - swipeState.startX
    const absDeltaX = Math.abs(deltaX)
    const direction = deltaX > 0 ? 'right' : 'left'
    
    // Progressive calculations
    const progress = Math.min(absDeltaX / threshold.trigger, 1)
    const revealed = absDeltaX >= threshold.reveal
    const willTrigger = absDeltaX >= threshold.trigger
    
    updateSwipeState({
      currentX: clientX,
      deltaX,
      direction,
      progress,
      revealed,
      willTrigger
    })
  }, [disabled, swipeState.startX, threshold, updateSwipeState])

  // Handle swipe end with action triggering
  const handleSwipeEnd = useCallback(async () => {
    if (!isDraggingRef.current || disabled) return

    const { deltaX, direction, willTrigger } = swipeState
    const absDeltaX = Math.abs(deltaX)
    
    // Determine if we should trigger an action
    if (absDeltaX >= threshold.autoTrigger || willTrigger) {
      const actions = direction === 'left' ? rightActions : leftActions
      const primaryAction = actions.find(action => action.primary) || actions[0]
      
      if (primaryAction) {
        try {
          await primaryAction.onAction()
        } catch (error) {
          console.error('Swipe action failed:', error)
        }
      }
    }
    
    onSwipeEnd?.()
    resetSwipe()
  }, [disabled, swipeState, threshold, rightActions, leftActions, onSwipeEnd, resetSwipe])

  // Touch events
  const handleTouchStart = useCallback((e) => {
    e.stopPropagation()
    handleSwipeStart(e.touches[0].clientX)
  }, [handleSwipeStart])

  const handleTouchMove = useCallback((e) => {
    if (isDraggingRef.current) {
      e.preventDefault()
      e.stopPropagation()
      handleSwipeMove(e.touches[0].clientX)
    }
  }, [handleSwipeMove])

  const handleTouchEnd = useCallback((e) => {
    e.stopPropagation()
    handleSwipeEnd()
  }, [handleSwipeEnd])

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return // Only left mouse button
    e.preventDefault()
    handleSwipeStart(e.clientX)
  }, [handleSwipeStart])

  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current) {
      e.preventDefault()
      handleSwipeMove(e.clientX)
    }
  }, [handleSwipeMove])

  const handleMouseUp = useCallback((e) => {
    if (isDraggingRef.current) {
      e.preventDefault()
      handleSwipeEnd()
    }
  }, [handleSwipeEnd])

  // Global mouse events for drag outside component
  useEffect(() => {
    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp, { passive: false })
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [swipeState.isDragging, handleMouseMove, handleMouseUp])

  // Handle click outside to reset
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target) && 
        (swipeState.revealed && !swipeState.isDragging)
      ) {
        resetSwipe()
      }
    }

    if (swipeState.revealed && !swipeState.isDragging) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [swipeState.revealed, swipeState.isDragging, resetSwipe])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Get current actions based on swipe direction
  const currentActions = swipeState.direction === 'left' ? rightActions : leftActions
  const hasActions = currentActions && currentActions.length > 0

  // Calculate transform and styling
  const transform = `translateX(${swipeState.deltaX}px)`
  const backgroundOpacity = hasActions ? Math.min(swipeState.progress * 0.3, 0.3) : 0

  return (
    <div 
      ref={containerRef}
      className={`swipeable-card-container ${swipeState.isDragging ? 'dragging' : ''} ${swipeState.revealed ? 'revealed' : ''}`}
    >
      {/* Background highlight that grows progressively */}
      <div 
        className={`swipeable-card-background ${swipeState.direction || ''}`}
        style={{
          opacity: backgroundOpacity,
          transform: swipeState.direction === 'left' 
            ? `translateX(${Math.max(swipeState.deltaX, -threshold.trigger)}px)` 
            : `translateX(${Math.min(swipeState.deltaX, threshold.trigger)}px)`
        }}
      />
      
      {/* Action buttons that scale and appear progressively */}
      {hasActions && swipeState.revealed && (
        <div className={`swipeable-card-actions ${swipeState.direction}`}>
          {currentActions.map((action, index) => (
            <button
              key={action.id || index}
              className={`swipeable-action-button ${action.type || ''} ${action.primary ? 'primary' : ''} ${swipeState.willTrigger && action.primary ? 'will-trigger' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                action.onAction()
                resetSwipe()
              }}
              disabled={swipeState.isDragging}
              style={{
                transform: `scale(${Math.min(0.7 + (swipeState.progress * 0.3), 1)})`,
                opacity: Math.min(swipeState.progress * 2, 1),
                transitionDelay: `${index * 50}ms`
              }}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Main card content */}
      <div
        ref={cardRef}
        className={`swipeable-card ${swipeState.willTrigger ? 'will-trigger' : ''}`}
        style={{
          transform,
          transition: swipeState.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  )
}

export default SwipeableCard 