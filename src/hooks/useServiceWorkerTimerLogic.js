import { useState, useEffect, useRef, useCallback } from 'react'
import { timerServiceWorker } from '../services/timerServiceWorker'

export function useServiceWorkerTimerLogic(timers, updateTimer) {
  const [runningTimers, setRunningTimers] = useState(new Set())
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)
  const timersRef = useRef(timers)
  const updateTimerRef = useRef(updateTimer)
  const syncedRef = useRef(false)

  // Keep refs updated
  useEffect(() => {
    timersRef.current = timers
  }, [timers])

  useEffect(() => {
    updateTimerRef.current = updateTimer
  }, [updateTimer])

  // Initialize service worker and sync timer data
  useEffect(() => {
    const initializeServiceWorker = async () => {
      // Wait for service worker to be ready
      while (!timerServiceWorker.isServiceWorkerReady()) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setServiceWorkerReady(true)
      console.log('Service worker ready for timer management')
      
      // Load persisted running timers from localStorage
      try {
        const stored = localStorage.getItem('pomodoro-running-timers')
        if (stored && timers.length > 0) {
          const runningData = JSON.parse(stored)
          const runningIds = new Set()
          
          // Sync with service worker
          Object.keys(runningData).forEach(timerId => {
            runningIds.add(parseInt(timerId))
          })
          
          if (runningIds.size > 0) {
            console.log('Syncing running timers with service worker:', runningIds)
            setRunningTimers(runningIds)
            await timerServiceWorker.syncTimerData(timers, runningIds)
            syncedRef.current = true
          }
        }
      } catch (error) {
        console.error('Error initializing service worker timers:', error)
      }
    }

    if (timers.length > 0) {
      initializeServiceWorker()
    }
  }, [timers.length > 0])

  // Handle service worker timer updates
  useEffect(() => {
    if (!serviceWorkerReady) return

    const handleTimerUpdate = (timerUpdates) => {
      console.log('Received timer updates from service worker:', timerUpdates)
      
      timerUpdates.forEach(timerUpdate => {
        const timer = timersRef.current.find(t => t.id === timerUpdate.timerId)
        if (timer) {
          // Update timer with new time left
          updateTimerRef.current({
            ...timer,
            timeLeft: timerUpdate.timeLeft
          })
        }
      })
    }

    const handleTimerCompleted = ({ timerId, timer }) => {
      console.log('Timer completed in service worker:', timerId, timer.name)
      
      // Update the timer to completed state
      const existingTimer = timersRef.current.find(t => t.id === timerId)
      if (existingTimer) {
        updateTimerRef.current({
          ...existingTimer,
          timeLeft: 0
        })
      }
      
      // Remove from running timers
      setRunningTimers(prev => {
        const newSet = new Set(prev)
        newSet.delete(timerId)
        
        // Update localStorage
        try {
          const stored = localStorage.getItem('pomodoro-running-timers')
          if (stored) {
            const runningData = JSON.parse(stored)
            delete runningData[timerId]
            localStorage.setItem('pomodoro-running-timers', JSON.stringify(runningData))
          }
        } catch (error) {
          console.error('Error updating localStorage:', error)
        }
        
        return newSet
      })
      
      // Play notification sound as fallback
      try {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {
          console.log('Audio notification blocked')
        })
      } catch (error) {
        console.error('Error playing notification sound:', error)
      }
    }

    const handleFocusTimer = ({ timerId, notchId }) => {
      console.log('Focus timer request from service worker:', { timerId, notchId })
      // This could be used to navigate to the timer or notch
      // For now, just log it
    }

    // Register service worker event listeners
    timerServiceWorker.on('timerUpdate', handleTimerUpdate)
    timerServiceWorker.on('timerCompleted', handleTimerCompleted)
    timerServiceWorker.on('focusTimer', handleFocusTimer)

    return () => {
      timerServiceWorker.off('timerUpdate', handleTimerUpdate)
      timerServiceWorker.off('timerCompleted', handleTimerCompleted)
      timerServiceWorker.off('focusTimer', handleFocusTimer)
    }
  }, [serviceWorkerReady])

  const startTimer = useCallback(async (timerId) => {
    if (!serviceWorkerReady) {
      console.warn('Service worker not ready, cannot start timer')
      return
    }

    try {
      const timer = timersRef.current.find(t => t.id === timerId)
      if (!timer) {
        console.error('Timer not found:', timerId)
        return
      }

      console.log('Starting timer in service worker:', timer)
      
      // Start timer in service worker
      await timerServiceWorker.startTimer(
        timerId,
        timer.duration,
        timer.name,
        timer.notchId
      )
      
      // Update local state
      setRunningTimers(prev => new Set([...prev, timerId]))
      
      // Update localStorage for persistence
      const stored = localStorage.getItem('pomodoro-running-timers')
      const runningData = stored ? JSON.parse(stored) : {}
      runningData[timerId] = Date.now()
      localStorage.setItem('pomodoro-running-timers', JSON.stringify(runningData))
      
      console.log('Timer started successfully in service worker')
    } catch (error) {
      console.error('Error starting timer in service worker:', error)
    }
  }, [serviceWorkerReady])

  const stopTimer = useCallback(async (timerId) => {
    if (!serviceWorkerReady) {
      console.warn('Service worker not ready, cannot stop timer')
      return
    }

    try {
      console.log('Stopping timer in service worker:', timerId)
      
      // Stop timer in service worker
      await timerServiceWorker.stopTimer(timerId)
      
      // Update local state
      setRunningTimers(prev => {
        const newSet = new Set(prev)
        newSet.delete(timerId)
        return newSet
      })
      
      // Update localStorage
      const stored = localStorage.getItem('pomodoro-running-timers')
      if (stored) {
        const runningData = JSON.parse(stored)
        delete runningData[timerId]
        localStorage.setItem('pomodoro-running-timers', JSON.stringify(runningData))
      }
      
      console.log('Timer stopped successfully in service worker')
    } catch (error) {
      console.error('Error stopping timer in service worker:', error)
    }
  }, [serviceWorkerReady])

  const resetTimer = useCallback(async (timer) => {
    if (!serviceWorkerReady) {
      console.warn('Service worker not ready, cannot reset timer')
      return
    }

    try {
      // Stop the timer first
      await stopTimer(timer.id)
      
      // Reset the timer data
      const updatedTimer = { ...timer, timeLeft: timer.duration }
      updateTimerRef.current(updatedTimer)
      
      console.log('Timer reset successfully')
    } catch (error) {
      console.error('Error resetting timer:', error)
    }
  }, [serviceWorkerReady, stopTimer])

  // Get timer status from service worker
  const getTimerStatus = useCallback(async (timerId) => {
    if (!serviceWorkerReady) {
      return { isRunning: false, timeLeft: 0 }
    }

    try {
      const status = await timerServiceWorker.getTimerStatus(timerId)
      return status
    } catch (error) {
      console.error('Error getting timer status from service worker:', error)
      return { isRunning: false, timeLeft: 0 }
    }
  }, [serviceWorkerReady])

  // Fallback to original timer logic if service worker not supported
  const isServiceWorkerSupported = timerServiceWorker.isSupported()

  return {
    runningTimers,
    startTimer,
    stopTimer,
    resetTimer,
    getTimerStatus,
    serviceWorkerReady,
    isServiceWorkerSupported
  }
} 