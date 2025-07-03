import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './style.css'

function MobileTimePicker({ 
  value, 
  onChange, 
  minValue = 0, 
  maxValue = 23, 
  step = 1,
  format = '24h',
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false)
  // Ensure we have a valid initial value
  const [selectedValue, setSelectedValue] = useState(
    value !== undefined && value !== null && !isNaN(value) ? value : minValue
  )
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef(null)
  const optionsRef = useRef(null)

  useEffect(() => {
    // Only update if we have a valid value
    if (value !== undefined && value !== null && !isNaN(value)) {
      setSelectedValue(value)
    }
  }, [value])

  // Auto-scroll to selected value when dropdown opens
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const options = generateOptions()
      const selectedIndex = options.findIndex(option => option === selectedValue)
      
      if (selectedIndex !== -1) {
        // Small delay to ensure the dropdown is rendered
        setTimeout(() => {
          if (optionsRef.current) {
            // Dynamically measure option height
            const firstOption = optionsRef.current.querySelector('.mobile-time-picker-option')
            const optionHeight = firstOption ? firstOption.offsetHeight : 44
            
            // Calculate scroll position to show selected item at top
            const scrollTop = selectedIndex * optionHeight
            
            optionsRef.current.scrollTo({
              top: scrollTop,
              behavior: 'instant' // No animation for initial positioning
            })
          }
        }, 10) // Slightly longer delay to ensure proper rendering
      }
    }
  }, [isOpen, selectedValue])

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on the trigger button or inside the dropdown
      const isClickOnTrigger = containerRef.current && containerRef.current.contains(event.target)
      const isClickOnDropdown = event.target.closest('.mobile-time-picker-dropdown')
      
      if (!isClickOnTrigger && !isClickOnDropdown) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const generateOptions = () => {
    const options = []
    for (let i = minValue; i <= maxValue; i += step) {
      options.push(i)
    }
    return options
  }

  const formatDisplayValue = (val) => {
    // Handle undefined/null values
    if (val === undefined || val === null || isNaN(val)) {
      return '00'
    }
    
    const numVal = Number(val)
    
    if (format === '12h') {
      if (numVal === 0) return '12 AM'
      if (numVal === 12) return '12 PM'
      if (numVal > 12) return `${numVal - 12} PM`
      return `${numVal} AM`
    }
    return numVal.toString().padStart(2, '0')
  }

  const handleSelect = (newValue, event) => {
    event.stopPropagation()
    setSelectedValue(newValue)
    onChange(newValue)
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        })
      }
      setIsOpen(!isOpen)
    }
  }

  const options = generateOptions()

  return (
    <div className={`mobile-time-picker ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <div className="mobile-time-picker-trigger" onClick={handleToggle}>
        <span className="mobile-time-picker-value">
          {formatDisplayValue(selectedValue)}
        </span>
        <svg className="mobile-time-picker-arrow" width="12" height="12" viewBox="0 0 12 12">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {isOpen && createPortal(
        <div 
          className="mobile-time-picker-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 1000003
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-time-picker-options" ref={optionsRef}>
            {options.map((option) => (
              <div
                key={option}
                className={`mobile-time-picker-option ${selectedValue === option ? 'selected' : ''}`}
                onClick={(e) => handleSelect(option, e)}
              >
                {formatDisplayValue(option)}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default MobileTimePicker 