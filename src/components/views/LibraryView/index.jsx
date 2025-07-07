import { useState, useEffect, useRef } from 'react'
import { FiPlay, FiPause, FiClock, FiTag, FiEdit, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { FaThList } from 'react-icons/fa'
import { useNotchDB } from '../../../hooks/useNotchDB'
import { useTimer } from '../../../contexts/TimerContext'
import NotchDetailModal from '../../common/NotchDetailModal'
import EditNotchModal from '../../common/EditNotchModal'
import CreateNotchModal from '../../common/CreateNotchModal'
import AddNotchDropdown from './AddNotchDropdown'
import SwipeableCard from '../../common/SwipeableCard'
import './style.css'

function LibraryView({ onStartTimer }) {
  const { notches, addNotch, getCategoryById, updateNotch, deleteNotch } = useNotchDB()
  const { 
    isNotchTimerRunning, 
    getNotchTimerTimeRemaining,
    formatTime
  } = useTimer()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotch, setSelectedNotch] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddPopup, setShowAddPopup] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const addPopupRef = useRef(null)

  // Handle click outside popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addPopupRef.current && !addPopupRef.current.contains(event.target)) {
        setShowAddPopup(false)
      }
    }

    if (showAddPopup) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddPopup])



  // Calculate duration from notch times
  const calculateNotchDuration = (notch) => {
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    return durationMinutes
  }

  // Format duration display
  const formatDuration = (durationMinutes) => {
    if (durationMinutes < 60) {
      return `${durationMinutes}m`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
  }

  // Get notch color from category
  const getNotchColor = (notch) => {
    if (notch.categoryColor) {
      return notch.categoryColor
    }
    
    if (notch.category) {
      const categoryFromDB = getCategoryById(notch.category)
      if (categoryFromDB?.color) {
        return categoryFromDB.color
      }
    }
    
    return '#007AFF'
  }



  // Handle card click to show details
  const handleCardClick = (notch) => {
    setSelectedNotch(notch)
    setShowDetailModal(true)
  }

  // Handle edit button click
  const handleEditClick = (e, notch) => {
    e.stopPropagation() // Prevent card click
    setSelectedNotch(notch)
    setShowEditModal(true)
  }

  // Handle timer button click (open timer view)
  const handleTimerClick = (e, notch) => {
    e.stopPropagation() // Prevent card click
    onStartTimer && onStartTimer(notch)
  }

  // Handle detail modal close
  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedNotch(null)
  }

  // Handle edit modal close
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedNotch(null)
  }

  // Handle notch update
  const handleUpdateNotch = async (updatedNotch) => {
    try {
      await updateNotch(updatedNotch)
      // Close both modals after successful update
      setShowEditModal(false)
      setShowDetailModal(false)
      setSelectedNotch(null)
    } catch (error) {
      console.error('Error updating notch:', error)
      alert('Failed to update task: ' + error.message)
    }
  }

  // Handle notch delete
  const handleDeleteNotch = (notchId) => {
    deleteNotch(notchId)
    handleCloseDetailModal()
  }

  // Handle add popup toggle
  const handleAddPopupToggle = () => {
    setShowAddPopup(!showAddPopup)
  }

  // Handle new notch creation
  const handleNewNotch = () => {
    setShowAddPopup(false)
    setShowCreateModal(true)
  }

  // Handle new quick notch creation
  const handleNewQuickNotch = () => {
    setShowAddPopup(false)
    // TODO: Implement quick notch creation logic
    console.log('Quick notch creation - to be implemented')
  }

  // Handle create modal close
  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  // Handle create notch
  const handleCreateNotch = async (notchData) => {
    try {
      await addNotch(notchData)
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating notch:', error)
      alert('Failed to create task: ' + error.message)
    }
  }

  // Filter notches based on search query
  const filteredNotches = notches.filter(notch => {
    const searchLower = searchQuery.toLowerCase()
    const titleMatch = notch.title.toLowerCase().includes(searchLower)
    const categoryMatch = (notch.categoryName || notch.category || '').toLowerCase().includes(searchLower)
    return titleMatch || categoryMatch
  })

  return (
    <div className="focus-view">
      {/* Focus Sub Header with Search */}
      <div className="focus-sub-header">
        <div className="focus-search-container">
          <input
            type="text"
            className="focus-search-input"
            placeholder="Search tasks by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="add-notch-container" ref={addPopupRef}>
            <button 
              className="add-notch-btn"
              onClick={handleAddPopupToggle}
            >
              <FiPlus size={18} />
            </button>
            
            {/* Add Dropdown */}
            <AddNotchDropdown
              isOpen={showAddPopup}
              onClose={() => setShowAddPopup(false)}
              onNewNotch={handleNewNotch}
              onNewQuickNotch={handleNewQuickNotch}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Notches List */}
      <div className="focus-main-content">
        <div className="notches-list">
          {notches.length === 0 ? (
            <div className="beautiful-empty-state">
              <div className="empty-state-icon">
                <FaThList size={48} />
              </div>
              <div className="empty-state-content">
                <h2 className="empty-state-title">Welcome to your Docket</h2>
                <p className="empty-state-description">
                  Your personal timeboxing workspace is ready. Create your first notch to start organizing your day with intention.
                </p>
                <div className="empty-state-features">
                  <div className="feature-item">
                    <FiClock size={20} />
                    <span>Schedule focused work sessions</span>
                  </div>
                  <div className="feature-item">
                    <FiTag size={20} />
                    <span>Organize tasks by categories</span>
                  </div>
                  <div className="feature-item">
                    <FiPlay size={20} />
                    <span>Track time with built-in timers</span>
                  </div>
                </div>
                <button 
                  className="empty-state-cta"
                  onClick={handleNewNotch}
                >
                  <FiPlus size={20} />
                  Create your first task
                </button>
              </div>
            </div>
          ) : filteredNotches.length === 0 ? (
            <div className="beautiful-empty-state search-empty">
              <div className="empty-state-icon">
                <FiSearch size={48} />
              </div>
              <div className="empty-state-content">
                <h2 className="empty-state-title">No notches found</h2>
                <p className="empty-state-description">
                  We couldn't find any notches matching <span className="search-term">"{searchQuery}"</span>
                </p>
                <div className="empty-state-suggestions">
                  <p>Try:</p>
                  <ul>
                    <li>Checking your spelling</li>
                    <li>Using different keywords</li>
                    <li>Creating a new notch with this title</li>
                  </ul>
                </div>
                <button 
                  className="empty-state-cta secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            filteredNotches.map((notch) => {
              const duration = calculateNotchDuration(notch)
              const isRunning = isNotchTimerRunning(notch.id)
              const timeRemaining = getNotchTimerTimeRemaining(notch.id)
              const notchColor = getNotchColor(notch)
              
              return (
                <SwipeableCard
                  key={notch.id}
                  rightActions={[{
                    id: 'delete',
                    type: 'delete',
                    icon: <FiTrash2 />,
                    label: 'Delete',
                    primary: true,
                    onAction: async () => {
                      const confirmDelete = window.confirm(`Are you sure you want to delete "${notch.title}"?`)
                      if (confirmDelete) {
                        await deleteNotch(notch.id)
                      }
                    }
                  }]}
                >
                  <div
                    className={`notch-timer-card ${isRunning ? 'running' : ''}`}
                    style={{
                      borderLeftColor: notchColor,
                      backgroundColor: `${notchColor}15`
                    }}
                    onClick={() => handleCardClick(notch)}
                  >
                    <div className="notch-timer-content">
                      <div className="notch-timer-header">
                        <h3 className="notch-timer-title">{notch.title}</h3>
                      </div>
                      
                      <div className="notch-timer-meta">
                        <div className="notch-timer-duration">
                          <FiClock size={14} />
                          {formatDuration(duration)}
                        </div>
                        
                        {(notch.categoryName || notch.category) && (
                          <div className="notch-timer-category" style={{ color: notchColor }}>
                            <FiTag size={12} />
                            {notch.categoryName || notch.category}
                          </div>
                        )}
                      </div>
                      
                      {isRunning && (
                        <div className="notch-timer-remaining">
                          Time remaining: {formatTime(timeRemaining)}
                        </div>
                      )}
                    </div>
                    
                    <div className="notch-timer-actions">
                      <button
                        className="notch-timer-btn edit"
                        onClick={(e) => handleEditClick(e, notch)}
                      >
                        <FiEdit size={18} />
                      </button>
                      
                      <button
                        className="notch-timer-btn timer"
                        onClick={(e) => handleTimerClick(e, notch)}
                      >
                        <FiClock size={18} />
                      </button>
                    </div>
                  </div>
                </SwipeableCard>
              )
            })
          )}
        </div>
      </div>

      {/* Notch Detail Modal */}
      <NotchDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        notch={selectedNotch}
        onUpdateNotch={handleUpdateNotch}
        onDeleteNotch={handleDeleteNotch}
      />

      {/* Edit Notch Modal */}
      <EditNotchModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        notch={selectedNotch}
        onUpdateNotch={handleUpdateNotch}
        onDeleteNotch={handleDeleteNotch}
      />

      {/* Create Notch Modal */}
      <CreateNotchModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreateNotch={handleCreateNotch}
        selectedDate={new Date()}
      />
    </div>
  )
}

export default LibraryView 