import { useState, useEffect } from 'react'
import { FaThList } from 'react-icons/fa'
import { FiArrowRight, FiCheck, FiBell, FiHardDrive } from 'react-icons/fi'
import './style.css'

const ONBOARDING_PHASES = [
  'logo-animation',
  'personal-info',
  'preferences',
  'permissions',
  'complete'
]

function Onboarding({ onComplete }) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workHours: '9:00-17:00',
    workDays: [1, 2, 3, 4, 5] // Mon-Fri
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [permissions, setPermissions] = useState({
    notifications: 'default',
    storage: 'default'
  })
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false)
  const [storageApiAvailable, setStorageApiAvailable] = useState(false)

  // Check storage API availability on mount
  useEffect(() => {
    const isStorageAvailable = window.isSecureContext && 
                              'storage' in navigator && 
                              'persist' in navigator.storage
    setStorageApiAvailable(isStorageAvailable)
  }, [])



  // Check current permission status when reaching permissions phase
  useEffect(() => {
    if (currentPhase === ONBOARDING_PHASES.indexOf('permissions')) {
      checkCurrentPermissions()
    }
  }, [currentPhase])

  // Check current browser permission status
  const checkCurrentPermissions = async () => {
    console.log('🔍 Checking current permission status...')
    
    // Check notifications
    if ('Notification' in window) {
      const notificationStatus = Notification.permission
      console.log('📋 Current notification permission:', notificationStatus)
      setPermissions(prev => ({ ...prev, notifications: notificationStatus }))
    } else {
      setPermissions(prev => ({ ...prev, notifications: 'denied' }))
    }

    // Check storage (only if API is available)
    if (storageApiAvailable) {
      try {
        const isPersistent = await navigator.storage.persisted()
        console.log('📋 Current storage persistence:', isPersistent)
        setPermissions(prev => ({ 
          ...prev, 
          storage: isPersistent ? 'granted' : 'default' 
        }))
      } catch (error) {
        console.error('Error checking storage permission:', error)
        setPermissions(prev => ({ ...prev, storage: 'default' }))
      }
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextPhase = () => {
    if (currentPhase < ONBOARDING_PHASES.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentPhase(prev => prev + 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleComplete = () => {
    const profileData = {
      ...formData,
      permissions
    }
    console.log('🎯 Onboarding complete - sending profile data:', profileData)
    setIsTransitioning(true)
    setTimeout(() => {
      onComplete(profileData)
    }, 500)
  }

  // Request push notification permission
  const requestNotificationPermission = async () => {
    console.log('🔔 Requesting notification permission...')
    
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications')
      setPermissions(prev => ({ ...prev, notifications: 'denied' }))
      return
    }

    // Check current permission status first
    if (Notification.permission !== 'default') {
      console.log('📋 Notification permission already set:', Notification.permission)
      setPermissions(prev => ({ ...prev, notifications: Notification.permission }))
      return
    }

    try {
      console.log('🔔 Requesting permission from user...')
      const permission = await Notification.requestPermission()
      setPermissions(prev => ({ ...prev, notifications: permission }))
      console.log('✅ Notification permission result:', permission)
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      setPermissions(prev => ({ ...prev, notifications: 'denied' }))
    }
  }

  // Request persistent storage permission
  const requestStoragePermission = async () => {
    console.log('💾 Requesting storage permission...')

    try {
      // Check if already persistent
      const isPersistent = await navigator.storage.persisted()
      if (isPersistent) {
        console.log('📋 Storage already persistent')
        setPermissions(prev => ({ ...prev, storage: 'granted' }))
        return
      }

      console.log('💾 Requesting persistent storage from user...')
      const granted = await navigator.storage.persist()
      setPermissions(prev => ({ 
        ...prev, 
        storage: granted ? 'granted' : 'denied' 
      }))
      
      console.log('✅ Storage permission result:', granted)
      
    } catch (error) {
      console.error('❌ Error requesting storage permission:', error)
      setPermissions(prev => ({ ...prev, storage: 'denied' }))
    }
  }

  // Request available permissions
  const requestAllPermissions = async () => {
    console.log('🚀 Starting permission requests...')
    setIsRequestingPermissions(true)
    
    try {
      const permissionRequests = [requestNotificationPermission()]
      
      // Always try storage permission, even if not shown in UI
      if (storageApiAvailable) {
        permissionRequests.push(requestStoragePermission())
      }
      
      await Promise.all(permissionRequests)
      
      console.log('✅ All permission requests completed')
    } catch (error) {
      console.error('❌ Error during permission requests:', error)
    } finally {
      setIsRequestingPermissions(false)
    }
  }

  // Skip permissions (still track that they were asked)
  const skipPermissions = () => {
    setPermissions({
      notifications: 'denied',
      storage: storageApiAvailable ? 'denied' : 'default'
    })
  }

  const renderLogoAnimation = () => (
    <div className="onboarding-phase launch-screen">
      <div className="launch-container">
        <div className="logo-brand-section">
          <div className="app-logo">
            <FaThList />
          </div>
          <h1 className="app-name">Docket</h1>
        </div>
        <p className="app-subtitle">Timeboxing made simple.</p>
        <button 
          className="get-started-btn"
          onClick={nextPhase}
        >
          Let's go!
          <FiArrowRight size={20} />
        </button>
      </div>
    </div>
  )

  const renderPersonalInfo = () => (
    <div className="onboarding-phase personal-info-phase">
      <div className="phase-content">
        <div className="phase-header">
          <h2>Welcome to Docket</h2>
          <p>Let's get you set up</p>
        </div>
        
        <div className="form-container">
          <div className="input-group">
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="First name"
              autoFocus
              className="minimal-input"
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Last name"
              className="minimal-input"
            />
          </div>
        </div>
        
        <button 
          className="continue-btn" 
          onClick={nextPhase}
          disabled={!formData.firstName.trim()}
        >
          Continue
          <FiArrowRight size={20} />
        </button>
      </div>
    </div>
  )

  const renderPreferences = () => (
    <div className="onboarding-phase preferences-phase">
      <div className="phase-content">
        <div className="phase-header">
          <h2>Your schedule</h2>
          <p>When do you typically work?</p>
        </div>
        
        <div className="form-container">
          <div className="input-group">
            <label>Work hours</label>
            <select
              value={formData.workHours}
              onChange={(e) => handleInputChange('workHours', e.target.value)}
              className="minimal-select"
            >
              <option value="8:00-16:00">8:00 AM - 4:00 PM</option>
              <option value="9:00-17:00">9:00 AM - 5:00 PM</option>
              <option value="10:00-18:00">10:00 AM - 6:00 PM</option>
              <option value="flexible">Flexible schedule</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Work days</label>
            <div className="days-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <button
                  key={index}
                  className={`day-toggle ${formData.workDays.includes(index) ? 'active' : ''}`}
                  onClick={() => {
                    const newWorkDays = formData.workDays.includes(index)
                      ? formData.workDays.filter(d => d !== index)
                      : [...formData.workDays, index].sort()
                    handleInputChange('workDays', newWorkDays)
                  }}
                  type="button"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          

        </div>
        
        <button className="continue-btn" onClick={nextPhase}>
          Continue
          <FiArrowRight size={20} />
        </button>
      </div>
    </div>
  )

  const renderPermissions = () => (
    <div className="onboarding-phase permissions-phase">
      <div className="phase-content">
        <div className="phase-header">
          <h2>Enable features</h2>
          <p>Get the most out of Docket</p>
        </div>
        
        <div className="permissions-container">
          <div className="permission-item">
            <div className="permission-icon">
              <FiBell size={24} />
            </div>
            <div className="permission-content">
              <h3>Push notifications</h3>
              <p>Get reminders for focus sessions and task deadlines</p>
            </div>
            <div className={`permission-status ${permissions.notifications}`}>
              {permissions.notifications === 'granted' && <FiCheck size={16} />}
            </div>
          </div>
          
          {storageApiAvailable && (
            <div className="permission-item">
              <div className="permission-icon">
                <FiHardDrive size={24} />
              </div>
              <div className="permission-content">
                <h3>Persistent storage</h3>
                <p>
                  {permissions.storage === 'denied' 
                    ? 'Browser may clean data when storage is low (your data is still saved)'
                    : 'Keep your data safe and prevent browser cleanup'
                  }
                </p>
              </div>
              <div className={`permission-status ${permissions.storage}`}>
                {permissions.storage === 'granted' && <FiCheck size={16} />}
                {permissions.storage === 'denied' && <span style={{fontSize: '12px', opacity: 0.7}}>Optional</span>}
              </div>
            </div>
          )}
        </div>
        
        <div className="permission-actions">
          {(permissions.notifications === 'default' || (storageApiAvailable && permissions.storage === 'default')) ? (
            <>
              <button 
                className="continue-btn" 
                onClick={requestAllPermissions}
                disabled={isRequestingPermissions}
              >
                {isRequestingPermissions ? 'Requesting...' : 'Allow permissions'}
                {!isRequestingPermissions && <FiArrowRight size={20} />}
              </button>
              
              <button 
                className="skip-btn" 
                onClick={() => {
                  skipPermissions()
                  nextPhase()
                }}
                disabled={isRequestingPermissions}
              >
                Skip for now
              </button>
            </>
          ) : (
            <button className="continue-btn primary" onClick={nextPhase}>
              Continue
              <FiArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="onboarding-phase complete-phase">
      <div className="phase-content">
        <div className="success-icon">
          <FiCheck size={48} />
        </div>
        
        <div className="phase-header">
          <h2>All set, {formData.firstName}!</h2>
          <p>Ready to start timeboxing</p>
        </div>
        
        <button className="continue-btn primary" onClick={handleComplete}>
          Get started
          <FiArrowRight size={20} />
        </button>
      </div>
    </div>
  )

  const renderCurrentPhase = () => {
    switch (ONBOARDING_PHASES[currentPhase]) {
      case 'logo-animation':
        return renderLogoAnimation()
      case 'personal-info':
        return renderPersonalInfo()
      case 'preferences':
        return renderPreferences()
      case 'permissions':
        return renderPermissions()
      case 'complete':
        return renderComplete()
      default:
        return renderLogoAnimation()
    }
  }

  return (
    <div className="onboarding-container">
      {/* Progress dots - only show during form phases */}
      {currentPhase > 0 && currentPhase < ONBOARDING_PHASES.length - 1 && (
        <div className="progress-dots">
          {ONBOARDING_PHASES.slice(1, -1).map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index < currentPhase - 1 ? 'completed' : 
                index === currentPhase - 1 ? 'active' : ''
              }`}
            />
          ))}
        </div>
      )}
      
      <div className={`phase-container ${isTransitioning ? 'transitioning' : ''}`}>
        {renderCurrentPhase()}
      </div>
    </div>
  )
}

export default Onboarding 