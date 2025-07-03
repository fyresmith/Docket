import { useState, useEffect } from 'react'
import Header from './components/Header'
import DayPicker from './components/DayPicker'
import TaskTimeline from './components/TaskTimeline'
import EmptyDayState from './components/EmptyDayState'
import BottomNavigation from './components/BottomNavigation'
import CreateNotchModal from './components/CreateNotchModal'
import NotchDetailModal from './components/NotchDetailModal'
import FocusView from './components/FocusView'
import TimerView from './components/TimerView'
import ProfileView from './components/ProfileView'
import Onboarding from './components/Onboarding'
import { useNotchDB } from './hooks/useNotchDB'
import { TimerProvider } from './contexts/TimerContext'
// import TimerList from './components/TimerList'
// import TimerDetail from './components/TimerDetail'
// import CreateTimerModal from './components/CreateTimerModal'
import './App.css'

// Theme initialization function
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('app-theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  return savedTheme
}

function AppContent() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNotch, setSelectedNotch] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentView, setCurrentView] = useState('timer')
  const [selectedTimerNotch, setSelectedTimerNotch] = useState(null)
  const [previousView, setPreviousView] = useState('timer')
  
  // Initialize theme on app load
  useEffect(() => {
    initializeTheme()
  }, [])
  const { 
    notches, 
    isDbReady, 
    dbError, 
    isFirstTimeUser,
    userProfile,
    saveUserProfile,
    addNotch, 
    updateNotch,
    getNotchesByDate, 
    deleteNotch
  } = useNotchDB()
  
  // const [selectedTimer, setSelectedTimer] = useState(null)
  // const [searchQuery, setSearchQuery] = useState('')

  // // Update selected timer when timers change
  // useEffect(() => {
  //   if (selectedTimer) {
  //     const updatedTimer = timers.find(t => t.id === selectedTimer.id)
  //     if (updatedTimer && updatedTimer.timeLeft !== selectedTimer.timeLeft) {
  //       setSelectedTimer(updatedTimer)
  //     }
  //   }
  // }, [timers, selectedTimer])

  // const handleCreateTimer = (timerData) => {
  //   addTimer(timerData)
  //   setShowCreateModal(false)
  // }

  // const handleTimerSelect = (timer) => {
  //   setSelectedTimer(timer)
  // }

  // const handleBackToList = () => {
  //   setSelectedTimer(null)
  // }

  // const handleDeleteTimer = (id) => {
  //   deleteTimer(id)
  //   if (selectedTimer?.id === id) {
  //     setSelectedTimer(null)
  //   }
  // }

  const handleDateChange = (date) => {
    setSelectedDate(date)
  }

  const handleAddNotch = () => {
    if (!isDbReady) {
      alert('Database is still initializing. Please wait a moment and try again.')
      return
    }
    
    if (dbError) {
      alert('Database error: ' + dbError)
      return
    }
    
    setShowCreateModal(true)
  }

  // Profile view handlers
  const handleProfileClick = () => {
    setPreviousView(currentView)
    setCurrentView('profileView')
  }

  const handleBackFromProfile = () => {
    setCurrentView(previousView)
  }

  const handleCreateNotch = async (notchData) => {
    try {
      console.log('Creating notch with data:', notchData)
      // Add the new notch to IndexedDB
      await addNotch(notchData)
      
      // Parse the notch date and ensure it's valid
      const notchDate = new Date(notchData.date)
      console.log('Navigating to notch date:', notchDate.toDateString())
      
      // Always switch to calendar view and navigate to the notch's date
      setCurrentView('calendar')
      setSelectedDate(notchDate)
      
      // Close the modal
      setShowCreateModal(false)
      
      console.log('Successfully created notch and navigated to:', notchDate.toDateString())
    } catch (error) {
      console.error('Error creating notch:', error)
      alert('Failed to create task: ' + error.message)
    }
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
  }

  const handleNotchClick = (notch) => {
    setSelectedNotch(notch)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedNotch(null)
  }

  const handleUpdateNotch = async (updatedNotch) => {
    try {
      console.log('Updating notch with data:', updatedNotch)
      await updateNotch(updatedNotch)
    } catch (error) {
      console.error('Error updating notch:', error)
      alert('Failed to update task: ' + error.message)
    }
  }

  const handleDeleteNotch = (notchId) => {
    deleteNotch(notchId)
  }

  // Bottom navigation handlers
  const handleCalendarView = () => {
    setCurrentView('calendar')
  }

  const handleTimerView = () => {
    setCurrentView('timer')
  }

  // Timer view handlers
  const handleStartTimer = (notch, fromView) => {
    setPreviousView(fromView || currentView)
    setSelectedTimerNotch(notch)
    setCurrentView('timerView')
  }
  
  // Handle timer click from header dropdown
  const handleTimerClick = (notchId) => {
    // Find the notch by ID
    const notch = notches.find(n => n.id === notchId)
    if (notch) {
      setPreviousView(currentView)
      setSelectedTimerNotch(notch)
      setCurrentView('timerView')
    }
  }

  const handleBackFromTimer = () => {
    setSelectedTimerNotch(null)
    setCurrentView(previousView)
  }

  // Handle onboarding completion
  const handleOnboardingComplete = async (onboardingData) => {
    try {
      console.log('🎉 APP.JSX - Onboarding completed with data:', onboardingData)
      console.log('📝 APP.JSX - Data keys received:', Object.keys(onboardingData))
      console.log('👤 APP.JSX - First Name:', onboardingData.firstName || 'MISSING')
      console.log('👤 APP.JSX - Last Name:', onboardingData.lastName || 'MISSING')
      console.log('⏰ APP.JSX - Work Hours:', onboardingData.workHours || 'MISSING')
      console.log('📅 APP.JSX - Work Days:', onboardingData.workDays || 'MISSING')
      console.log('🔐 APP.JSX - Permissions:', onboardingData.permissions || 'MISSING')
      
      await saveUserProfile(onboardingData)
      
      // Show a welcome notification if permissions were granted
      if (onboardingData.permissions?.notifications === 'granted') {
        setTimeout(() => {
          new Notification('Welcome to Docket! 🎯', {
            body: 'You\'re all set up and ready to start timeboxing your day.',
            icon: '/favicon.ico',
            tag: 'welcome'
          })
        }, 1000)
      }
      
      console.log('✅ User profile saved successfully, transitioning to app...')
    } catch (error) {
      console.error('❌ Error saving user profile:', error)
      alert('Failed to save your profile. Please try again.')
    }
  }

  // Get notches for the selected date
  const selectedDateNotches = getNotchesByDate(selectedDate)
  const hasNotches = selectedDateNotches.length > 0

  return (
    <div className="app">
      {/* Global Database Loading State */}
      {!isDbReady && !dbError && (
        <div className="app-loading">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Initializing Docket</h2>
            <p>Setting up your timeboxing calendar...</p>
          </div>
        </div>
      )}
      
      {/* Database Error State */}
      {dbError && (
        <div className="app-error">
          <div className="error-content">
            <h2>Database Error</h2>
            <p>{dbError}</p>
            <button onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      )}
      
      {/* Onboarding Flow - Show for first-time users */}
      {isDbReady && !dbError && isFirstTimeUser && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      
      {/* Main App Content - Only show when database is ready and user is set up */}
      {isDbReady && !dbError && !isFirstTimeUser && (
        <>
          {/* Timer View - Full Screen */}
          {currentView === 'timerView' && selectedTimerNotch && (
            <TimerView
              notch={selectedTimerNotch}
              onBack={handleBackFromTimer}
            />
          )}

          {/* Profile View - Full Screen */}
          {currentView === 'profileView' && (
            <ProfileView
              onBack={handleBackFromProfile}
            />
          )}

          {/* Normal App Views */}
          {currentView !== 'timerView' && currentView !== 'profileView' && (
            <>
              {/* Fixed Header Area */}
              <div className="app-header">
                <Header 
                  onAddClick={handleAddNotch} 
                  onTimerClick={handleTimerClick}
                  onProfileClick={handleProfileClick}
                  disabled={!isDbReady || !!dbError} 
                />
                {/* Only show DayPicker in calendar view */}
                {currentView === 'calendar' && (
                  <DayPicker 
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                  />
                )}
              </div>

              {/* Scrollable Content Area */}
              <div className={`app-content ${currentView === 'timer' ? 'focus-view' : ''}`}>
                {currentView === 'calendar' ? (
                  // Calendar View Content
                  hasNotches ? (
                    <TaskTimeline 
                      date={selectedDate}
                      tasks={selectedDateNotches}
                      onNotchClick={handleNotchClick}
                    />
                  ) : (
                    <EmptyDayState 
                      date={selectedDate}
                      onAddNotch={handleAddNotch}
                      disabled={!isDbReady || !!dbError}
                    />
                  )
                ) : (
                  // Focus View Content
                  <FocusView onStartTimer={(notch) => handleStartTimer(notch, 'timer')} />
                )}
              </div>

              {/* Bottom Navigation */}
              <BottomNavigation 
                currentView={currentView}
                onCalendarClick={handleCalendarView}
                onTimerClick={handleTimerView}
                onAddClick={handleAddNotch}
                // onProfileClick={handleProfileClick} // Temporarily commented out - using header PFP
                disabled={!isDbReady || !!dbError}
              />
            </>
          )}

          {/* New Notch Modal */}
          <CreateNotchModal
            isOpen={showCreateModal}
            onClose={handleCloseModal}
            onCreateNotch={handleCreateNotch}
            selectedDate={selectedDate}
          />

          {/* Notch Detail Modal */}
          <NotchDetailModal
            isOpen={showDetailModal}
            onClose={handleCloseDetailModal}
            notch={selectedNotch}
            onUpdateNotch={handleUpdateNotch}
            onDeleteNotch={handleDeleteNotch}
          />
        </>
      )}

      {/* Hidden timer components for future reference */}
      {/* {selectedTimer ? (
        <TimerDetail
          timer={selectedTimer}
          isRunning={runningTimers.has(selectedTimer.id)}
          onBack={handleBackToList}
          onDelete={handleDeleteTimer}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={resetTimer}
        />
      ) : (
        <TimerList
          timers={timers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          runningTimers={runningTimers}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={resetTimer}
          onTimerSelect={handleTimerSelect}
        />
      )} */}

      {/* Hidden modal for future reference */}
      {/* {showCreateModal && (
        <CreateTimerModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTimer}
        />
      )} */}
    </div>
  )
}

function App() {
  return (
    <TimerProvider>
      <AppContent />
    </TimerProvider>
  )
}

export default App
