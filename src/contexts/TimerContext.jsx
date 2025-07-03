import { createContext, useContext, useState, useEffect } from 'react'
import { useNotchDB } from '../hooks/useNotchDB'
import { useTimerLogic } from '../hooks/useTimerLogic'
import { useServiceWorkerTimerLogic } from '../hooks/useServiceWorkerTimerLogic'

const TimerContext = createContext()

export const useTimer = () => {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}

export function TimerProvider({ children }) {
  const { timers, addTimer, updateTimer, deleteTimer, isDbReady } = useNotchDB()
  
  // Use service worker timer logic with fallback to original logic
  const serviceWorkerTimerLogic = useServiceWorkerTimerLogic(timers, updateTimer)
  const originalTimerLogic = useTimerLogic(timers, updateTimer)
  
  // Choose which timer logic to use based on service worker support
  const timerLogic = serviceWorkerTimerLogic.isServiceWorkerSupported 
    ? serviceWorkerTimerLogic 
    : originalTimerLogic
  
  const { runningTimers, startTimer, stopTimer, resetTimer } = timerLogic
  
  // Active timer management (which timer is currently being viewed)
  const [activeTimerId, setActiveTimerId] = useState(null)
  
  // Find timer by ID
  const findTimer = (timerId) => {
    return timers.find(timer => timer.id === timerId)
  }
  
  // Find timer by notch ID
  const findTimerByNotch = (notchId) => {
    return timers.find(timer => timer.notchId === notchId)
  }
  
  // Create timer from notch
  const createTimerFromNotch = async (notch) => {
    if (!notch || !isDbReady) return null
    
    console.log('Creating timer from notch:', notch)
    
    // Calculate duration from notch times
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    const durationSeconds = durationMinutes * 60
    
    if (durationSeconds <= 0) {
      console.error('Invalid duration calculated:', durationSeconds)
      return null
    }
    
    const timerData = {
      name: notch.title,
      category: notch.categoryName || notch.category || 'Notch Timer',
      duration: durationSeconds,
      timeLeft: durationSeconds,
      notchId: notch.id,
      notchColor: notch.categoryColor,
      createdAt: new Date().toISOString(),
      fromNotch: true
    }
    
    try {
      await addTimer(timerData)
      console.log('Timer created successfully for notch:', notch.id)
      
      // Find the newly created timer (it will have a real ID now)
      // We'll wait a bit for the database to update
      return new Promise((resolve) => {
        const checkForTimer = () => {
          const newTimer = findTimerByNotch(notch.id)
          if (newTimer && newTimer.id && !newTimer.id.toString().startsWith('temp-')) {
            console.log('Found newly created timer:', newTimer.id)
            resolve(newTimer)
          } else {
            setTimeout(checkForTimer, 50)
          }
        }
        setTimeout(checkForTimer, 50)
      })
    } catch (error) {
      console.error('Error creating timer from notch:', error)
      return null
    }
  }
  
  // Start timer for a notch (create if doesn't exist)
  const startNotchTimer = async (notch) => {
    if (!notch) return null
    
    console.log('Starting timer for notch:', notch.id)
    
    // Check if timer already exists
    let timer = findTimerByNotch(notch.id)
    
    if (!timer) {
      console.log('Timer not found, creating new timer')
      timer = await createTimerFromNotch(notch)
      if (!timer) {
        console.error('Failed to create timer for notch')
        return null
      }
    }
    
    // Start the timer
    console.log('Starting timer:', timer.id)
    startTimer(timer.id)
    
    return timer
  }
  
  // Get timer for notch
  const getNotchTimer = (notchId) => {
    return findTimerByNotch(notchId)
  }
  
  // Check if notch has a running timer
  const isNotchTimerRunning = (notchId) => {
    const timer = findTimerByNotch(notchId)
    return timer ? runningTimers.has(timer.id) : false
  }
  
  // Get notch timer remaining time
  const getNotchTimerTimeRemaining = (notchId) => {
    const timer = findTimerByNotch(notchId)
    return timer ? timer.timeLeft : 0
  }
  
  // Stop notch timer
  const stopNotchTimer = (notchId) => {
    const timer = findTimerByNotch(notchId)
    if (timer) {
      stopTimer(timer.id)
    }
  }
  
  // Reset notch timer
  const resetNotchTimer = (notchId) => {
    const timer = findTimerByNotch(notchId)
    if (timer) {
      resetTimer(timer)
    }
  }
  
  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Get all running timer info
  const getRunningTimersInfo = () => {
    return Array.from(runningTimers).map(timerId => {
      const timer = findTimer(timerId)
      return timer ? {
        id: timer.id,
        name: timer.name,
        timeLeft: timer.timeLeft,
        duration: timer.duration,
        notchId: timer.notchId,
        isRunning: true
      } : null
    }).filter(Boolean)
  }
  
  // Context value
  const contextValue = {
    // Timer data
    timers,
    runningTimers,
    activeTimerId,
    
    // Timer management
    findTimer,
    findTimerByNotch,
    createTimerFromNotch,
    
    // Timer controls
    startTimer,
    stopTimer,
    resetTimer,
    
    // Notch timer integration
    startNotchTimer,
    stopNotchTimer,
    resetNotchTimer,
    getNotchTimer,
    isNotchTimerRunning,
    getNotchTimerTimeRemaining,
    
    // Active timer management
    setActiveTimerId,
    
    // Utilities
    formatTime,
    getRunningTimersInfo,
    
    // Database state
    isDbReady,
    
    // Service worker state
    serviceWorkerReady: serviceWorkerTimerLogic.serviceWorkerReady,
    isServiceWorkerSupported: serviceWorkerTimerLogic.isServiceWorkerSupported
  }
  
  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  )
} 