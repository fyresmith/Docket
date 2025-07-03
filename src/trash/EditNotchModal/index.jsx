import { useState, useEffect, useRef } from 'react'
import { FiClock, FiTag, FiFileText, FiPlus, FiCheck, FiX, FiChevronDown, FiCalendar, FiRepeat, FiEdit, FiSave, FiTrash2 } from 'react-icons/fi'
import Modal from '../common/Modal'
import MobileTimePicker from '../MobileTimePicker'
import { useNotchDB } from '../../hooks/useNotchDB'
import '../CreateNotchModal/style.css'

function EditNotchModal({ isOpen, onClose, onUpdateNotch, onDeleteNotch, notch }) {
  const [title, setTitle] = useState('')
  const [selectedNotchDate, setSelectedNotchDate] = useState(new Date())
  // Ensure we always have valid number defaults
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
    
    const estimatedItemHeight = 48
    const estimatedHeight = Math.min(
      (categories.length + 2) * estimatedItemHeight + 60,
      280
    )

    let direction = 'down'
    let maxHeight = 280

    if (spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
      direction = 'up'
      maxHeight = Math.min(spaceAbove - 20, 280)
    } else if (spaceBelow < estimatedHeight) {
      maxHeight = Math.max(spaceBelow - 20, 200)
    }

    setDropdownPosition({ direction, maxHeight })
  }

  // Pre-fill form fields when modal opens with notch data
  useEffect(() => {
    if (isOpen && notch) {
      // Parse start and end times with fallbacks
      let startH = 12, startM = 0, endH = 13, endM = 0
      
      try {
        if (notch.startTime && typeof notch.startTime === 'string') {
          const [parsedStartH, parsedStartM] = notch.startTime.split(':').map(Number)
          if (!isNaN(parsedStartH) && !isNaN(parsedStartM)) {
            startH = parsedStartH
            startM = parsedStartM
          }
        }
        
        if (notch.endTime && typeof notch.endTime === 'string') {
          const [parsedEndH, parsedEndM] = notch.endTime.split(':').map(Number)
          if (!isNaN(parsedEndH) && !isNaN(parsedEndM)) {
            endH = parsedEndH
            endM = parsedEndM
          }
        }
      } catch (error) {
        console.warn('Error parsing notch times, using defaults:', error)
      }
      
      setTitle(notch.title || '')
      setSelectedNotchDate(notch.date ? new Date(notch.date) : new Date())
      setStartHour(startH)
      setStartMinute(startM)
      setEndHour(endH)
      setEndMinute(endM)
      setSelectedCategory(notch.category || '')
      setNotes(notch.notes || '')
      setRecurrenceDays(notch.recurrence?.days || [])
      
      // Reset UI state
      setShowAddCategory(false)
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      setIsDropdownOpen(false)
      setIsAddingCategory(false)
    }
  }, [isOpen, notch])

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
      setTimeout(calculateDropdownPosition, 0)
      
      const handleResize = () => calculateDropdownPosition()
      window.addEventListener('resize', handleResize)
      
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isDropdownOpen, categories.length])

  const handleStartHourChange = (hour) => {
    setStartHour(hour)
    
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

    // Ensure time values are valid numbers before validation
    const safeStartHour = typeof startHour === 'number' && !isNaN(startHour) ? startHour : 12
    const safeStartMinute = typeof startMinute === 'number' && !isNaN(startMinute) ? startMinute : 0
    const safeEndHour = typeof endHour === 'number' && !isNaN(endHour) ? endHour : 13
    const safeEndMinute = typeof endMinute === 'number' && !isNaN(endMinute) ? endMinute : 0

    // Validate time order
    const startTotalMinutes = safeStartHour * 60 + safeStartMinute
    const endTotalMinutes = safeEndHour * 60 + safeEndMinute
    
    if (startTotalMinutes >= endTotalMinutes) {
      console.error('End time must be after start time')
      alert('End time must be after start time')
      return
    }
    
    const startTime = `${safeStartHour.toString().padStart(2, '0')}:${safeStartMinute.toString().padStart(2, '0')}`
    const endTime = `${safeEndHour.toString().padStart(2, '0')}:${safeEndMinute.toString().padStart(2, '0')}`

    // Build updated notch object preserving original data
    const updatedNotch = {
      ...notch, // Preserve original data including ID and createdAt
      title: title.trim(),
      date: selectedNotchDate.toISOString(),
      startTime,
      endTime,
      category: selectedCategory || null,
      categoryName: selectedCategoryObj?.name || null,
      categoryColor: selectedCategoryObj?.color || null,
      notes: notes.trim() || null,
      recurrence: recurrenceDays.length > 0 ? {
        type: 'weekly',
        days: recurrenceDays.sort()
      } : null,
      updatedAt: new Date().toISOString()
    }

    console.log('Updating notch with data:', updatedNotch)

    // Validate recurrence days
    if (updatedNotch.recurrence) {
      const invalidDays = updatedNotch.recurrence.days.filter(day => day < 0 || day > 6)
      if (invalidDays.length > 0) {
        console.error('Invalid recurrence days detected:', invalidDays)
        alert('Invalid recurrence days selected')
        return
      }
    }

    // Submit the updated notch
    try {
      onUpdateNotch(updatedNotch)
      onClose()
    } catch (error) {
      console.error('Error updating notch:', error)
      alert('Failed to update task. Please try again.')
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

  // Calculate duration with safety checks
  const safeStartHour = typeof startHour === 'number' && !isNaN(startHour) ? startHour : 12
  const safeStartMinute = typeof startMinute === 'number' && !isNaN(startMinute) ? startMinute : 0
  const safeEndHour = typeof endHour === 'number' && !isNaN(endHour) ? endHour : 13
  const safeEndMinute = typeof endMinute === 'number' && !isNaN(endMinute) ? endMinute : 0
  
  const startTotalMinutes = safeStartHour * 60 + safeStartMinute
  const endTotalMinutes = safeEndHour * 60 + safeEndMinute
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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      onDeleteNotch(notch.id)
      onClose()
    }
  }

  const footerActions = (
    <div className="notch-actions three-button-layout">
      <button 
        type="button" 
        className="notch-btn-secondary" 
        onClick={onClose}
      >
        Cancel
      </button>
      <button 
        type="button" 
        className="notch-btn-danger" 
        onClick={handleDelete}
      >
        <FiTrash2 size={16} />
        Delete
      </button>
      <button 
        type="submit" 
        form="notch-form"
        className="notch-btn-primary"
        disabled={!title.trim()}
      >
        <FiSave size={16} />
        Save
      </button>
    </div>
  )

  if (!notch) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Edit Task"
      subtitle="Update your activity details"
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
          <div className="notch-time-header">
            <span>
              <FiRepeat size={16} />
              Repeat
            </span>
            {recurrenceDays.length > 0 && (
              <span className="notch-duration">
                {recurrenceDays.length} day{recurrenceDays.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="days-selector">
            {daysOfWeek.map((day) => (
              <button
                key={day.index}
                type="button"
                className={`day-button ${recurrenceDays.includes(day.index) ? 'selected' : ''}`}
                onClick={() => toggleRecurrenceDay(day.index)}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        {/* Time Field */}
        <div className="notch-field">
          <div className="notch-time-header">
            <span>
              <FiClock size={16} />
              Time
            </span>
            <span className="notch-duration">
              {durationHours.toFixed(1)}h
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

export default EditNotchModal 