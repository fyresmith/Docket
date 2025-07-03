import { useState, useRef, useEffect, useCallback } from 'react'
import './style.css'

function TimePickerWheel({ 
  value, 
  onChange, 
  minValue, 
  maxValue, 
  step = 1, 
  itemHeight = 40,
  visibleItems = 3,
  className = ''
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [offsetY, setOffsetY] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const containerRef = useRef(null)
  const itemsRef = useRef(null)
  const animationRef = useRef(null)
  const lastYRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const startYRef = useRef(0)

  // Generate items array
  const items = []
  for (let i = minValue; i <= maxValue; i += step) {
    items.push(i)
  }

  const centerIndex = Math.floor(items.length / 2)
  const selectedIndex = items.indexOf(value)
  const centerOffset = (visibleItems * itemHeight) / 2

  // Initialize position
  useEffect(() => {
    if (itemsRef.current && selectedIndex !== -1) {
      const targetY = -(selectedIndex - centerIndex) * itemHeight
      setOffsetY(targetY)
      itemsRef.current.style.transform = `translateY(${targetY}px)`
    }
  }, [value, selectedIndex, centerIndex, itemHeight])

  // Smooth animation to target position
  const animateToPosition = useCallback((targetY, duration = 400) => {
    if (!itemsRef.current) return
    
    setIsAnimating(true)
    const startY = offsetY
    const startTime = performance.now()
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // iOS-style easing (ease-out-cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentY = startY + (targetY - startY) * easeOut
      
      setOffsetY(currentY)
      if (itemsRef.current) {
        itemsRef.current.style.transform = `translateY(${currentY}px)`
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setOffsetY(targetY)
        if (itemsRef.current) {
          itemsRef.current.style.transform = `translateY(${targetY}px)`
        }
      }
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [offsetY])

  // Calculate snap position
  const getSnapPosition = useCallback((currentOffset) => {
    const snapIndex = Math.round(-currentOffset / itemHeight) + centerIndex
    const clampedIndex = Math.max(0, Math.min(items.length - 1, snapIndex))
    return -(clampedIndex - centerIndex) * itemHeight
  }, [centerIndex, itemHeight, items.length])

  // Handle momentum scrolling
  const handleMomentumScroll = useCallback((initialVelocity) => {
    if (Math.abs(initialVelocity) < 0.5) {
      // Snap immediately if velocity is too low
      const snapPosition = getSnapPosition(offsetY)
      animateToPosition(snapPosition, 300)
      const snapIndex = Math.round(-snapPosition / itemHeight) + centerIndex
      const clampedIndex = Math.max(0, Math.min(items.length - 1, snapIndex))
      onChange(items[clampedIndex])
      return
    }
    
    const deceleration = 0.92
    let currentVelocity = initialVelocity
    let currentOffset = offsetY
    const startTime = performance.now()
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const deltaTime = Math.min(elapsed - (currentTime - startTime), 16) // Cap at 60fps
      
      currentVelocity *= deceleration
      currentOffset += currentVelocity * deltaTime
      
      // Check bounds
      const maxOffset = centerIndex * itemHeight
      const minOffset = -(items.length - 1 - centerIndex) * itemHeight
      
      if (currentOffset > maxOffset) {
        currentOffset = maxOffset
        currentVelocity = 0
      } else if (currentOffset < minOffset) {
        currentOffset = minOffset
        currentVelocity = 0
      }
      
      setOffsetY(currentOffset)
      if (itemsRef.current) {
        itemsRef.current.style.transform = `translateY(${currentOffset}px)`
      }
      
      if (Math.abs(currentVelocity) > 0.5) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Snap to nearest item
        const snapPosition = getSnapPosition(currentOffset)
        animateToPosition(snapPosition, 300)
        const snapIndex = Math.round(-snapPosition / itemHeight) + centerIndex
        const clampedIndex = Math.max(0, Math.min(items.length - 1, snapIndex))
        onChange(items[clampedIndex])
      }
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [offsetY, centerIndex, itemHeight, items.length, getSnapPosition, animateToPosition, onChange])

  // Mouse/Touch event handlers
  const handleStart = useCallback((clientY) => {
    if (isAnimating) return
    
    setIsDragging(true)
    startYRef.current = clientY
    lastYRef.current = clientY
    lastTimeRef.current = performance.now()
    velocityRef.current = 0
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isAnimating])

  const handleMove = useCallback((clientY) => {
    if (!isDragging || isAnimating) return
    
    const currentTime = performance.now()
    const deltaTime = currentTime - lastTimeRef.current
    const deltaY = clientY - lastYRef.current
    
    if (deltaTime > 0) {
      velocityRef.current = deltaY / deltaTime
    }
    
    const newOffsetY = offsetY + deltaY
    setOffsetY(newOffsetY)
    lastYRef.current = clientY
    lastTimeRef.current = currentTime
    
    if (itemsRef.current) {
      itemsRef.current.style.transform = `translateY(${newOffsetY}px)`
    }
  }, [isDragging, isAnimating, offsetY])

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    handleMomentumScroll(velocityRef.current)
  }, [isDragging, handleMomentumScroll])

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    handleStart(e.clientY)
  }, [handleStart])

  const handleMouseMove = useCallback((e) => {
    e.preventDefault()
    handleMove(e.clientY)
  }, [handleMove])

  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Touch events
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    handleStart(touch.clientY)
  }, [handleStart])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientY)
  }, [handleMove])

  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Wheel events
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    
    if (isDragging || isAnimating) return
    
    const deltaY = e.deltaY * 0.8
    const newOffsetY = offsetY + deltaY
    setOffsetY(newOffsetY)
    
    if (itemsRef.current) {
      itemsRef.current.style.transform = `translateY(${newOffsetY}px)`
    }
    
    // Debounced snap
    clearTimeout(window.wheelTimeout)
    window.wheelTimeout = setTimeout(() => {
      const snapPosition = getSnapPosition(newOffsetY)
      animateToPosition(snapPosition, 300)
      const snapIndex = Math.round(-snapPosition / itemHeight) + centerIndex
      const clampedIndex = Math.max(0, Math.min(items.length - 1, snapIndex))
      onChange(items[clampedIndex])
    }, 200)
  }, [isDragging, isAnimating, offsetY, getSnapPosition, animateToPosition, itemHeight, centerIndex, items, onChange])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div 
      className={`time-picker-wheel ${className} ${isDragging ? 'dragging' : ''} ${isAnimating ? 'animating' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="time-picker-wheel-mask">
        <div className="time-picker-wheel-gradient top"></div>
        <div className="time-picker-wheel-gradient bottom"></div>
        
        <div 
          className="time-picker-wheel-items"
          ref={itemsRef}
          style={{ 
            transform: `translateY(${offsetY}px)`,
            transition: isAnimating ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {items.map((item, index) => (
            <div
              key={item}
              className={`time-picker-wheel-item ${value === item ? 'selected' : ''}`}
              style={{ height: itemHeight }}
            >
              {item.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
        
        <div className="time-picker-wheel-selection"></div>
      </div>
    </div>
  )
}

export default TimePickerWheel 