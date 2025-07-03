import { useState, useRef, useEffect } from 'react'
import './style.css'

function TimePicker({ value, onChange, maxValue, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const containerRef = useRef(null)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (newValue) => {
    setSelectedValue(newValue)
    onChange(newValue)
    setIsOpen(false)
  }

  const generateOptions = () => {
    const options = []
    for (let i = 0; i <= maxValue; i++) {
      options.push(i)
    }
    return options
  }

  return (
    <div className="time-picker-column" ref={containerRef}>
      <div className="time-picker-header">{label}</div>
      <div className="time-picker-wheel">
        <div className="time-picker-items">
          {generateOptions().map((option) => (
            <div
              key={option}
              className={`time-picker-item ${selectedValue === option ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TimePicker 