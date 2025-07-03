import { useState, useEffect, useRef } from 'react'

export function useTimerLogic(timers, updateTimer) {
  const [runningTimers, setRunningTimers] = useState(new Set())
  const intervalRef = useRef(null)
  const timersRef = useRef(timers)
  const updateTimerRef = useRef(updateTimer)
  const STORAGE_KEY = 'pomodoro-running-timers'

  // Keep refs updated
  useEffect(() => {
    timersRef.current = timers
  }, [timers])

  useEffect(() => {
    updateTimerRef.current = updateTimer
  }, [updateTimer])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const showTimerCompleteNotification = (timer) => {
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Notch Complete', {
        body: `${timer.name} has finished!`,
        icon: '/pwa-192x192.png'
      })
    }
    
    // Play notification sound
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {
      console.log('Audio notification blocked')
    })
  }

  // Load running timers from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const runningData = JSON.parse(stored)
        const runningIds = new Set()
        
        // Calculate elapsed time for each running timer and update
        Object.entries(runningData).forEach(([timerId, startTime]) => {
          const timer = timersRef.current.find(t => t.id === parseInt(timerId))
          if (timer && timer.duration) {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
            const newTimeLeft = Math.max(0, timer.duration - elapsedSeconds)
            
            console.log(`Loading timer ${timerId}: elapsed=${elapsedSeconds}s, newTimeLeft=${newTimeLeft}s`)
            
            if (newTimeLeft > 0) {
              runningIds.add(parseInt(timerId))
              // Update timer with calculated time remaining
              updateTimerRef.current({ ...timer, timeLeft: newTimeLeft })
            } else {
              // Timer completed while away - show notification and stop
              updateTimerRef.current({ ...timer, timeLeft: 0 })
              showTimerCompleteNotification(timer)
              // Remove from localStorage
              delete runningData[timerId]
            }
          } else {
            // Timer no longer exists or already completed
            delete runningData[timerId]
          }
        })
        
        // Clean up localStorage and set running state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(runningData))
        setRunningTimers(runningIds)
      }
    } catch (error) {
      console.error('Error loading running timers:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [timers.length > 0]) // Only run when timers are loaded

  // Persistent timer logic - single interval for all timers
  useEffect(() => {
    console.log('Setting up timer interval. Running timers:', runningTimers.size)
    
    if (runningTimers.size > 0) {
      intervalRef.current = setInterval(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return

        try {
          const runningData = JSON.parse(stored)
          console.log('Timer interval tick. Running data:', runningData)
          
          runningTimers.forEach(timerId => {
            const timer = timersRef.current.find(t => t.id === timerId)
            const startTime = runningData[timerId]
            
            if (timer && startTime) {
              const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
              const newTimeLeft = Math.max(0, timer.duration - elapsedSeconds)
              
              console.log(`Timer ${timerId}: elapsed=${elapsedSeconds}s, newTimeLeft=${newTimeLeft}s, duration=${timer.duration}s`)
              
              // Always update timer with real-time calculation
              updateTimerRef.current({ ...timer, timeLeft: newTimeLeft })
              
              // Check if timer completed
              if (newTimeLeft <= 0) {
                console.log(`Timer ${timerId} completed!`)
                stopTimer(timerId)
                showTimerCompleteNotification(timer)
              }
            } else {
              console.log(`Timer ${timerId}: missing timer or startTime`, { timer: !!timer, startTime })
            }
          })
        } catch (error) {
          console.error('Error in timer interval:', error)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        console.log('Clearing timer interval - no running timers')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [runningTimers]) // Removed timers and updateTimer dependencies to prevent recreation loops

  const startTimer = (timerId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const runningData = stored ? JSON.parse(stored) : {}
      
      // Store start time for this timer
      runningData[timerId] = Date.now()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runningData))
      
      setRunningTimers(prev => new Set([...prev, timerId]))
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const stopTimer = (timerId) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const runningData = JSON.parse(stored)
        delete runningData[timerId]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(runningData))
      }
      
      setRunningTimers(prev => {
        const newSet = new Set(prev)
        newSet.delete(timerId)
        return newSet
      })
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  const resetTimer = (timer) => {
    stopTimer(timer.id)
    const updatedTimer = { ...timer, timeLeft: timer.duration }
    updateTimer(updatedTimer)
  }

  return {
    runningTimers,
    startTimer,
    stopTimer,
    resetTimer
  }
} 