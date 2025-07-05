import { useEffect, useRef } from 'react'
import './style.css'

function Dropdown({ 
  isOpen, 
  onClose, 
  children, 
  position = 'bottom-right',
  className = '',
  triggerRef 
}) {
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return (
    <div 
      ref={dropdownRef}
      className={`dropdown ${className}`}
    >
      {children}
    </div>
  )
}

function DropdownItem({ 
  onClick, 
  children, 
  className = '', 
  disabled = false,
  variant = 'default' 
}) {
  return (
    <button
      className={`dropdown-item dropdown-item--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Dropdown
export { DropdownItem } 