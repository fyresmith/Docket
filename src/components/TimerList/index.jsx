import { FiClock } from 'react-icons/fi'
import SearchBar from '../SearchBar'
import TimerCard from '../TimerCard'
import './style.css'

function TimerList({ 
  timers, 
  searchQuery, 
  onSearchChange, 
  runningTimers, 
  onStart, 
  onStop, 
  onReset, 
  onTimerSelect 
}) {
  const filteredTimers = timers.filter(timer =>
    timer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    timer.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="timer-list">
      <SearchBar 
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      
      <div className="timers-grid">
        {filteredTimers.map(timer => (
          <TimerCard
            key={timer.id}
            timer={timer}
            isRunning={runningTimers.has(timer.id)}
            onStart={onStart}
            onStop={onStop}
            onReset={onReset}
            onClick={onTimerSelect}
          />
        ))}
      </div>
      
      {filteredTimers.length === 0 && (
        <div className="empty-state">
          <FiClock size={48} />
          <h3>No Notches found</h3>
          <p>Create your first Notch to get started</p>
        </div>
      )}
    </div>
  )
}

export default TimerList 