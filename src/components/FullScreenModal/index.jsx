import { useEffect } from 'react'
import { FiMinimize2 } from 'react-icons/fi'
import './style.css'

function FullScreenModal({ isOpen, onClose, children }) {
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

  if (!isOpen) return null

  return (
    <div className="fullscreen-modal-overlay">
      <div className="fullscreen-modal-content">
        <button 
          className="fullscreen-modal-close-btn" 
          onClick={onClose} 
          title="Exit Fullscreen"
        >
          <FiMinimize2 size={28} />
        </button>
        <div className="fullscreen-modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default FullScreenModal 