import { useState, useEffect } from 'react'
import { FiArrowLeft, FiUser, FiSettings, FiMoon, FiSun, FiBell, FiDatabase, FiDownload, FiTrash2, FiEdit, FiCheck, FiX, FiClock, FiCalendar } from 'react-icons/fi'
import { useNotchDB } from '../../../hooks/useNotchDB'
import './style.css'

function ProfileView({ onBack }) {
  const { 
    userProfile, 
    updateUserProfile, 
    notches, 
    categories,
    timers 
  } = useNotchDB()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  const [appTheme, setAppTheme] = useState(localStorage.getItem('app-theme') || 'dark')
  const [notifications, setNotifications] = useState('default')

  // Initialize edited profile when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setEditedProfile({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        workHours: userProfile.workHours || '9:00-17:00',
        workDays: userProfile.workDays || [1, 2, 3, 4, 5]
      })
    }
  }, [userProfile])

  // Check notification permission status
  useEffect(() => {
    if ('Notification' in window) {
      setNotifications(Notification.permission)
    }
  }, [])

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editedProfile)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    if (userProfile) {
      setEditedProfile({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        workHours: userProfile.workHours || '9:00-17:00',
        workDays: userProfile.workDays || [1, 2, 3, 4, 5]
      })
    }
    setIsEditing(false)
  }

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleWorkDayToggle = (dayIndex) => {
    setEditedProfile(prev => ({
      ...prev,
      workDays: prev.workDays?.includes(dayIndex)
        ? prev.workDays.filter(d => d !== dayIndex)
        : [...(prev.workDays || []), dayIndex]
    }))
  }

  const handleThemeChange = (theme) => {
    setAppTheme(theme)
    localStorage.setItem('app-theme', theme)
    // Apply theme to document root immediately
    document.documentElement.setAttribute('data-theme', theme)
    
    // Optional: Show a brief visual confirmation
    console.log(`Theme switched to: ${theme}`)
  }

  const handleRequestNotifications = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        setNotifications(permission)
        if (permission === 'granted') {
          new Notification('Notifications enabled! 🎯', {
            body: 'You\'ll now receive timer and task reminders.',
            icon: '/favicon.ico'
          })
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }

  const exportData = () => {
    const data = {
      profile: userProfile,
      notches: notches,
      categories: categories,
      timers: timers,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `docket-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      if (window.confirm('This will delete all your tasks, timers, and profile data. Are you absolutely sure?')) {
        // Clear IndexedDB
        indexedDB.deleteDatabase('DocketApp')
        // Clear localStorage
        localStorage.clear()
        // Reload page
        window.location.reload()
      }
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const getUserInitials = () => {
    if (!userProfile?.firstName) return '?'
    const firstInitial = userProfile.firstName.charAt(0).toUpperCase()
    const lastInitial = userProfile.lastName ? userProfile.lastName.charAt(0).toUpperCase() : ''
    return firstInitial + lastInitial
  }

  // Calculate statistics
  const totalNotches = notches.length
  const completedNotches = notches.filter(n => n.completed_at).length
  const totalCategories = categories.length

  return (
    <div className="profile-view">
      {/* Header */}
      <div className="profile-view-header">
        <button 
          className="profile-back-btn"
          onClick={onBack}
        >
          <FiArrowLeft size={20} />
        </button>
        
        <div className="profile-header-content">
          <h1 className="profile-view-title">Profile & Settings</h1>
          <p className="profile-view-subtitle">Manage your account and preferences</p>
        </div>
        
        <div className="profile-header-spacer" />
      </div>

      {/* Content */}
      <div className="profile-view-content">
        <div className="profile-sections">
          
          {/* Profile Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <FiUser size={20} />
              </div>
              <div className="profile-section-title">
                <h2>Profile Information</h2>
                <p>Your personal details and work preferences</p>
              </div>
              {!isEditing && (
                <button 
                  className="profile-edit-btn"
                  onClick={handleEditProfile}
                >
                  <FiEdit size={16} />
                </button>
              )}
            </div>

            <div className="profile-card">
              <div className="profile-avatar">
                {getUserInitials()}
              </div>
              
              <div className="profile-details">
                {isEditing ? (
                  <div className="profile-edit-form">
                    <div className="profile-input-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={editedProfile.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="profile-input"
                        placeholder="Enter your first name"
                      />
                    </div>
                    
                    <div className="profile-input-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={editedProfile.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="profile-input"
                        placeholder="Enter your last name"
                      />
                    </div>
                    
                    <div className="profile-input-group">
                      <label>Work Hours</label>
                      <input
                        type="text"
                        value={editedProfile.workHours || ''}
                        onChange={(e) => handleInputChange('workHours', e.target.value)}
                        className="profile-input"
                        placeholder="e.g., 9:00-17:00"
                      />
                    </div>
                    
                    <div className="profile-input-group">
                      <label>Work Days</label>
                      <div className="work-days-grid">
                        {dayNames.map((day, index) => (
                          <button
                            key={index}
                            className={`work-day-toggle ${
                              editedProfile.workDays?.includes(index) ? 'active' : ''
                            }`}
                            onClick={() => handleWorkDayToggle(index)}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="profile-edit-actions">
                      <button 
                        className="profile-btn secondary"
                        onClick={handleCancelEdit}
                      >
                        <FiX size={16} />
                        Cancel
                      </button>
                      <button 
                        className="profile-btn primary"
                        onClick={handleSaveProfile}
                      >
                        <FiCheck size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-info">
                    <h3>
                      {userProfile?.firstName || 'Anonymous'} {userProfile?.lastName || ''}
                    </h3>
                    <div className="profile-meta">
                      <div className="profile-meta-item">
                        <FiClock size={14} />
                        <span>{userProfile?.workHours || 'Not set'}</span>
                      </div>
                      <div className="profile-meta-item">
                        <FiCalendar size={14} />
                        <span>
                          {userProfile?.workDays?.length || 0} work days per week
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <FiDatabase size={20} />
              </div>
              <div className="profile-section-title">
                <h2>Your Activity</h2>
                <p>Overview of your productivity data</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{totalNotches}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{completedNotches}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalCategories}</div>
                <div className="stat-label">Categories</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {totalNotches > 0 ? Math.round((completedNotches / totalNotches) * 100) : 0}%
                </div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
          </div>

          {/* App Settings Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <FiSettings size={20} />
              </div>
              <div className="profile-section-title">
                <h2>App Settings</h2>
                <p>Customize your experience</p>
              </div>
            </div>

            <div className="settings-list">
              {/* Theme Setting */}
              <div className="setting-item">
                <div className="setting-content">
                  <div className="setting-icon">
                    {appTheme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
                  </div>
                  <div className="setting-details">
                    <h3>Theme</h3>
                    <p>App appearance preference</p>
                  </div>
                </div>
                <div className="setting-control">
                  <button
                    className={`theme-btn ${appTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <FiMoon size={14} />
                    Dark
                  </button>
                  <button
                    className={`theme-btn ${appTheme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <FiSun size={14} />
                    Light
                  </button>
                </div>
              </div>

              {/* Notifications Setting */}
              <div className="setting-item">
                <div className="setting-content">
                  <div className="setting-icon">
                    <FiBell size={20} />
                  </div>
                  <div className="setting-details">
                    <h3>Notifications</h3>
                    <p>
                      {notifications === 'granted' && 'Enabled - you\'ll receive reminders'}
                      {notifications === 'denied' && 'Disabled - enable in browser settings'}
                      {notifications === 'default' && 'Not configured'}
                    </p>
                  </div>
                </div>
                <div className="setting-control">
                  {notifications === 'default' && (
                    <button
                      className="setting-btn primary"
                      onClick={handleRequestNotifications}
                    >
                      Enable
                    </button>
                  )}
                  {notifications === 'granted' && (
                    <div className="setting-status enabled">
                      <FiCheck size={16} />
                      Enabled
                    </div>
                  )}
                  {notifications === 'denied' && (
                    <div className="setting-status disabled">
                      Disabled
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <FiDatabase size={20} />
              </div>
              <div className="profile-section-title">
                <h2>Data Management</h2>
                <p>Export or clear your data</p>
              </div>
            </div>

            <div className="data-actions">
              <button 
                className="data-btn export"
                onClick={exportData}
              >
                <FiDownload size={18} />
                <div className="data-btn-content">
                  <span className="data-btn-title">Export Data</span>
                  <span className="data-btn-desc">Download a backup of all your data</span>
                </div>
              </button>
              
              <button 
                className="data-btn danger"
                onClick={clearAllData}
              >
                <FiTrash2 size={18} />
                <div className="data-btn-content">
                  <span className="data-btn-title">Clear All Data</span>
                  <span className="data-btn-desc">Permanently delete all tasks and settings</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ProfileView 