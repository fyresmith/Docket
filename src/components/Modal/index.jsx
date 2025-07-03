import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import './style.css'

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  footerActions,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  maxWidth = '500px',
  className = ''
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [startY, setStartY] = useState(null)
  const [currentY, setCurrentY] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Handle modal visibility and animation states
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
    } else if (shouldRender) {
      // Only set closing if modal is already rendered
      setIsClosing(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen, shouldRender])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
      
      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const handleClose = () => {
    if (!closeOnOverlayClick) return
    setIsClosing(true)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose()
    }, 300) // Match the CSS animation duration
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      handleClose()
    }
  }

  // Touch event handlers for swipe to close
  const handleTouchStart = (e) => {
    // Only handle touch events on the drag handle or header area
    const target = e.target
    const isDragHandle = target.closest('.modal-drag-handle') || target.closest('.modal-header')
    if (!isDragHandle) return
    
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || startY === null) return
    
    const currentY = e.touches[0].clientY
    setCurrentY(currentY)
    
    // Only allow downward swipes
    const deltaY = currentY - startY
    if (deltaY > 0) {
      e.preventDefault()
      // Apply transform to create drag effect with smooth resistance
      const modal = e.currentTarget.querySelector('.modal')
      if (modal) {
        const resistance = Math.min(deltaY * 0.8, 120) // Add resistance curve
        modal.style.transform = `translateY(${resistance}px)`
        modal.style.opacity = Math.max(1 - deltaY / 400, 0.6)
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (!isDragging || startY === null || currentY === null) {
      setIsDragging(false)
      setStartY(null)
      setCurrentY(null)
      return
    }

    const deltaY = currentY - startY
    const modal = e.currentTarget.querySelector('.modal')
    
    if (modal) {
      // Calculate velocity for momentum-based closing
      const velocity = deltaY / 10 // Simple velocity calculation
      
      // If dragged down more than 80px or fast swipe (velocity > 8), close the modal
      if (deltaY > 80 || velocity > 8) {
        modal.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
        modal.style.transform = 'translateY(100%)'
        modal.style.opacity = '0'
        setTimeout(() => {
          handleClose()
        }, 300)
      } else {
        // Reset transform with smooth animation
        modal.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
        modal.style.transform = 'translateY(0)'
        modal.style.opacity = '1'
        
        // Clear transition after animation
        setTimeout(() => {
          modal.style.transition = ''
        }, 300)
      }
    }

    setIsDragging(false)
    setStartY(null)
    setCurrentY(null)
  }

  if (!shouldRender) return null

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'closing' : ''}`} 
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`modal ${isClosing ? 'closing' : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        {/* Drag Handle */}
        <div className="modal-drag-handle">
          <div className="drag-bar"></div>
        </div>

        {/* Header */}
        {(title || subtitle || showCloseButton) && (
          <div className="modal-header">
            {(title || subtitle) && (
              <div className="modal-title">
                {title && <h2>{title}</h2>}
                {subtitle && <p className="modal-subtitle">{subtitle}</p>}
              </div>
            )}
            {showCloseButton && (
              <button 
                className="modal-close"
                onClick={handleClose}
                aria-label="Close"
              >
                <FiX size={24} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="modal-body">
          {children}
        </div>

        {/* Sticky Footer */}
        {footerActions && (
          <div className="modal-footer">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal 