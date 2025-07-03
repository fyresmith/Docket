import { IoCalendarOutline } from 'react-icons/io5'
import { FaThList } from 'react-icons/fa'
import { FiBook } from 'react-icons/fi'
import './style.css'

function BottomNavigation({ 
  currentView = 'docket', 
  onDocketClick,
  onCalendarClick, 
  onLibraryClick, 
  disabled = false 
}) {
  return (
    <div className="bottom-navigation">
      <button 
        className={`bottom-nav-btn ${currentView === 'docket' ? 'active' : ''}`}
        onClick={onDocketClick}
        disabled={disabled}
        type="button"
      >
        <FaThList size={20} />
        <span>Docket</span>
      </button>
      
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
        className={`bottom-nav-btn ${currentView === 'library' ? 'active' : ''}`}
        onClick={onLibraryClick}
        disabled={disabled}
        type="button"
      >
        <FiBook size={20} />
        <span>Library</span>
      </button>
    </div>
  )
}

export default BottomNavigation 