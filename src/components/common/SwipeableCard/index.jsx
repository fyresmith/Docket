import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { swipeRegistry } from './swipeRegistry'
import './style.css'

const SwipeableCard = ({ 
  children, 
  leftActions = [], 
  rightActions = [], 
  onSwipeStart,
  onSwipeEnd,
  disabled = false,
  threshold = {
    reveal: 60,        // Distance to reveal actions
    trigger: 140,      // Distance to trigger default action (single options)
    autoTrigger: 200,  // Distance to auto-trigger without release (single options)
    multiTrigger: 240, // Distance to auto-trigger for multi-option sides (2/3 screen)
    offsetPosition: 80 // Position to offset card for button interaction
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
    willTrigger: false,
    isMultiOption: false
  })

  const cardRef = useRef(null)
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const isDraggingRef = useRef(false)
  
  // Generate unique ID for this card instance
  const cardId = useMemo(() => Math.random().toString(36).substr(2, 9), [])

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
      willTrigger: false,
      isMultiOption: false
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
    
    // Reset all other cards when this one starts swiping
    swipeRegistry.resetOthers(cardId)
    
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
      willTrigger: false,
      isMultiOption: false
    })
  }, [disabled, onSwipeStart, updateSwipeState, cardId])

  // Handle swipe move with progressive calculations
  const handleSwipeMove = useCallback((clientX) => {
    if (!isDraggingRef.current || disabled) return

    const deltaX = clientX - swipeState.startX
    const absDeltaX = Math.abs(deltaX)
    const direction = deltaX > 0 ? 'right' : 'left'
    
    // Get current actions and check if we can swipe in this direction
    const currentActions = direction === 'left' ? leftActions : rightActions
    if (!currentActions || currentActions.length === 0) {
      // Cannot swipe in this direction, reset
      resetSwipe()
      return
    }
    
    // Determine if this is a multi-option side
    const isMultiOption = currentActions.length > 1
    const triggerThreshold = isMultiOption ? threshold.multiTrigger : threshold.trigger
    const autoTriggerThreshold = isMultiOption ? threshold.multiTrigger : threshold.autoTrigger
    
    // Progressive calculations
    const progress = Math.min(absDeltaX / triggerThreshold, 1)
    const revealed = absDeltaX >= threshold.reveal
    const willTrigger = absDeltaX >= triggerThreshold
    
    updateSwipeState({
      currentX: clientX,
      deltaX,
      direction,
      progress,
      revealed,
      willTrigger,
      isMultiOption
    })
  }, [disabled, swipeState.startX, threshold, leftActions, rightActions, updateSwipeState, resetSwipe])

  // Handle swipe end with action triggering
  const handleSwipeEnd = useCallback(async () => {
    if (!isDraggingRef.current || disabled) return

    const { deltaX, direction, willTrigger, isMultiOption } = swipeState
    const absDeltaX = Math.abs(deltaX)
    const actions = direction === 'left' ? leftActions : rightActions
    
    // Determine the appropriate trigger threshold
    const triggerThreshold = isMultiOption ? threshold.multiTrigger : threshold.autoTrigger
    
    // Auto-trigger action if swiped far enough
    if (absDeltaX >= triggerThreshold || (willTrigger && !isMultiOption)) {
      const primaryAction = actions.find(action => action.primary) || actions[0]
      
      if (primaryAction) {
        try {
          await primaryAction.onAction()
          onSwipeEnd?.()
          resetSwipe()
          return
        } catch (error) {
          console.error('Swipe action failed:', error)
        }
      }
    }
    
    // If revealed but not triggering, position for button interaction
    if (absDeltaX >= threshold.reveal) {
      let offsetDistance
      
      if (actions.length === 1) {
        // Single option: position to show the button nicely
        offsetDistance = direction === 'left' ? -threshold.offsetPosition : threshold.offsetPosition
      } else {
        // Multiple options: calculate based on button count
        const buttonWidth = 64 + 8 // button width + gap
        const totalButtonWidth = actions.length * buttonWidth + 16 // buttons + padding
        offsetDistance = direction === 'left' ? -totalButtonWidth : totalButtonWidth
      }
      
      setSwipeState(prevState => ({
        ...prevState,
        isDragging: false,
        deltaX: offsetDistance,
        revealed: true,
        willTrigger: false
      }))
      isDraggingRef.current = false
      return
    }
    
    // Otherwise, reset to original position
    onSwipeEnd?.()
    resetSwipe()
  }, [disabled, swipeState, threshold, leftActions, rightActions, onSwipeEnd, resetSwipe])

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

  // Register/unregister with global registry
  useEffect(() => {
    swipeRegistry.register(cardId, resetSwipe)
    return () => {
      swipeRegistry.unregister(cardId)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [cardId, resetSwipe])

  // Get current actions based on swipe direction
  const currentActions = swipeState.direction === 'left' ? leftActions : rightActions
  const hasActions = currentActions && currentActions.length > 0
  const primaryAction = currentActions?.find(action => action.primary) || currentActions?.[0]

  // Calculate transform and styling
  const transform = `translateX(${swipeState.deltaX}px)`
  const backgroundOpacity = hasActions ? Math.min(swipeState.progress * 0.3, 0.3) : 0
  const backgroundType = primaryAction?.type || 'default'

  return (
    <div 
      ref={containerRef}
      className={`swipeable-card-container ${swipeState.isDragging ? 'dragging' : ''} ${swipeState.revealed ? 'revealed' : ''}`}
    >
            {/* Background highlight that grows progressively */}
      <div 
        className={`swipeable-card-background ${swipeState.direction || ''} ${backgroundType}`}
        style={{
          opacity: backgroundOpacity,
          transform: `translateX(${Math.max(Math.min(swipeState.deltaX, threshold.trigger), -threshold.trigger)}px)`
        }}
      />
      
      {/* Action buttons that scale and appear progressively */}
      {hasActions && swipeState.revealed && (
        <div className={`swipeable-card-actions ${swipeState.direction === 'left' ? 'right' : 'left'}`}>
          {currentActions.map((action, index) => (
            <button
              key={action.id || index}
              className={`swipeable-action-button ${action.type || ''} ${action.primary ? 'primary' : ''} ${swipeState.willTrigger && action.primary ? 'will-trigger' : ''} ${swipeState.isMultiOption ? 'multi-option' : 'single-option'}`}
              onClick={(e) => {
                e.stopPropagation()
                action.onAction()
                resetSwipe()
              }}
              disabled={swipeState.isDragging}
                              style={{
                  transform: swipeState.isDragging 
                    ? `scale(${Math.min(0.7 + (swipeState.progress * 0.3), 1)})` 
                    : 'scale(1)', // Full size when settled for mobile ergonomics
                  opacity: Math.min(swipeState.progress * 1.5, 1),
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