import { FiClock, FiTag, FiCalendar } from 'react-icons/fi'
import { useEffect, useRef, useState } from 'react'
import { useNotchDB } from '../../../../hooks/useNotchDB'
import NotchOverflowModal from '../../../common/NotchOverflowModal'
import './style.css'

function TaskTimeline({ date, tasks, onNotchClick }) {
  const timelineRef = useRef(null)
  const { getCategoryById } = useNotchDB()
  const [isOverflowModalOpen, setIsOverflowModalOpen] = useState(false)
  const [overflowNotches, setOverflowNotches] = useState([])
  const timeSlots = []
  
  // Generate 24-hour timeline with 30-minute intervals
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push({ hour, minute: 0 })
    timeSlots.push({ hour, minute: 30 })
  }

  const formatTime = (hour, minute = 0) => {
    const time = new Date()
    time.setHours(hour, minute, 0, 0)
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const isCurrentTimeSlot = (hour, minute = 0) => {
    const now = new Date()
    const isToday = now.toDateString() === date.toDateString()
    
    if (!isToday) return false
    
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Check if current time falls within this 30-minute slot
    const slotStart = hour * 60 + minute
    const slotEnd = slotStart + 30
    const currentTotalMinutes = currentHour * 60 + currentMinute
    
    return currentTotalMinutes >= slotStart && currentTotalMinutes < slotEnd
  }

  const getNotchColor = (notch) => {
    // Use the stored categoryColor first
    if (notch.categoryColor) {
      return notch.categoryColor
    }
    
    // Fallback to category from database if category ID is available
    if (notch.category) {
      const categoryFromDB = getCategoryById(notch.category)
      if (categoryFromDB?.color) {
        return categoryFromDB.color
      }
    }
    
    // Final fallback to default blue
    return '#007AFF'
  }

  // Calculate position and height for each notch
  const getNotchPosition = (notch) => {
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    // Calculate position from top (each 30-minute slot is 25px)
    const topPosition = (startMinutes / 30) * 25
    
    // Calculate height
    const durationMinutes = endMinutes - startMinutes
    const height = (durationMinutes / 30) * 25
    
    return { top: topPosition, height }
  }

  // Check if two notches overlap in time
  const notchesOverlap = (notch1, notch2) => {
    const [start1Hour, start1Min] = notch1.startTime.split(':').map(Number)
    const [end1Hour, end1Min] = notch1.endTime.split(':').map(Number)
    const [start2Hour, start2Min] = notch2.startTime.split(':').map(Number)
    const [end2Hour, end2Min] = notch2.endTime.split(':').map(Number)
    
    const start1Minutes = start1Hour * 60 + start1Min
    const end1Minutes = end1Hour * 60 + end1Min
    const start2Minutes = start2Hour * 60 + start2Min
    const end2Minutes = end2Hour * 60 + end2Min
    
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes
  }

  // Smart stacking algorithm - assigns each notch to leftmost available column
  const getSmartStackedNotches = () => {
    // Sort notches by start time for optimal packing
    const sortedNotches = [...tasks].sort((a, b) => {
      const [aHour, aMin] = a.startTime.split(':').map(Number)
      const [bHour, bMin] = b.startTime.split(':').map(Number)
      const aMinutes = aHour * 60 + aMin
      const bMinutes = bHour * 60 + bMin
      return aMinutes - bMinutes
    })

    const columns = [] // Each column contains array of notches
    const notchPositions = new Map() // notch.id -> { column, position }

    sortedNotches.forEach((notch) => {
      let assignedColumn = -1
      
      // Find the leftmost column where this notch doesn't overlap with any existing notch
      for (let col = 0; col < columns.length; col++) {
        const hasOverlap = columns[col].some(existingNotch => notchesOverlap(notch, existingNotch))
        if (!hasOverlap) {
          assignedColumn = col
          break
        }
      }
      
      // If no suitable column found, create a new one
      if (assignedColumn === -1) {
        assignedColumn = columns.length
        columns.push([])
      }
      
      // Add notch to the assigned column
      columns[assignedColumn].push(notch)
      notchPositions.set(notch.id, {
        column: assignedColumn,
        position: columns[assignedColumn].length - 1,
        totalColumns: 0 // Will be set after all notches are processed
      })
    })

    // Update totalColumns for all notches
    const maxColumns = columns.length
    notchPositions.forEach((pos) => {
      pos.totalColumns = maxColumns
    })

    return { columns, notchPositions, maxColumns }
  }

  // Calculate horizontal positioning for smart stacked notches
  const getSmartStackedPosition = (notch, notchPositions) => {
    const basePosition = getNotchPosition(notch)
    const positionInfo = notchPositions.get(notch.id)
    
    if (!positionInfo) return basePosition
    
    const { column, totalColumns } = positionInfo
    
    // Check if this notch actually overlaps with any other notches
    const hasAnyOverlap = tasks.some(otherNotch => 
      otherNotch.id !== notch.id && notchesOverlap(notch, otherNotch)
    )
    
    // If no overlaps, give it full width
    if (!hasAnyOverlap) {
      return {
        ...basePosition,
        left: '0%',
        width: '100%',
        zIndex: 2
      }
    }
    
    // Find all notches that overlap with this one to determine actual column usage at this time
    const overlappingNotches = tasks.filter(otherNotch => 
      otherNotch.id === notch.id || notchesOverlap(notch, otherNotch)
    )
    
    // Check if THIS specific notch overlaps with any overflow notches (need to calculate this first)
    const globalHasOverflow = totalColumns > 4
    const overflowNotches = globalHasOverflow ? 
      Array.from({ length: Math.max(0, totalColumns - 4) }, (_, i) => i + 4)
        .map(col => tasks.filter(task => {
          const pos = notchPositions.get(task.id)
          return pos && pos.column === col
        }))
        .flat() : []
    
    const hasOverflowAtThisTime = overflowNotches.some(overflowNotch => 
      notchesOverlap(notch, overflowNotch)
    )
    
    const maxVisibleNotches = hasOverflowAtThisTime ? 3 : 4 // Reserve 4th column only if overflow affects this time period
    
    // If there are more than 4 columns total, we'll need overflow handling
    if (column >= maxVisibleNotches) {
      return null // Will be handled by overflow indicator
    }
    
    // Get the columns actually used by overlapping visible notches at this time period
    const usedColumns = new Set()
    overlappingNotches.forEach(overlapNotch => {
      const overlapPos = notchPositions.get(overlapNotch.id)
      if (overlapPos && overlapPos.column < maxVisibleNotches) {
        usedColumns.add(overlapPos.column)
      }
    })
    
    // Determine expansion strategy for overflow scenarios
    const maxUsedColumn = Math.max(...Array.from(usedColumns))
    let columnsToSpan = 1
    
    if (usedColumns.size === 1) {
      // If this is the only notch at this time, expand to fill available space  
      columnsToSpan = hasOverflowAtThisTime ? 3 : 4
    } else if (hasOverflowAtThisTime && column === maxUsedColumn) {
      // With overflow, only expand the rightmost notch to fill remaining space
      columnsToSpan = Math.max(1, 3 - column)
    }
    
        // Calculate width and left position for horizontal positioning
    const gapPercent = 0.5 // Small gap between notches
    const totalAvailableColumns = hasOverflowAtThisTime ? 3 : 4 // Available columns for notches
    
    // Calculate position and width based on equal distribution
    if (!hasOverflowAtThisTime && usedColumns.size > 1) {
      // Equal distribution among all notches
      const notchWidth = (100 - (gapPercent * (usedColumns.size - 1))) / usedColumns.size
      const leftPercent = (notchWidth + gapPercent) * column
      
      return {
        ...basePosition,
        left: `${leftPercent}%`,
        width: `${notchWidth}%`,
        zIndex: 2 + column,
        column,
        totalColumns: usedColumns.size,
        columnsToSpan: 1
      }
    } else {
      // For single notches or overflow scenarios, use original logic
      const displayColumns = hasOverflowAtThisTime ? 4 : Math.max(usedColumns.size, 1)
      const baseColumnWidth = (100 - (gapPercent * (displayColumns - 1))) / displayColumns
      const finalWidth = columnsToSpan === 1 ? baseColumnWidth : 
        (baseColumnWidth * columnsToSpan) + (gapPercent * (columnsToSpan - 1))
      const leftPercent = (baseColumnWidth + gapPercent) * column
      
      return {
        ...basePosition,
        left: `${leftPercent}%`,
        width: `${finalWidth}%`,
        zIndex: 2 + column,
        column,
        totalColumns: displayColumns,
        columnsToSpan
      }
    }
  }

  // Create overflow indicator for smart stacked notches
  const getSmartStackedOverflow = (columns) => {
    if (columns.length <= 4) return null // No overflow needed if 4 or fewer columns
    
    // Get all notches from overflow columns (3+ when there's overflow, since 4th column is reserved for overflow indicator)
    const overflowNotches = columns.slice(3).flat()
    if (overflowNotches.length === 0) return null
    
    // Find the time range that covers all overflow notches
    let minStart = Infinity
    let maxEnd = 0
    overflowNotches.forEach((notch) => {
      const [startHour, startMin] = notch.startTime.split(':').map(Number)
      const [endHour, endMin] = notch.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      minStart = Math.min(minStart, startMinutes)
      maxEnd = Math.max(maxEnd, endMinutes)
    })
    
    const overflowHeight = ((maxEnd - minStart) / 30) * 25
    const overflowTop = (minStart / 30) * 25
    
    // Position as the 4th column (index 3) using same width calculation as regular notches
    const gapPercent = 0.5
    const availableWidth = (100 - (gapPercent * (4 - 1))) / 4 // 4 columns total
    const leftPercent = (availableWidth + gapPercent) * 3 // Column index 3
    
    return {
      top: overflowTop,
      height: overflowHeight,
      left: `${leftPercent}%`,
      width: `${availableWidth}%`,
      count: overflowNotches.length,
      notches: overflowNotches
    }
  }

  const { columns, notchPositions, maxColumns } = getSmartStackedNotches()
  const smartOverflowIndicator = getSmartStackedOverflow(columns)

  // Handle overflow indicator click
  const handleOverflowClick = () => {
    if (smartOverflowIndicator) {
      setOverflowNotches(smartOverflowIndicator.notches)
      setIsOverflowModalOpen(true)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsOverflowModalOpen(false)
    setOverflowNotches([])
  }

  // Auto-scroll to current time (only for today)
  useEffect(() => {
    const scrollToCurrentTime = () => {
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      
      if (timelineRef.current && isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        
        // Position calculation: each 30-minute slot is 25px high
        // Show current time close to top for maximum forward visibility
        const slotHeight = 25
        const contextOffset = 50 // Minimal offset - just show 1 hour above current time
        const scrollPosition = (currentMinutes / 30) * slotHeight - contextOffset
        
        // Ensure we don't scroll beyond the container bounds
        const maxScroll = timelineRef.current.scrollHeight - timelineRef.current.clientHeight
        const targetScroll = Math.max(0, Math.min(scrollPosition, maxScroll))
        
        console.log('Auto-scrolling to current time:', {
          currentTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          scrollPosition: targetScroll,
          isToday
        })
        
        timelineRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
      }
    }

    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToCurrentTime, 100)
    return () => clearTimeout(timeoutId)
  }, [date, tasks.length]) // Trigger on date changes and when tasks are loaded

  return (
    <div className="notch-timeline">
      {tasks.length === 0 && (
        <div className="empty-state">
          <FiClock size={32} />
          <p>No Notches scheduled</p>
          <span>Tap the + button to add your first Notch</span>
        </div>
      )}
      
      <div className={`timeline-container ${tasks.length === 0 ? 'empty' : ''}`} ref={timelineRef}>
        <div className="timeline-grid">
          {/* Time labels column */}
          <div className="time-labels">
            {timeSlots.map(({ hour, minute }, index) => {
              const isCurrent = isCurrentTimeSlot(hour, minute)
              const isHalfHour = minute === 30
              
              return (
                <div 
                  key={`time-${hour}-${minute}`} 
                  className={`time-label ${isCurrent ? 'current' : ''} ${isHalfHour ? 'half-hour' : ''}`}
                >
                  <span className="time-text">{formatTime(hour, minute)}</span>
                  {isCurrent && <div className="current-indicator" />}
                </div>
              )
            })}
          </div>
          
          {/* Events column */}
          <div className="events-column">
            {/* Time grid lines */}
            <div className="time-grid">
              {timeSlots.map(({ hour, minute }, index) => {
                const isCurrent = isCurrentTimeSlot(hour, minute)
                const isHalfHour = minute === 30
                
                return (
                  <div 
                    key={`grid-${hour}-${minute}`} 
                    className={`grid-line ${isCurrent ? 'current' : ''} ${isHalfHour ? 'half-hour' : ''}`}
                  />
                )
              })}
            </div>
            
            {/* Events positioned absolutely */}
            <div className="events-layer">
              {/* Render notches with smart stacking positioning */}
              {tasks.map((notch) => {
                const positionData = getSmartStackedPosition(notch, notchPositions)
                
                if (!positionData) return null // Skip overflow notches
                
                return (
                  <div 
                    key={notch.id}
                    className="notch-item"
                    style={{
                      position: 'absolute',
                      top: `${positionData.top}px`,
                      height: `${positionData.height}px`,
                      left: positionData.left,
                      width: positionData.width,
                      zIndex: positionData.zIndex,
                      borderLeftColor: getNotchColor(notch),
                      backgroundColor: `${getNotchColor(notch)}15`
                    }}
                    onClick={() => onNotchClick(notch)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onNotchClick(notch)
                      }
                    }}
                  >
                    <div className="notch-content">
                      <div className="notch-title">{notch.title}</div>
                      {(notch.categoryName || notch.category) && (
                        <div className="notch-category">
                          <FiTag size={12} />
                          {notch.categoryName || notch.category}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }).filter(Boolean)}
              
              {/* Render overflow indicator */}
              {smartOverflowIndicator && (
                <div
                  key="smart-overflow"
                  className="notch-overflow-indicator"
                  style={{
                    position: 'absolute',
                    top: `${smartOverflowIndicator.top}px`,
                    height: `${smartOverflowIndicator.height}px`,
                    left: smartOverflowIndicator.left,
                    width: smartOverflowIndicator.width,
                    zIndex: 10
                  }}
                  onClick={handleOverflowClick}
                  role="button"
                  tabIndex={0}
                  title={`${smartOverflowIndicator.count} more notch${smartOverflowIndicator.count > 1 ? 'es' : ''}`}
                >
                  <div className="overflow-content">
                    <span className="overflow-text">+{smartOverflowIndicator.count}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <NotchOverflowModal
        isOpen={isOverflowModalOpen}
        onClose={handleModalClose}
        overflowNotches={overflowNotches}
        onNotchClick={onNotchClick}
      />
    </div>
  )
}

export default TaskTimeline 