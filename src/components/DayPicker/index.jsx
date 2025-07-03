import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import './style.css'

function DayPicker({ selectedDate, onDateChange }) {
  const [days, setDays] = useState([])
  const scrollRef = useRef(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastGeneratedDate, setLastGeneratedDate] = useState(null)

  useEffect(() => {
    generateDays()
  }, [])

  const generateDays = () => {
    const today = new Date()
    const daysArray = []
    
    // Generate 30 days (15 before today, today, 14 after)
    for (let i = -15; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      daysArray.push(date)
    }
    
    setDays(daysArray)
    setLastGeneratedDate(daysArray[daysArray.length - 1]) // Store the last generated date
  }



  const addMoreFutureDays = () => {
    if (!lastGeneratedDate) return

    const newDays = []
    const startDate = new Date(lastGeneratedDate)
    startDate.setDate(startDate.getDate() + 1) // Start from the day after the last generated date
    
    // Add 30 more days
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      newDays.push(date)
    }
    
    setDays(prevDays => [...prevDays, ...newDays])
    setLastGeneratedDate(newDays[newDays.length - 1])
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth
    
    // If we're scrolling towards the end (future dates) and we're close to running out
    if (scrollPercentage > 0.8) {
      addMoreFutureDays()
    }
  }

  const scrollToDay = (targetDate, forceInstant = false) => {
    if (scrollRef.current) {
      const targetIndex = days.findIndex(day => {
        return day.toDateString() === targetDate.toDateString()
      })
      if (targetIndex !== -1) {
        const dayElement = scrollRef.current.children[targetIndex]
        if (dayElement) {
          // Use the same scrollIntoView method for both instant and smooth
          // Just control the behavior temporarily
          const originalBehavior = scrollRef.current.style.scrollBehavior
          
          if (forceInstant) {
            // Temporarily disable smooth scrolling for instant positioning
            scrollRef.current.style.scrollBehavior = 'auto'
          }
          
          // Use the same positioning logic for both cases
          dayElement.scrollIntoView({
            behavior: forceInstant ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'center'
          })
          
          if (forceInstant) {
            // Restore original behavior immediately
            scrollRef.current.style.scrollBehavior = originalBehavior
          }
        }
      }
    }
  }

  // Initialize scroll position when days are available
  useLayoutEffect(() => {
    if (days.length > 0 && !isInitialized) {
      // Use instant positioning only on initial mount
      const targetDate = selectedDate || new Date()
      scrollToDay(targetDate, true) // forceInstant = true
      setIsInitialized(true)
    }
  }, [days, isInitialized, selectedDate])

  // Scroll to selected day when it changes (but not on initial load)
  useEffect(() => {
    if (isInitialized && selectedDate) {
      scrollToDay(selectedDate, false) // Smooth animation for date changes
    }
  }, [selectedDate, isInitialized])

  const formatDay = (date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const isSelected = date.toDateString() === selectedDate.toDateString()
    
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday,
      isSelected
    }
  }

  const handleDayClick = (date) => {
    onDateChange(date)
    // Center the clicked day with smooth animation
    scrollToDay(date, false) // Smooth animation for user clicks
  }

  return (
    <div className="day-picker">
      <div 
        className="days-container" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {days.map((date, index) => {
          const dayInfo = formatDay(date)
          return (
            <button
              key={index}
              className={`day-item ${dayInfo.isToday ? 'today' : ''} ${dayInfo.isSelected ? 'selected' : ''}`}
              onClick={() => handleDayClick(date)}
              type="button"
            >
              <span className="day-number">{dayInfo.day}</span>
              <span className="day-weekday">{dayInfo.weekday}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DayPicker 