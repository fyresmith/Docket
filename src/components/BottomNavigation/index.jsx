import { IoCalendarOutline } from 'react-icons/io5'
import { FaThList } from 'react-icons/fa'
import { FiPlus, FiUser } from 'react-icons/fi'
import './style.css'

function BottomNavigation({ 
  currentView = 'calendar', 
  onCalendarClick, 
  onTimerClick, 
  onAddClick, 
  // onProfileClick, // Temporarily commented out
  disabled = false 
}) {
  return (
    <div className="bottom-navigation">
      <button 
        className={`bottom-nav-btn ${currentView === 'calendar' ? 'active' : ''}`}
        onClick={onCalendarClick}
        disabled={disabled}
        type="button"
      >
        <IoCalendarOutline size={20} />
        <span>Calendar</span>
      </button>
      
      <button 
        className={`bottom-nav-btn ${currentView === 'timer' ? 'active' : ''}`}
        onClick={onTimerClick}
        disabled={disabled}
        type="button"
      >
        <FaThList size={20} />
        <span>Docket</span>
      </button>
      
      <button 
        className="bottom-nav-btn"
        onClick={onAddClick}
        disabled={disabled}
        title={disabled ? "Initializing database..." : "Create an Entry"}
        type="button"
      >
        <FiPlus size={20} />
        <span>Create</span>
      </button>
      
      {/* Temporarily commented out - Profile access through header PFP instead */}
      {/* <button 
        className={`bottom-nav-btn ${currentView === 'profileView' ? 'active' : ''}`}
        onClick={onProfileClick}
        disabled={disabled}
        title={disabled ? "Initializing database..." : "Profile"}
        type="button"
      >
        <FiUser size={20} />
        <span>Profile</span>
      </button> */}
    </div>
  )
}

export default BottomNavigation 