import { FaThList } from 'react-icons/fa'
import GlobalTimerIndicator from '../GlobalTimerIndicator'
import { useNotchDB } from '../../hooks/useNotchDB'
import './style.css'

function Header({ onAddClick, disabled = false, onTimerClick, onProfileClick }) {
  const { userProfile } = useNotchDB()
  
  // Generate user initials
  const getUserInitials = () => {
    if (!userProfile?.firstName) return '?'
    
    const firstInitial = userProfile.firstName.charAt(0).toUpperCase()
    const lastInitial = userProfile.lastName ? userProfile.lastName.charAt(0).toUpperCase() : ''
    
    return firstInitial + lastInitial
  }
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo-container">
          <FaThList size={20} className="header-logo-icon" />
        </div>
        <h1>Docket</h1>
      </div>
      <div className="header-right">
        <GlobalTimerIndicator onTimerClick={onTimerClick} />
        <button 
          className="profile-btn"
          onClick={onProfileClick}
          disabled={disabled}
          title={disabled ? "Initializing database..." : "Profile"}
          type="button"
        >
          {getUserInitials()}
        </button>
      </div>
    </header>
  )
}

export default Header 