import { useState, useRef, useEffect } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import './SwipeableNotchCard.css'

function SwipeableNotchCard({ children, onDelete, notchId, notchTitle }) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [currentPhase, setCurrentPhase] = useState('none')
  const [screenWidth, setScreenWidth] = useState(0)
  const cardRef = useRef(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const isDraggingRef = useRef(false)

  // Measure screen width
  useEffect(() => {
    const measureDimensions = () => {
      setScreenWidth(window.innerWidth)
    }

    measureDimensions()
    
    // Re-measure on window resize
    window.addEventListener('resize', measureDimensions)
    return () => window.removeEventListener('resize', measureDimensions)
  }, [])

  // Calculate swipe thresholds based on screen width
  const getThresholds = () => {
    const width = screenWidth || 375 // Fallback width
    const snapThreshold = -(width * 0.4) // 2/5 of screen width
    
    return {
      INITIAL_DRAG_THRESHOLD: -20, // Cube appears and fades in
      ICON_THRESHOLD: -50, // Trash icon appears
      SQUARE_THRESHOLD: -80, // Button stays square
      SNAP_THRESHOLD: snapThreshold, // Button snaps to fill entire space
      AUTO_DELETE_THRESHOLD: snapThreshold - 20 // Auto delete zone
    }
  }

  const thresholds = getThresholds()

  // Calculate current swipe phase
  const getSwipePhase = () => {
    if (swipeOffset >= thresholds.INITIAL_DRAG_THRESHOLD) return 'none'
    if (swipeOffset >= thresholds.ICON_THRESHOLD) return 'initial' // Cube fade-in
    if (swipeOffset >= thresholds.SQUARE_THRESHOLD) return 'icon' // Icon visible
    if (swipeOffset >= thresholds.SNAP_THRESHOLD) return 'square' // Square button
    if (swipeOffset >= thresholds.AUTO_DELETE_THRESHOLD) return 'stable' // Stable state
    return 'auto-delete' // Auto delete zone
  }

  // Get fixed width for each phase - initial is now cube-sized
  const getPhaseWidth = (phase) => {
    switch (phase) {
      case 'none':
        return 0
      case 'initial':
        return 80 // Start as cube size
      case 'icon':
        return 60 // Smaller for icon phase
      case 'square':
      case 'stable':
        return 80 // Back to square size
      case 'auto-delete':
        return Math.abs(swipeOffset) // Only this one updates continuously
      default:
        return 0
    }
  }

  // Check if we should show the trash icon
  const shouldShowIcon = () => {
    return ['icon', 'square', 'stable', 'auto-delete'].includes(currentPhase)
  }

  // Check if we're in snap-expanded state
  const isSnapExpanded = () => {
    return currentPhase === 'auto-delete'
  }

  // Reset swipe state
  const resetSwipe = () => {
    setSwipeOffset(0)
    setShowDeleteButton(false)
    setIsDeleting(false)
    setCurrentPhase('none')
    isDraggingRef.current = false
  }

  // Handle swipe start (touch and mouse)
  const handleSwipeStart = (clientX) => {
    startXRef.current = clientX
    currentXRef.current = clientX
    isDraggingRef.current = true
  }

  // Handle swipe move (touch and mouse)
  const handleSwipeMove = (clientX) => {
    if (!isDraggingRef.current) return

    const deltaX = clientX - startXRef.current
    
    // Only allow left swipes (negative deltaX)
    if (deltaX >= 0) {
      resetSwipe()
      return
    }

    currentXRef.current = clientX
    setSwipeOffset(deltaX)
    
    // Calculate new phase
    const newPhase = getSwipePhase()
    
    // Only update phase state when it actually changes (reduces re-renders)
    if (newPhase !== currentPhase) {
      setCurrentPhase(newPhase)
    }
    
    // Show delete button when initial threshold is reached
    const shouldShow = deltaX <= thresholds.INITIAL_DRAG_THRESHOLD
    if (shouldShow !== showDeleteButton) {
      setShowDeleteButton(shouldShow)
    }
  }

  // Handle swipe end
  const handleSwipeEnd = () => {
    if (!isDraggingRef.current) return
    
    const deltaX = currentXRef.current - startXRef.current
    const phase = getSwipePhase()
    
    // Auto-delete if in auto-delete zone
    if (phase === 'auto-delete') {
      handleDelete()
    } else if (phase === 'stable' || phase === 'square') {
      // Snap to stable position (square button visible)
      setSwipeOffset(thresholds.SQUARE_THRESHOLD)
      setCurrentPhase('square')
      setShowDeleteButton(true)
    } else {
      // Snap back to original position
      resetSwipe()
    }
    
    isDraggingRef.current = false
  }

  // Handle delete confirmation
  const handleDelete = async () => {
    if (isDeleting) return
    
    setIsDeleting(true)
    
    // Show browser confirmation prompt
    const confirmDelete = window.confirm(`Are you sure you want to delete "${notchTitle}"?`)
    
    if (confirmDelete) {
      try {
        await onDelete(notchId)
      } catch (error) {
        console.error('Error deleting notch:', error)
        alert('Failed to delete task: ' + error.message)
        resetSwipe()
      }
    } else {
      // User cancelled, reset swipe
      resetSwipe()
    }
    
    setIsDeleting(false)
  }

  // Touch event handlers
  const handleTouchStart = (e) => {
    handleSwipeStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    handleSwipeMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleSwipeEnd()
  }

  // Mouse event handlers
  const handleMouseDown = (e) => {
    // Only handle left mouse button
    if (e.button !== 0) return
    handleSwipeStart(e.clientX)
  }

  const handleMouseMove = (e) => {
    handleSwipeMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleSwipeEnd()
  }

  // Global mouse events for mouse drag
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleMouseMove(e)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        handleMouseUp()
      }
    }

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  // Handle click outside to reset swipe
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target) && showDeleteButton) {
        resetSwipe()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDeleteButton])

  return (
    <div 
      className="swipeable-notch-container"
      ref={cardRef}
    >
      {/* Main card content */}
      <div
        className={`swipeable-notch-card ${isDeleting ? 'deleting' : ''} ${isSnapExpanded() ? 'snap-expanded' : ''}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>

      {/* Delete button (revealed on swipe) - entire area is clickable */}
      {showDeleteButton && (
        <div 
          className={`delete-action delete-action--${currentPhase} ${isSnapExpanded() ? 'snap-expanded' : ''}`}
          style={{
            width: `${getPhaseWidth(currentPhase)}px`,
          }}
          onClick={handleDelete}
        >
          {shouldShowIcon() && <FiTrash2 size={18} />}
        </div>
      )}
    </div>
  )
}

export default SwipeableNotchCard 