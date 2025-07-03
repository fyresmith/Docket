import { useState } from 'react'
import DayPicker from './DayPicker'
import TaskTimeline from './TaskTimeline'
import EmptyDayState from './EmptyDayState'
import { useNotchDB } from '../../../hooks/useNotchDB'
import './style.css'

function CalendarView({ 
  selectedDate,
  onDateChange,
  onNotchClick, 
  onAddNotch, 
  disabled = false
}) {
  const { getNotchesByDate } = useNotchDB()

  // Get notches for the selected date
  const selectedDateNotches = getNotchesByDate(selectedDate)
  const hasNotches = selectedDateNotches.length > 0

  return (
    <div className="calendar-view">
      {/* Day Picker */}
      <div className="calendar-header">
        <DayPicker 
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {hasNotches ? (
          <TaskTimeline 
            date={selectedDate}
            tasks={selectedDateNotches}
            onNotchClick={onNotchClick}
          />
        ) : (
          <EmptyDayState 
            date={selectedDate}
            onAddNotch={onAddNotch}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  )
}

export default CalendarView 