import { useState, useEffect, useRef } from 'react'
import { FiClock, FiTag, FiFileText, FiPlus, FiCheck, FiX, FiChevronDown, FiCalendar, FiRepeat, FiEdit } from 'react-icons/fi'
import Modal from '../Modal'
import MobileTimePicker from '../MobileTimePicker'
import { useNotchDB } from '../../../hooks/useNotchDB'
import './style.css'

function CreateNotchModal({ isOpen, onClose, onCreateNotch, selectedDate }) {
  const [title, setTitle] = useState('')
  const [selectedNotchDate, setSelectedNotchDate] = useState(selectedDate)
  const [startHour, setStartHour] = useState(12)
  const [startMinute, setStartMinute] = useState(0)
  const [endHour, setEndHour] = useState(13)
  const [endMinute, setEndMinute] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [recurrenceDays, setRecurrenceDays] = useState([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ direction: 'down', maxHeight: 280 })
  
  const { categories, addCategory, getCategoryById, isCategoriesLoading: categoriesLoading } = useNotchDB()
  const dropdownRef = useRef(null)

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#F97316', '#06B6D4', '#EC4899'
  ]

  const daysOfWeek = [
    { short: 'Sun', full: 'Sunday', index: 0 },
    { short: 'Mon', full: 'Monday', index: 1 },
    { short: 'Tue', full: 'Tuesday', index: 2 },
    { short: 'Wed', full: 'Wednesday', index: 3 },
    { short: 'Thu', full: 'Thursday', index: 4 },
    { short: 'Fri', full: 'Friday', index: 5 },
    { short: 'Sat', full: 'Saturday', index: 6 }
  ]

  // Calculate optimal dropdown position
  const calculateDropdownPosition = () => {
    if (!dropdownRef.current) return

    const dropdown = dropdownRef.current
    const trigger = dropdown.querySelector('.dropdown-trigger')
    if (!trigger) return

    const triggerRect = trigger.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    
    // Estimate dropdown content height (categories + divider + add new option)
    const estimatedItemHeight = 48 // approximate height per option
    const estimatedHeight = Math.min(
      (categories.length + 2) * estimatedItemHeight + 60, // +2 for "No category" and "Create new", +60 for padding/margins
      280 // max height
    )

    let direction = 'down'
    let maxHeight = 280

    // If not enough space below but enough above, position upward
    if (spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
      direction = 'up'
      maxHeight = Math.min(spaceAbove - 20, 280) // 20px buffer
    } else if (spaceBelow < estimatedHeight) {
      // Not enough space in either direction, limit height to available space
      maxHeight = Math.max(spaceBelow - 20, 200) // minimum 200px height
    }

    setDropdownPosition({ direction, maxHeight })
  }

  // Set default times when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // Round current time to nearest 30-minute interval
      const totalMinutes = currentHour * 60 + currentMinute
      const roundedMinutes = Math.round(totalMinutes / 30) * 30
      const roundedHours = Math.floor(roundedMinutes / 60)
      const finalMinutes = roundedMinutes % 60
      
      setStartHour(roundedHours)
      setStartMinute(finalMinutes)
      
      // Set end time to 1 hour later
      const endTotalMinutes = roundedMinutes + 60
      const endHours = Math.floor(endTotalMinutes / 60)
      const endMinutes = endTotalMinutes % 60
      
      setEndHour(endHours)
      setEndMinute(endMinutes)
      
      setTitle('')
      setSelectedNotchDate(selectedDate)
      setSelectedCategory('')
      setNotes('')
      setRecurrenceDays([])
      setShowAddCategory(false)
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      setIsDropdownOpen(false)
      setIsAddingCategory(false)
    }
  }, [isOpen, selectedDate])

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen) {
      // Small delay to ensure DOM is updated
      setTimeout(calculateDropdownPosition, 0)
      
      // Recalculate on window resize
      const handleResize = () => calculateDropdownPosition()
      window.addEventListener('resize', handleResize)
      
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isDropdownOpen, categories.length])

  const handleStartHourChange = (hour) => {
    setStartHour(hour)
    
    // Auto-adjust end time if it's before start time
    const startTotalMinutes = hour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute
    
    if (startTotalMinutes >= endTotalMinutes) {
      const newEndTotalMinutes = startTotalMinutes + 60
      const newEndHour = Math.floor(newEndTotalMinutes / 60)
      const newEndMinute = newEndTotalMinutes % 60
      setEndHour(newEndHour)
      setEndMinute(newEndMinute)
    }
  }

  const handleStartMinuteChange = (minute) => {
    setStartMinute(minute)
    
    // Auto-adjust end time if it's before start time
    const startTotalMinutes = startHour * 60 + minute
    const endTotalMinutes = endHour * 60 + endMinute
    
    if (startTotalMinutes >= endTotalMinutes) {
      const newEndTotalMinutes = startTotalMinutes + 60
      const newEndHour = Math.floor(newEndTotalMinutes / 60)
      const newEndMinute = newEndTotalMinutes % 60
      setEndHour(newEndHour)
      setEndMinute(newEndMinute)
    }
  }

  const handleEndHourChange = (hour) => {
    setEndHour(hour)
  }

  const handleEndMinuteChange = (minute) => {
    setEndMinute(minute)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      console.error('Title is required')
      return
    }

    // Validate time order
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute
    
    if (startTotalMinutes >= endTotalMinutes) {
      console.error('End time must be after start time')
      alert('End time must be after start time')
      return
    }

    const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

    // Build comprehensive notch object with all fields
    const newNotch = {
      id: Date.now().toString(),
      title: title.trim(),
      date: selectedNotchDate.toISOString(), // This serves as start date for recurring notches
      startTime,
      endTime,
      category: selectedCategory || null,
      categoryName: selectedCategoryObj?.name || null,
      categoryColor: selectedCategoryObj?.color || null,
      notes: notes.trim() || null,
      recurrence: recurrenceDays.length > 0 ? {
        type: 'weekly',
        days: recurrenceDays.sort() // Ensure days are sorted
      } : null,
      // Status and timestamp fields will be set by the database layer
      status: 'upcoming', // Initial status, will be calculated by DB layer
      completed_at: null,
      started_at: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('Creating notch with complete data structure:', {
      ...newNotch,
      recurrenceInfo: newNotch.recurrence ? {
        type: newNotch.recurrence.type,
        daysCount: newNotch.recurrence.days.length,
        days: newNotch.recurrence.days,
        startDate: selectedNotchDate.toDateString()
      } : 'No recurrence'
    })

    // Validate that recurrence days are within valid range (0-6)
    if (newNotch.recurrence) {
      const invalidDays = newNotch.recurrence.days.filter(day => day < 0 || day > 6)
      if (invalidDays.length > 0) {
        console.error('Invalid recurrence days detected:', invalidDays)
        alert('Invalid recurrence days selected')
        return
      }
      
      console.log('Recurrence setup: Starting', selectedNotchDate.toDateString(), 
                  'recurring on:', newNotch.recurrence.days.map(d => 
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
                  ).join(', ')
      )
    }

    // Submit the notch
    try {
      onCreateNotch(newNotch)
      onClose()
    } catch (error) {
      console.error('Error creating notch:', error)
      alert('Failed to create task. Please try again.')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    
    if (categoriesLoading) {
      alert('Categories are still loading. Please wait a moment.')
      return
    }

    setIsAddingCategory(true)
    
    try {
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor
      })
      
      if (newCategory) {
        setShowAddCategory(false)
        setNewCategoryName('')
        setNewCategoryColor('#3B82F6')
        // Auto-select the newly created category
        setSelectedCategory(newCategory.id)
      }
    } catch (error) {
      console.error('Failed to add category:', error)
      alert(error.message || 'Failed to add category. Please try again.')
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleCancelAddCategory = () => {
    setShowAddCategory(false)
    setNewCategoryName('')
    setNewCategoryColor('#3B82F6')
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setIsDropdownOpen(false)
  }

  const selectedCategoryObj = getCategoryById(selectedCategory)

  // Calculate duration
  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute
  const durationHours = Math.max(0, (endTotalMinutes - startTotalMinutes) / 60)

  // Format date for input value (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value)
    setSelectedNotchDate(newDate)
  }

  const toggleRecurrenceDay = (dayIndex) => {
    setRecurrenceDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(day => day !== dayIndex)
      } else {
        return [...prev, dayIndex].sort()
      }
    })
  }

  // Format date for display
  const formatDateForDisplay = (date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const footerActions = (
    <div className="notch-actions">
      <button 
        type="button" 
        className="notch-btn-secondary" 
        onClick={onClose}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        form="notch-form"
        className="notch-btn-primary"
        disabled={!title.trim()}
      >
        Create Task
      </button>
    </div>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Create Task"
      subtitle="Schedule your next activity"
      footerActions={footerActions}
    >
      <form id="notch-form" onSubmit={handleSubmit} className="notch-form">
        {/* Title Field */}
        <div className="notch-field">
          <label className="notch-field-label" htmlFor="title">
            <FiEdit size={16} />
            Title
          </label>
          <input
            id="title"
            type="text"
            className="notch-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you planning?"
            required
            autoFocus
          />
        </div>

        {/* Day Field */}
        <div className="notch-field">
          <label className="notch-field-label" htmlFor="date">
            <FiCalendar size={16} />
            Day
          </label>
          <div className="notch-date-container">
            <input
              id="date"
              type="date"
              className="notch-date-input"
              value={formatDateForInput(selectedNotchDate)}
              onChange={handleDateChange}
            />
            <div className="notch-date-display">
              {formatDateForDisplay(selectedNotchDate)}
            </div>
          </div>
        </div>

        {/* Recurrence Field */}
        <div className="notch-field">
          <label className="notch-field-label">
            <FiRepeat size={16} />
            Repeats
          </label>
          <div className="days-selector">
            {daysOfWeek.map(day => (
              <button
                key={day.index}
                type="button"
                className={`day-button ${recurrenceDays.includes(day.index) ? 'selected' : ''}`}
                onClick={() => toggleRecurrenceDay(day.index)}
                title={day.full}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        {/* Time Section */}
        <div className="notch-field">
          <div className="notch-time-header">
            <span>
              <FiClock size={16} />
              Time
            </span>
            <span className="notch-duration">
              {durationHours > 0 ? `${durationHours.toFixed(1)}h` : '1h'}
            </span>
          </div>
          
          <div className="notch-time-card">
            <div className="notch-time-picker-container">
              {/* Start Time */}
              <div className="notch-time-picker-group">
                <label className="notch-time-picker-label">Start</label>
                <div className="notch-time-picker">
                  <MobileTimePicker
                    value={startHour}
                    onChange={handleStartHourChange}
                    minValue={1}
                    maxValue={24}
                    format="24h"
                  />
                  <div className="notch-time-separator">:</div>
                  <MobileTimePicker
                    value={startMinute}
                    onChange={handleStartMinuteChange}
                    minValue={0}
                    maxValue={30}
                    step={30}
                    format="24h"
                  />
                </div>
              </div>
              
              <div className="notch-time-to-separator">to</div>
              
              {/* End Time */}
              <div className="notch-time-picker-group">
                <label className="notch-time-picker-label">End</label>
                <div className="notch-time-picker">
                  <MobileTimePicker
                    value={endHour}
                    onChange={handleEndHourChange}
                    minValue={1}
                    maxValue={24}
                    format="24h"
                  />
                  <div className="notch-time-separator">:</div>
                  <MobileTimePicker
                    value={endMinute}
                    onChange={handleEndMinuteChange}
                    minValue={0}
                    maxValue={30}
                    step={30}
                    format="24h"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Field */}
        <div className="notch-field">
          <label className="notch-field-label" htmlFor="category">
            <FiTag size={16} />
            Category
          </label>
          
          <div className="category-container">
            <div className="custom-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen)
                  if (!isDropdownOpen) {
                    // Calculate position when opening
                    setTimeout(calculateDropdownPosition, 0)
                  }
                }}
                aria-expanded={isDropdownOpen}
                disabled={categoriesLoading}
              >
                <div className="dropdown-value">
                  {categoriesLoading ? (
                    <span className="placeholder">Loading categories...</span>
                  ) : selectedCategoryObj ? (
                    <>
                      <div 
                        className="category-color-dot" 
                        style={{ backgroundColor: selectedCategoryObj.color }}
                      />
                      <span>{selectedCategoryObj.name}</span>
                    </>
                  ) : (
                    <span className="placeholder">Select category</span>
                  )}
                </div>
                <FiChevronDown 
                  size={16} 
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {isDropdownOpen && !categoriesLoading && (
                <div 
                  className={`dropdown-menu dropdown-${dropdownPosition.direction}`}
                  style={{ maxHeight: `${dropdownPosition.maxHeight}px` }}
                >
                  <div 
                    className="dropdown-option"
                    onClick={() => handleCategorySelect('')}
                  >
                    <div className="category-color-dot no-category"></div>
                    <span>No category</span>
                  </div>
                  
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className={`dropdown-option ${selectedCategory === category.id ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div 
                        className="category-color-dot" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                      {category.isDefault && (
                        <span className="category-badge">Default</span>
                      )}
                    </div>
                  ))}
                  
                  <div className="dropdown-divider"></div>
                  
                  <div 
                    className="dropdown-option add-new-option"
                    onClick={() => {
                      setShowAddCategory(true)
                      setIsDropdownOpen(false)
                    }}
                  >
                    <div className="add-icon">
                      <FiPlus size={12} />
                    </div>
                    <span>Create new category</span>
                  </div>
                </div>
              )}
            </div>

            {showAddCategory && (
              <div className="new-category-card">
                <div className="new-category-header">
                  <h4>New Category</h4>
                  <button
                    type="button"
                    onClick={handleCancelAddCategory}
                    className="close-new-category"
                    disabled={isAddingCategory}
                  >
                    <FiX size={16} />
                  </button>
                </div>
                
                <div className="new-category-form">
                  <div className="name-color-row">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="category-name-input"
                      maxLength={20}
                      autoFocus
                    />
                    <div className="color-preview" style={{ backgroundColor: newCategoryColor }}>
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="hidden-color-input"
                      />
                    </div>
                  </div>
                  
                  <div className="color-palette">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`palette-color ${newCategoryColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryColor(color)}
                        title={`Select ${color}`}
                      />
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="create-category-btn"
                    disabled={!newCategoryName.trim() || isAddingCategory}
                  >
                    {isAddingCategory ? (
                      <>
                        <div className="spinner"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiCheck size={14} />
                        Create Category
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Field */}
        <div className="notch-field">
          <label className="notch-field-label" htmlFor="notes">
            <FiFileText size={16} />
            Notes
          </label>
          <textarea
            id="notes"
            className="notch-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details..."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  )
}

export default CreateNotchModal 