// Timer Service Worker Manager
// Handles communication between main thread and service worker for background timer management

class TimerServiceWorkerManager {
  constructor() {
    this.serviceWorker = null
    this.isReady = false
    this.messageCallbacks = new Map()
    this.messageId = 0
    this.eventListeners = new Map()
    
    this.initialize()
  }

  async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        // Register our custom service worker
        console.log('Registering timer service worker...')
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        console.log('Timer service worker registered:', registration)
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready
        
        // Get the active service worker
        this.serviceWorker = registration.active || registration.installing || registration.waiting
        
        if (!this.serviceWorker) {
          throw new Error('No service worker available')
        }
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this))
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('Service worker update found')
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('New service worker activated, reloading...')
                window.location.reload()
              }
            })
          }
        })
        
        this.isReady = true
        console.log('Timer service worker manager ready')
        
        // Request notification permission
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          console.log('Notification permission:', permission)
        }
        
      } catch (error) {
        console.error('Failed to initialize timer service worker:', error)
        this.isReady = false
      }
    } else {
      console.warn('Service Workers not supported')
      this.isReady = false
    }
  }

  handleServiceWorkerMessage(event) {
    const { type, ...data } = event.data
    
    console.log('Received message from service worker:', type, data)
    
    switch (type) {
      case 'TIMER_UPDATE':
        this.emit('timerUpdate', data.timers)
        break
        
      case 'TIMER_COMPLETED':
        this.emit('timerCompleted', { timerId: data.timerId, timer: data.timer })
        break
        
      case 'FOCUS_TIMER':
        this.emit('focusTimer', { timerId: data.timerId, notchId: data.notchId })
        break
        
      default:
        // Handle callback-based responses
        if (data.messageId && this.messageCallbacks.has(data.messageId)) {
          const callback = this.messageCallbacks.get(data.messageId)
          callback(data)
          this.messageCallbacks.delete(data.messageId)
        }
    }
  }

  // Event emitter pattern for service worker events
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in event listener:', error)
        }
      })
    }
  }

  // Send message to service worker with optional callback
  async sendMessage(type, payload = {}, callback = null) {
    if (!this.isReady || !this.serviceWorker) {
      console.warn('Service worker not ready, cannot send message:', type)
      return Promise.reject(new Error('Service worker not ready'))
    }

    return new Promise((resolve, reject) => {
      const messageId = ++this.messageId
      const channel = new MessageChannel()
      
      // Setup response handler
      channel.port1.onmessage = (event) => {
        const response = event.data
        if (callback) {
          callback(response)
        }
        resolve(response)
      }
      
      // Send message
      const message = { type, payload, messageId }
      console.log('Sending message to service worker:', message)
      
      try {
        this.serviceWorker.postMessage(message, [channel.port2])
      } catch (error) {
        console.error('Error sending message to service worker:', error)
        reject(error)
      }
    })
  }

  // Timer control methods
  async startTimer(timerId, duration, name, notchId) {
    console.log('Starting timer via service worker:', { timerId, duration, name, notchId })
    return this.sendMessage('START_TIMER', {
      timerId,
      duration,
      name,
      notchId
    })
  }

  async stopTimer(timerId) {
    console.log('Stopping timer via service worker:', timerId)
    return this.sendMessage('STOP_TIMER', { timerId })
  }

  async getTimerStatus(timerId) {
    return this.sendMessage('GET_TIMER_STATUS', { timerId })
  }

  async getAllTimers() {
    return this.sendMessage('GET_ALL_TIMERS')
  }

  async syncTimerData(timers, runningTimerIds) {
    console.log('Syncing timer data with service worker:', { timers: timers.length, runningTimerIds })
    return this.sendMessage('SYNC_TIMER_DATA', {
      timers,
      runningTimerIds: Array.from(runningTimerIds)
    })
  }

  // Check if service worker is supported and ready
  isSupported() {
    return 'serviceWorker' in navigator
  }

  isServiceWorkerReady() {
    return this.isReady
  }
}

// Create singleton instance
export const timerServiceWorker = new TimerServiceWorkerManager()

// Export class for testing
export { TimerServiceWorkerManager } 