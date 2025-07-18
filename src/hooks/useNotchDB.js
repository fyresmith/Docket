import { useState, useEffect } from 'react'

export function useNotchDB() {
  const [db, setDb] = useState(null)
  const [notches, setNotches] = useState([])
  const [timers, setTimers] = useState([])
  const [categories, setCategories] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [isDbReady, setIsDbReady] = useState(false)
  const [dbError, setDbError] = useState(null)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)

  // Default categories with predefined colors
  const defaultCategories = [
    { id: 'work', name: 'Work', color: '#3B82F6', isDefault: true },
    { id: 'school', name: 'School', color: '#10B981', isDefault: true },
    { id: 'fun', name: 'Fun', color: '#F59E0B', isDefault: true }
  ]

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('🚀 Initializing DocketDB...')
        
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open('DocketApp', 8) // Increment to 8 for new timestamp and status fields
          
          request.onerror = (event) => {
            console.error('❌ Failed to open Docket database:', event.target.error)
            reject(new Error('Failed to initialize database: ' + event.target.error?.message))
          }
          
          request.onsuccess = () => {
            const db = request.result
            console.log('✅ Database opened successfully! Version:', db.version)
            console.log('📊 Available stores:', Array.from(db.objectStoreNames))
            resolve(db)
          }
          
          request.onupgradeneeded = (event) => {
            console.log('🔄 Database upgrade/creation needed')
            const db = event.target.result
            const transaction = event.target.transaction
            
            // Handle notches store
            let notchStore;
            if (!db.objectStoreNames.contains('notches')) {
              console.log('📁 Creating notches store')
              notchStore = db.createObjectStore('notches', { keyPath: 'id' })
            } else {
              notchStore = transaction.objectStore('notches')
            }
            
            // Ensure all notch indexes exist - including new status and timestamp fields
            const notchIndexes = [
              'date', 'title', 'category', 'categoryName', 'createdAt', 'updatedAt',
              'startTime', 'endTime', 'recurrence', 'status', 'completed_at', 'started_at'
            ];
            
            notchIndexes.forEach(indexName => {
              if (!notchStore.indexNames.contains(indexName)) {
                console.log(`📋 Creating notch index: ${indexName}`)
                notchStore.createIndex(indexName, indexName, { unique: false })
              }
            })

            // Handle categories store
            let categoryStore;
            if (!db.objectStoreNames.contains('categories')) {
              console.log('📁 Creating categories store')
              categoryStore = db.createObjectStore('categories', { keyPath: 'id' })
            } else {
              categoryStore = transaction.objectStore('categories')
            }
            
            // Ensure all category indexes exist - including updatedAt
            const categoryIndexes = ['name', 'isDefault', 'createdAt', 'updatedAt'];
            categoryIndexes.forEach(indexName => {
              if (!categoryStore.indexNames.contains(indexName)) {
                console.log(`📋 Creating category index: ${indexName}`)
                categoryStore.createIndex(indexName, indexName, { unique: false })
              }
            })

            // Handle timers store
            let timerStore;
            if (!db.objectStoreNames.contains('timers')) {
              console.log('📁 Creating timers store')
              timerStore = db.createObjectStore('timers', { keyPath: 'id', autoIncrement: true })
            } else {
              timerStore = transaction.objectStore('timers')
            }
            
            // Ensure all timer indexes exist - including updatedAt and status fields
            const timerIndexes = ['name', 'category', 'notchId', 'isRunning', 'startTime', 'createdAt', 'updatedAt', 'status'];
            timerIndexes.forEach(indexName => {
              if (!timerStore.indexNames.contains(indexName)) {
                console.log(`📋 Creating timer index: ${indexName}`)
                timerStore.createIndex(indexName, indexName, { unique: false })
              }
            })

            // Handle user profile store
            let profileStore;
            if (!db.objectStoreNames.contains('userProfile')) {
              console.log('📁 Creating userProfile store')
              profileStore = db.createObjectStore('userProfile', { keyPath: 'id' })
            } else {
              profileStore = transaction.objectStore('userProfile')
            }
            
            // Ensure all profile indexes exist
            const profileIndexes = ['firstName', 'lastName', 'workHours', 'createdAt', 'updatedAt'];
            profileIndexes.forEach(indexName => {
              if (!profileStore.indexNames.contains(indexName)) {
                console.log(`📋 Creating profile index: ${indexName}`)
                profileStore.createIndex(indexName, indexName, { unique: false })
              }
            })
            
            console.log('✅ Database schema created/updated successfully')
          }
        })
        
        // Set database and load data
        setDb(database)
        setDbError(null)
        const [notches, categories, timers, profile] = await Promise.all([
          loadNotches(database),
          loadCategories(database),
          loadTimers(database),
          loadUserProfile(database)
        ])
        
        // Check if this is a first-time user
        const isNewUser = !profile && notches.length === 0 && timers.length === 0
        setIsFirstTimeUser(isNewUser)
        
        // Mark database as ready only after all data is loaded
        setIsDbReady(true)
        console.log('🎯 Unified database is now ready for all operations!')
        console.log('👤 First-time user:', isNewUser)
        
      } catch (error) {
        console.error('❌ Error initializing database:', error)
        setDbError('Database initialization failed: ' + error.message)
        setIsDbReady(false)
        setIsCategoriesLoading(false)
      }
    }
    
    initDB()
  }, [])

  // Helper function to get current timestamp
  const getCurrentTimestamp = () => new Date().toISOString()

  // Helper function to ensure required timestamps exist on any record
  const ensureTimestamps = (record, isUpdate = false) => {
    const now = getCurrentTimestamp()
    
    return {
      ...record,
      createdAt: record.createdAt || now,
      updatedAt: isUpdate ? now : (record.updatedAt || now)
    }
  }

  // Helper function to set notch status based on current time
  const calculateNotchStatus = (notch) => {
    // Don't auto-calculate status if it's already been manually set to completed/cancelled
    if (notch.status === 'completed' || notch.status === 'cancelled') {
      return notch.status
    }

    const now = new Date()
    const notchDate = new Date(notch.date)
    const [startHour, startMin] = notch.startTime.split(':').map(Number)
    const [endHour, endMin] = notch.endTime.split(':').map(Number)
    
    const startTime = new Date(notchDate)
    startTime.setHours(startHour, startMin, 0, 0)
    
    const endTime = new Date(notchDate)
    endTime.setHours(endHour, endMin, 0, 0)
    
    if (now < startTime) {
      return 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      return 'ongoing'
    } else {
      // Past the end time - check if it was completed
      return notch.completed_at ? 'completed' : 'missed'
    }
  }

  const loadNotches = async (database) => {
    if (!database) return
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Loading notches from database...')
        const transaction = database.transaction(['notches'], 'readonly')
        const store = transaction.objectStore('notches')
        const request = store.getAll()
        
        request.onsuccess = () => {
          console.log('✅ Loaded notches from database:', request.result.length, 'notches')
          console.log('📋 Notch details:', request.result)
          setNotches(request.result)
          setIsDbReady(true)
          console.log('🎯 Database is now ready for operations!')
          resolve(request.result)
        }
        
        request.onerror = () => {
          console.error('❌ Error loading notches from database:', request.error)
          const errorMsg = 'Failed to load notches: ' + request.error?.message
          setDbError(errorMsg)
          setIsDbReady(false)
          reject(new Error(errorMsg))
        }
      } catch (error) {
        console.error('❌ Error in loadNotches:', error)
        const errorMsg = 'Failed to load notches: ' + error.message
        setDbError(errorMsg)
        setIsDbReady(false)
        reject(new Error(errorMsg))
      }
    })
  }

  const loadCategories = async (database) => {
    if (!database) return
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Loading categories from database...')
        const transaction = database.transaction(['categories'], 'readonly')
        const store = transaction.objectStore('categories')
        const request = store.getAll()
        
        request.onsuccess = () => {
          const storedCategories = request.result
          console.log('✅ Loaded categories from database:', storedCategories.length, 'categories')
          
          // If no categories exist, initialize with defaults
          if (storedCategories.length === 0) {
            initializeDefaultCategories(database).then(() => {
              setIsCategoriesLoading(false)
              resolve(defaultCategories)
            }).catch(reject)
          } else {
            setCategories(storedCategories)
            setIsCategoriesLoading(false)
            resolve(storedCategories)
          }
        }
        
        request.onerror = () => {
          console.error('❌ Error loading categories from database:', request.error)
          setCategories(defaultCategories)
          setIsCategoriesLoading(false)
          resolve(defaultCategories)
        }
      } catch (error) {
        console.error('❌ Error in loadCategories:', error)
        setCategories(defaultCategories)
        setIsCategoriesLoading(false)
        resolve(defaultCategories)
      }
    })
  }

  const loadTimers = async (database) => {
    if (!database) return
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Loading timers from database...')
        const transaction = database.transaction(['timers'], 'readonly')
        const store = transaction.objectStore('timers')
        const request = store.getAll()
        
        request.onsuccess = () => {
          console.log('✅ Loaded timers from database:', request.result.length, 'timers')
          setTimers(request.result)
          resolve(request.result)
        }
        
        request.onerror = () => {
          console.error('❌ Error loading timers from database:', request.error)
          resolve([])
        }
      } catch (error) {
        console.error('❌ Error in loadTimers:', error)
        resolve([])
      }
    })
  }

  const loadUserProfile = async (database) => {
    if (!database) return null
    
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Loading user profile from database...')
        const transaction = database.transaction(['userProfile'], 'readonly')
        const store = transaction.objectStore('userProfile')
        const request = store.get('main') // Single profile with ID 'main'
        
        request.onsuccess = () => {
          const profile = request.result
          console.log('✅ Loaded user profile from database:', profile ? 'found' : 'not found')
          setUserProfile(profile || null)
          resolve(profile || null)
        }
        
        request.onerror = () => {
          console.error('❌ Error loading user profile from database:', request.error)
          resolve(null)
        }
      } catch (error) {
        console.error('❌ Error in loadUserProfile:', error)
        resolve(null)
      }
    })
  }

  const initializeDefaultCategories = async (database) => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Initializing default categories...')
        const transaction = database.transaction(['categories'], 'readwrite')
        const store = transaction.objectStore('categories')
        
        defaultCategories.forEach(category => {
          const enrichedCategory = ensureTimestamps({
            ...category,
            syncTimestamp: getCurrentTimestamp()
          }, false)
          store.add(enrichedCategory)
        })
        
        transaction.oncomplete = () => {
          console.log('✅ Default categories initialized')
          setCategories(defaultCategories)
          resolve()
        }
        
        transaction.onerror = () => {
          console.error('❌ Error initializing default categories')
          setCategories(defaultCategories)
          reject(new Error('Failed to initialize default categories'))
        }
      } catch (error) {
        console.error('❌ Error in initializeDefaultCategories:', error)
        setCategories(defaultCategories)
        reject(error)
      }
    })
  }

  // Helper function to check if a recurring notch should appear on a specific date
  const doesRecurringNotchApplyToDate = (notch, targetDate) => {
    if (!notch.recurrence || notch.recurrence.type !== 'weekly') {
      return false
    }

    const notchStartDate = new Date(notch.date)
    const targetDateObj = new Date(targetDate)
    
    // Target date must be on or after the notch start date
    if (targetDateObj < notchStartDate) {
      return false
    }

    // Check if target date's day of week matches any of the recurrence days
    const targetDayOfWeek = targetDateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
    return notch.recurrence.days.includes(targetDayOfWeek)
  }

  // Generate a notch instance for a specific date (for recurring notches)
  const generateNotchInstanceForDate = (originalNotch, targetDate) => {
    return {
      ...originalNotch,
      id: `${originalNotch.id}-${targetDate.toISOString().split('T')[0]}`, // Unique ID for this instance
      date: targetDate.toISOString(),
      isRecurringInstance: true,
      originalNotchId: originalNotch.id
    }
  }

  const addNotch = async (notchData) => {
    if (!db) {
      const errorMsg = dbError ? 
        `Database not initialized: ${dbError}` : 
        'Database is still initializing. Please wait a moment and try again.'
      console.error('❌ Database not ready:', errorMsg)
      throw new Error(errorMsg)
    }
    
    if (!isDbReady) {
      const errorMsg = 'Database is not ready yet. Please wait a moment and try again.'
      console.error('❌ Database not ready:', errorMsg)
      throw new Error(errorMsg)
    }
    
    try {
      // Ensure timestamps and status are set
      const enrichedNotchData = ensureTimestamps(notchData, false)
      
      // Set initial status and sync timestamp
      enrichedNotchData.status = enrichedNotchData.status || calculateNotchStatus(enrichedNotchData)
      enrichedNotchData.syncTimestamp = getCurrentTimestamp() // For Google Drive reconciliation
      
      console.log('📝 STORING NOTCH TO INDEXEDDB:')
      console.log('====================================')
      console.log('Basic Info:', {
        id: enrichedNotchData.id,
        title: enrichedNotchData.title,
        date: enrichedNotchData.date,
        startTime: enrichedNotchData.startTime,
        endTime: enrichedNotchData.endTime,
        status: enrichedNotchData.status
      })
      console.log('Category Info:', {
        category: enrichedNotchData.category,
        categoryName: enrichedNotchData.categoryName,
        categoryColor: enrichedNotchData.categoryColor
      })
      console.log('Timestamps:', {
        createdAt: enrichedNotchData.createdAt,
        updatedAt: enrichedNotchData.updatedAt,
        syncTimestamp: enrichedNotchData.syncTimestamp,
        completed_at: enrichedNotchData.completed_at,
        started_at: enrichedNotchData.started_at
      })
      console.log('Additional Data:', {
        notes: enrichedNotchData.notes
      })
      if (enrichedNotchData.recurrence) {
        console.log('🔄 RECURRENCE DATA:', {
          type: enrichedNotchData.recurrence.type,
          days: enrichedNotchData.recurrence.days,
          dayNames: enrichedNotchData.recurrence.days.map(d => 
            ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
          ),
          startDate: new Date(enrichedNotchData.date).toDateString(),
          note: 'This notch will appear on selected days starting from the date above'
        })
      } else {
        console.log('📅 NON-RECURRING: One-time event on', new Date(enrichedNotchData.date).toDateString())
      }
      console.log('====================================')
      
      // Validate required fields
      if (!enrichedNotchData.title || !enrichedNotchData.date || !enrichedNotchData.startTime || !enrichedNotchData.endTime) {
        console.error('❌ Missing required notch fields:', enrichedNotchData)
        throw new Error('Missing required fields: title, date, startTime, endTime')
      }

      // Validate recurrence data if present
      if (enrichedNotchData.recurrence) {
        if (enrichedNotchData.recurrence.type !== 'weekly') {
          throw new Error('Only weekly recurrence is currently supported')
        }
        if (!Array.isArray(enrichedNotchData.recurrence.days) || enrichedNotchData.recurrence.days.length === 0) {
          throw new Error('Recurrence days must be a non-empty array')
        }
        const invalidDays = enrichedNotchData.recurrence.days.filter(day => 
          typeof day !== 'number' || day < 0 || day > 6
        )
        if (invalidDays.length > 0) {
          throw new Error(`Invalid recurrence days: ${invalidDays.join(', ')}`)
        }
      }

      const transaction = db.transaction(['notches'], 'readwrite')
      const store = transaction.objectStore('notches')
      const request = store.add(enrichedNotchData)
      
      request.onsuccess = () => {
        console.log('✅ Notch saved to IndexedDB successfully!')
        console.log('📊 Total fields stored:', Object.keys(enrichedNotchData).length)
        console.log('🔍 All stored fields:', Object.keys(enrichedNotchData).join(', '))
        
        // Add the new notch to local state
        setNotches(prevNotches => {
          const updatedNotches = [...prevNotches, enrichedNotchData]
          console.log('📋 Total notches in memory:', updatedNotches.length)
          return updatedNotches
        })
      }
      
      request.onerror = () => {
        console.error('❌ Error saving notch to database:', request.error)
        throw new Error('Failed to save notch to database: ' + request.error)
      }
    } catch (error) {
      console.error('❌ Error in addNotch:', error)
      throw error // Re-throw so calling code can handle it
    }
  }

  const updateNotch = async (notch) => {
    if (!db) return
    
    try {
      // Ensure timestamps are updated and preserve existing status unless explicitly changed
      const enrichedNotch = ensureTimestamps(notch, true)
      
      // Update status based on current time if not manually set to completed/cancelled
      if (!enrichedNotch.status || (enrichedNotch.status !== 'completed' && enrichedNotch.status !== 'cancelled')) {
        enrichedNotch.status = calculateNotchStatus(enrichedNotch)
      }
      
      // Update sync timestamp for Google Drive reconciliation
      enrichedNotch.syncTimestamp = getCurrentTimestamp()
      
      console.log('📝 UPDATING NOTCH IN INDEXEDDB:')
      console.log('====================================')
      console.log('Notch ID:', enrichedNotch.id)
      console.log('Status:', enrichedNotch.status)
      console.log('Timestamps:', {
        createdAt: enrichedNotch.createdAt,
        updatedAt: enrichedNotch.updatedAt,
        syncTimestamp: enrichedNotch.syncTimestamp,
        completed_at: enrichedNotch.completed_at,
        started_at: enrichedNotch.started_at
      })
      console.log('====================================')
      
      const transaction = db.transaction(['notches'], 'readwrite')
      const store = transaction.objectStore('notches')
      const request = store.put(enrichedNotch)
      
      request.onsuccess = () => {
        console.log('✅ Notch updated in database:', enrichedNotch)
        // Update the notch in local state
        setNotches(prevNotches => 
          prevNotches.map(n => n.id === enrichedNotch.id ? enrichedNotch : n)
        )
      }
      
      request.onerror = () => {
        console.error('❌ Error updating notch in database:', request.error)
      }
    } catch (error) {
      console.error('❌ Error in updateNotch:', error)
    }
  }

  const deleteNotch = async (id) => {
    if (!db) return
    
    try {
      const transaction = db.transaction(['notches'], 'readwrite')
      const store = transaction.objectStore('notches')
      const request = store.delete(id)
      
      request.onsuccess = () => {
        console.log('✅ Notch deleted from database:', id)
        // Remove the notch from local state
        setNotches(prevNotches => prevNotches.filter(n => n.id !== id))
      }
      
      request.onerror = () => {
        console.error('❌ Error deleting notch from database:', request.error)
      }
    } catch (error) {
      console.error('❌ Error in deleteNotch:', error)
    }
  }

  // ====== NOTCH STATUS MANAGEMENT ======
  
  const markNotchCompleted = async (notchId) => {
    const notch = notches.find(n => n.id === notchId)
    if (!notch) return false
    
    const updatedNotch = {
      ...notch,
      status: 'completed',
      completed_at: getCurrentTimestamp()
    }
    
    await updateNotch(updatedNotch)
    return true
  }
  
  const markNotchStarted = async (notchId) => {
    const notch = notches.find(n => n.id === notchId)
    if (!notch) return false
    
    const updatedNotch = {
      ...notch,
      status: 'ongoing',
      started_at: getCurrentTimestamp()
    }
    
    await updateNotch(updatedNotch)
    return true
  }
  
  const markNotchCancelled = async (notchId) => {
    const notch = notches.find(n => n.id === notchId)
    if (!notch) return false
    
    const updatedNotch = {
      ...notch,
      status: 'cancelled'
    }
    
    await updateNotch(updatedNotch)
    return true
  }
  
  // Get notches by status
  const getNotchesByStatus = (status) => {
    return notches.filter(notch => notch.status === status)
  }
  
  const getCompletedNotches = () => getNotchesByStatus('completed')
  const getMissedNotches = () => getNotchesByStatus('missed')
  const getUpcomingNotches = () => getNotchesByStatus('upcoming')
  const getOngoingNotches = () => getNotchesByStatus('ongoing')

  const getNotchesByDate = (date) => {
    const targetDate = new Date(date)
    const dateString = targetDate.toDateString()
    
    console.log('🔍 GETTING NOTCHES FOR DATE:', dateString)
    console.log('📊 Total stored notches:', notches.length)
    
    const allNotchesForDate = []
    let directMatches = 0
    let recurringMatches = 0

    notches.forEach((notch, index) => {
      console.log(`\n📋 Checking notch ${index + 1}:`, notch.title)
      
      // Direct date match (non-recurring or one-time notches)
      const notchDate = new Date(notch.date)
      if (notchDate.toDateString() === dateString) {
        console.log('✅ Direct date match:', notch.title, 'on', dateString)
        allNotchesForDate.push(notch)
        directMatches++
      }
      // Recurring notch that applies to this date
      else if (notch.recurrence && doesRecurringNotchApplyToDate(notch, targetDate)) {
        console.log('🔄 Recurring notch applies:', notch.title)
        console.log('   📅 Original date:', notchDate.toDateString())
        console.log('   🗓️  Target date:', dateString)
        console.log('   📆 Target day of week:', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][targetDate.getDay()])
        console.log('   ✅ Matches recurrence days:', notch.recurrence.days.map(d => 
          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
        ).join(', '))
        
        const instance = generateNotchInstanceForDate(notch, targetDate)
        allNotchesForDate.push(instance)
        recurringMatches++
      } else if (notch.recurrence) {
        console.log('❌ Recurring notch does not apply:')
        console.log('   📅 Original date:', notchDate.toDateString())
        console.log('   🗓️  Target date:', dateString)
        console.log('   📆 Target day:', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][targetDate.getDay()])
        console.log('   ❌ Does not match recurrence days:', notch.recurrence.days.map(d => 
          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
        ).join(', '))
        
        if (targetDate < notchDate) {
          console.log('   📅 Target date is before start date')
        }
      } else {
        console.log('📝 Non-recurring notch on different date:', notchDate.toDateString())
      }
    })
    
    // Sort by start time
    allNotchesForDate.sort((a, b) => {
      const [aHour, aMin] = a.startTime.split(':').map(Number)
      const [bHour, bMin] = b.startTime.split(':').map(Number)
      const aMinutes = aHour * 60 + aMin
      const bMinutes = bHour * 60 + bMin
      return aMinutes - bMinutes
    })
    
    console.log('\n📋 FINAL RESULTS FOR', dateString + ':')
    console.log('   📅 Direct matches:', directMatches)
    console.log('   🔄 Recurring matches:', recurringMatches)
    console.log('   📊 Total notches:', allNotchesForDate.length)
    
    if (allNotchesForDate.length > 0) {
      console.log('   🕒 Schedule for the day:')
      allNotchesForDate.forEach((notch, i) => {
        const indicator = notch.isRecurringInstance ? '🔄' : '📅'
        console.log(`     ${i + 1}. ${indicator} ${notch.startTime}-${notch.endTime}: ${notch.title}`)
      })
    } else {
      console.log('   📭 No notches scheduled for this date')
    }
    
    return allNotchesForDate
  }

  const getNotchesByDateRange = (startDate, endDate) => {
    const notchesInRange = []
    
    // Get all notches in the date range, including recurring instances
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayNotches = getNotchesByDate(currentDate)
      notchesInRange.push(...dayNotches)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return notchesInRange
  }

  // Get all recurring notches
  const getRecurringNotches = () => {
    return notches.filter(notch => notch.recurrence && notch.recurrence.type === 'weekly')
  }

  // Get notches by category
  const getNotchesByCategory = (categoryId) => {
    return notches.filter(notch => notch.category === categoryId)
  }

  // ====== CATEGORY MANAGEMENT ======
  
  const addCategory = async (categoryData) => {
    if (!db) {
      const errorMsg = dbError ? 
        `Database not initialized: ${dbError}` : 
        'Database is still initializing. Please wait a moment and try again.'
      console.error('❌ Database not ready for category:', errorMsg)
      throw new Error(errorMsg)
    }
    
    if (!isDbReady || isCategoriesLoading) {
      const errorMsg = 'Database is not ready yet. Please wait a moment and try again.'
      console.error('❌ Database not ready for category:', errorMsg)
      throw new Error(errorMsg)
    }
    
    // Check for duplicate names
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === categoryData.name.toLowerCase()
    )
    
    if (existingCategory) {
      throw new Error('A category with this name already exists')
    }
    
    try {
      const newCategory = ensureTimestamps({
        id: Date.now().toString(),
        name: categoryData.name,
        color: categoryData.color,
        isDefault: false,
        syncTimestamp: getCurrentTimestamp() // For Google Drive reconciliation
      }, false)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite')
        const store = transaction.objectStore('categories')
        const request = store.add(newCategory)
        
        request.onsuccess = () => {
          console.log('✅ Category saved to database:', newCategory)
          setCategories(prevCategories => [...prevCategories, newCategory])
          resolve(newCategory)
        }
        
        request.onerror = () => {
          console.error('❌ Error saving category to database:', request.error)
          reject(new Error('Failed to save category to database'))
        }

        transaction.onerror = () => {
          console.error('❌ Transaction error:', transaction.error)
          reject(new Error('Database transaction failed'))
        }
      })
    } catch (error) {
      console.error('❌ Error in addCategory:', error)
      throw error
    }
  }

  const updateCategory = async (categoryId, updates) => {
    if (!db || !isDbReady || isCategoriesLoading) return false
    
    const categoryToUpdate = categories.find(cat => cat.id === categoryId)
    if (!categoryToUpdate) return false
    
    // Don't allow updating default categories' core properties
    if (categoryToUpdate.isDefault && (updates.name || updates.isDefault !== undefined)) {
      console.error('Cannot modify name or default status of default categories')
      return false
    }
    
    try {
      const updatedCategory = ensureTimestamps({
        ...categoryToUpdate,
        ...updates,
        syncTimestamp: getCurrentTimestamp() // For Google Drive reconciliation
      }, true)

      const transaction = db.transaction(['categories'], 'readwrite')
      const store = transaction.objectStore('categories')
      const request = store.put(updatedCategory)
      
      request.onsuccess = () => {
        setCategories(prevCategories => 
          prevCategories.map(cat => cat.id === categoryId ? updatedCategory : cat)
        )
      }
      
      return true
    } catch (error) {
      console.error('Error updating category:', error)
      return false
    }
  }

  const deleteCategory = async (categoryId) => {
    if (!db || !isDbReady || isCategoriesLoading) return false
    
    const categoryToDelete = categories.find(cat => cat.id === categoryId)
    if (!categoryToDelete) return false
    
    // Don't allow deleting default categories
    if (categoryToDelete.isDefault) {
      console.error('Cannot delete default categories')
      return false
    }
    
    try {
      const transaction = db.transaction(['categories'], 'readwrite')
      const store = transaction.objectStore('categories')
      const request = store.delete(categoryId)
      
      request.onsuccess = () => {
        setCategories(prevCategories => 
          prevCategories.filter(cat => cat.id !== categoryId)
        )
      }
      
      return true
    } catch (error) {
      console.error('Error deleting category:', error)
      return false
    }
  }

  const getCategoryById = (id) => {
    return categories.find(cat => cat.id === id)
  }

  const getCategoryByName = (name) => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase())
  }

  // ====== TIMER MANAGEMENT ======
  
  const addTimer = async (timerData) => {
    if (!db || !isDbReady) {
      throw new Error('Database is not ready yet. Please wait a moment and try again.')
    }
    
    try {
      // Ensure timestamps and status are set for timer
      const enrichedTimerData = ensureTimestamps({
        ...timerData,
        status: timerData.status || 'ready', // ready, running, paused, completed
        syncTimestamp: getCurrentTimestamp() // For Google Drive reconciliation
      }, false)
      
      console.log('📝 STORING TIMER TO INDEXEDDB:')
      console.log('Timer data:', enrichedTimerData)
      
      const transaction = db.transaction(['timers'], 'readwrite')
      const store = transaction.objectStore('timers')
      const request = store.add(enrichedTimerData)
      
      request.onsuccess = () => {
        // Add the new timer to local state with the generated ID
        const newTimer = { ...enrichedTimerData, id: request.result }
        setTimers(prevTimers => [...prevTimers, newTimer])
        console.log('✅ Timer saved to database:', newTimer)
      }
      
      request.onerror = () => {
        console.error('❌ Error saving timer to database:', request.error)
        throw new Error('Failed to save timer to database')
      }
    } catch (error) {
      console.error('❌ Error in addTimer:', error)
      throw error
    }
  }

  const updateTimer = async (timer) => {
    if (!db || !isDbReady) return
    
    try {
      // Ensure timestamps are updated for timer
      const enrichedTimer = ensureTimestamps({
        ...timer,
        syncTimestamp: getCurrentTimestamp() // For Google Drive reconciliation
      }, true)
      
      console.log('📝 UPDATING TIMER IN INDEXEDDB:')
      console.log('Timer ID:', enrichedTimer.id, 'Status:', enrichedTimer.status)
      
      const transaction = db.transaction(['timers'], 'readwrite')
      const store = transaction.objectStore('timers')
      const request = store.put(enrichedTimer)
      
      request.onsuccess = () => {
        // Update the timer in local state
        setTimers(prevTimers => 
          prevTimers.map(t => t.id === enrichedTimer.id ? enrichedTimer : t)
        )
        console.log('✅ Timer updated in database:', enrichedTimer.id)
      }
      
      request.onerror = () => {
        console.error('❌ Error updating timer in database:', request.error)
      }
    } catch (error) {
      console.error('❌ Error in updateTimer:', error)
    }
  }

  const deleteTimer = async (id) => {
    if (!db || !isDbReady) return
    
    try {
      const transaction = db.transaction(['timers'], 'readwrite')
      const store = transaction.objectStore('timers')
      const request = store.delete(id)
      
      request.onsuccess = () => {
        // Remove the timer from local state
        setTimers(prevTimers => prevTimers.filter(t => t.id !== id))
        console.log('✅ Timer deleted from database:', id)
      }
      
      request.onerror = () => {
        console.error('❌ Error deleting timer from database:', request.error)
      }
    } catch (error) {
      console.error('❌ Error in deleteTimer:', error)
    }
  }

  // ====== USER PROFILE MANAGEMENT ======
  
  const saveUserProfile = async (profileData) => {
    if (!db || !isDbReady) {
      throw new Error('Database is not ready yet. Please wait a moment and try again.')
    }
    
    try {
      console.log('💾 SAVING USER PROFILE TO DATABASE:')
      console.log('====================================')
      console.log('Received profile data:', profileData)
      console.log('Profile data keys:', Object.keys(profileData))
      console.log('First Name:', profileData.firstName || 'NOT PROVIDED')
      console.log('Last Name:', profileData.lastName || 'NOT PROVIDED')
      console.log('Work Hours:', profileData.workHours || 'NOT PROVIDED')
      console.log('Work Days:', profileData.workDays || 'NOT PROVIDED')
      console.log('Permissions:', profileData.permissions || 'NOT PROVIDED')
      console.log('====================================')
      
      const profile = {
        id: 'main', // Single profile with ID 'main'
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      console.log('🗄️ Final profile object to store:')
      console.log('Profile object keys:', Object.keys(profile))
      console.log('Full profile object:', profile)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['userProfile'], 'readwrite')
        const store = transaction.objectStore('userProfile')
        const request = store.put(profile) // Use put to allow updates
        
        request.onsuccess = () => {
          console.log('✅ User profile saved to database successfully!')
          console.log('📊 Total fields stored:', Object.keys(profile).length)
          console.log('🔍 All stored fields:', Object.keys(profile).join(', '))
          setUserProfile(profile)
          setIsFirstTimeUser(false) // No longer a first-time user
          
          // Verify the data was actually stored by reading it back
          setTimeout(() => {
            const verifyTransaction = db.transaction(['userProfile'], 'readonly')
            const verifyStore = verifyTransaction.objectStore('userProfile')
            const verifyRequest = verifyStore.get('main')
            
            verifyRequest.onsuccess = () => {
              const storedProfile = verifyRequest.result
              console.log('🔍 VERIFICATION - Reading back stored profile:')
              console.log('Stored profile:', storedProfile)
              console.log('Stored firstName:', storedProfile?.firstName || 'NOT FOUND')
              console.log('Stored lastName:', storedProfile?.lastName || 'NOT FOUND')
              console.log('Stored workHours:', storedProfile?.workHours || 'NOT FOUND')
              console.log('Stored workDays:', storedProfile?.workDays || 'NOT FOUND')
            }
          }, 100)
          
          resolve(profile)
        }
        
        request.onerror = () => {
          console.error('❌ Error saving user profile to database:', request.error)
          reject(new Error('Failed to save user profile to database'))
        }

        transaction.onerror = () => {
          console.error('❌ Transaction error:', transaction.error)
          reject(new Error('Database transaction failed'))
        }
      })
    } catch (error) {
      console.error('❌ Error in saveUserProfile:', error)
      throw error
    }
  }

  const updateUserProfile = async (updates) => {
    if (!db || !isDbReady || !userProfile) return false
    
    try {
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['userProfile'], 'readwrite')
        const store = transaction.objectStore('userProfile')
        const request = store.put(updatedProfile)
        
        request.onsuccess = () => {
          console.log('✅ User profile updated in database:', updatedProfile)
          setUserProfile(updatedProfile)
          resolve(updatedProfile)
        }
        
        request.onerror = () => {
          console.error('❌ Error updating user profile in database:', request.error)
          reject(new Error('Failed to update user profile'))
        }
      })
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error)
      return false
    }
  }

  return {
    // Database state
    isDbReady,
    dbError,
    isFirstTimeUser,
    
    // User Profile
    userProfile,
    saveUserProfile,
    updateUserProfile,
    
    // Notches
    notches,
    addNotch,
    updateNotch,
    deleteNotch,
    getNotchesByDate,
    getNotchesByDateRange,
    getRecurringNotches,
    getNotchesByCategory,
    
    // Notch Status Management
    markNotchCompleted,
    markNotchStarted,
    markNotchCancelled,
    getNotchesByStatus,
    getCompletedNotches,
    getMissedNotches,
    getUpcomingNotches,
    getOngoingNotches,
    
    // Categories
    categories,
    isCategoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryByName,
    
    // Timers
    timers,
    addTimer,
    updateTimer,
    deleteTimer,
    
    // Utility functions for sync
    getCurrentTimestamp,
    calculateNotchStatus
  }
} 