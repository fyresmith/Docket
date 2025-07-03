import { useState, useEffect, useCallback } from 'react'
import { useNotchDB } from './useNotchDB'
import { useTimerLogic } from './useTimerLogic'

export function useNotchTimer() {
  const { timers, addTimer, updateTimer, deleteTimer } = useNotchDB()
  const { runningTimers, startTimer, stopTimer, resetTimer } = useTimerLogic(timers, updateTimer)

  // Find timer associated with a specific notch
  const findTimerForNotch = useCallback((notchId) => {
    console.log('Finding timer for notch:', notchId, 'Available timers:', timers.length)
    const timer = timers.find(timer => timer.notchId === notchId)
    console.log('Found timer:', timer)
    return timer
  }, [timers])

  // Calculate duration from notch times
  const calculateNotchDuration = useCallback((notch) => {
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    
    console.log('Calculating duration:', { startHour, startMin, endHour, endMin })
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    const durationSeconds = durationMinutes * 60
    
    console.log('Duration calculation:', { startMinutes, endMinutes, durationMinutes, durationSeconds })
    
    return durationSeconds
  }, [])

  // Create a timer from a notch (simplified and synchronous)
  const createTimerFromNotch = useCallback(async (notch) => {
    if (!notch) {
      console.error('No notch provided to createTimerFromNotch')
      return null
    }

    console.log('Creating timer from notch:', notch)
    
    const durationSeconds = calculateNotchDuration(notch)
    
    if (durationSeconds <= 0) {
      console.error('Invalid duration calculated:', durationSeconds)
      return null
    }

    const timerData = {
      name: notch.title,
      category: notch.category || 'Notch Timer',
      duration: durationSeconds,
      timeLeft: durationSeconds,
      notchId: notch.id,
      createdAt: new Date().toISOString(),
      fromNotch: true
    }

    console.log('Timer data to create:', timerData)

    try {
      await addTimer(timerData)
      console.log('Timer added to database successfully')
      
      // Return a simple promise that resolves with the timer data plus a temporary ID
      // The real ID will be set when the database updates the timers array
      return { ...timerData, id: `temp-${Date.now()}` }
    } catch (error) {
      console.error('Error creating timer from notch:', error)
      return null
    }
  }, [addTimer, calculateNotchDuration])

  // Start timer for a notch (simplified)
  const startNotchTimer = useCallback(async (notch) => {
    if (!notch) {
      console.error('No notch provided to startNotchTimer')
      return null
    }

    console.log('Starting timer for notch:', notch.id)

    // Check if timer already exists
    let timer = findTimerForNotch(notch.id)
    
    if (!timer) {
      console.log('Timer not found, creating new timer')
      timer = await createTimerFromNotch(notch)
      
      if (!timer) {
        console.error('Failed to create timer for notch')
        return null
      }
    }

    console.log('Starting timer with ID:', timer.id)
    
    // Start the timer
    if (timer.id && !timer.id.toString().startsWith('temp-')) {
      console.log('Starting timer immediately with real ID:', timer.id)
      startTimer(timer.id)
      console.log('Timer started successfully')
    } else {
      // If we have a temp ID, wait a bit for the real timer to be created
      console.log('Waiting for real timer to be created...')
      let attempts = 0
      const maxAttempts = 10
      
      const checkForRealTimer = () => {
        const realTimer = findTimerForNotch(notch.id)
        attempts++
        
        if (realTimer && realTimer.id && !realTimer.id.toString().startsWith('temp-')) {
          console.log('Found real timer after', attempts, 'attempts, starting:', realTimer.id)
          startTimer(realTimer.id)
        } else if (attempts < maxAttempts) {
          console.log('Attempt', attempts, '- real timer not ready yet, retrying...')
          setTimeout(checkForRealTimer, 50)
        } else {
          console.error('Failed to find real timer after', maxAttempts, 'attempts')
        }
      }
      
      setTimeout(checkForRealTimer, 50)
    }
    
    return timer
  }, [findTimerForNotch, createTimerFromNotch, startTimer])

  // Stop timer for a notch
  const stopNotchTimer = useCallback((notchId) => {
    console.log('Stopping timer for notch:', notchId)
    const timer = findTimerForNotch(notchId)
    if (timer && timer.id) {
      console.log('Stopping timer:', timer.id)
      stopTimer(timer.id)
    } else {
      console.log('No timer found to stop for notch:', notchId)
    }
  }, [findTimerForNotch, stopTimer])

  // Reset timer for a notch
  const resetNotchTimer = useCallback((notchId) => {
    console.log('Resetting timer for notch:', notchId)
    const timer = findTimerForNotch(notchId)
    if (timer) {
      console.log('Resetting timer:', timer.id)
      resetTimer(timer)
    } else {
      console.log('No timer found to reset for notch:', notchId)
    }
  }, [findTimerForNotch, resetTimer])

  // Check if notch timer is running
  const isNotchTimerRunning = useCallback((notchId) => {
    const timer = findTimerForNotch(notchId)
    const isRunning = timer ? runningTimers.has(timer.id) : false
    console.log('Checking if timer is running for notch:', notchId, 'Timer:', timer?.id, 'Running:', isRunning)
    return isRunning
  }, [findTimerForNotch, runningTimers])

  // Get timer time remaining for a notch
  const getNotchTimerTimeRemaining = useCallback((notchId) => {
    const timer = findTimerForNotch(notchId)
    const timeLeft = timer ? timer.timeLeft : 0
    console.log('Getting time remaining for notch:', notchId, 'Time left:', timeLeft)
    return timeLeft
  }, [findTimerForNotch])

  // Get timer duration for a notch
  const getNotchTimerDuration = useCallback((notchId) => {
    const timer = findTimerForNotch(notchId)
    const duration = timer ? timer.duration : 0
    console.log('Getting duration for notch:', notchId, 'Duration:', duration)
    return duration
  }, [findTimerForNotch])

  // Delete timer for a notch
  const deleteNotchTimer = useCallback((notchId) => {
    console.log('Deleting timer for notch:', notchId)
    const timer = findTimerForNotch(notchId)
    if (timer) {
      console.log('Deleting timer:', timer.id)
      deleteTimer(timer.id)
    }
  }, [findTimerForNotch, deleteTimer])

  return {
    // Timer data
    timers,
    findTimerForNotch,
    
    // Timer actions
    startNotchTimer,
    stopNotchTimer,
    resetNotchTimer,
    deleteNotchTimer,
    
    // Timer state
    isNotchTimerRunning,
    getNotchTimerTimeRemaining,
    getNotchTimerDuration,
    runningTimers
  }
} 