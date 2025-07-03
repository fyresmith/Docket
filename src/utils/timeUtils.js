export const formatTime = (seconds) => {
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const calculateDuration = (hours, minutes, seconds) => {
  return hours * 3600 + minutes * 60 + seconds
}

export const createTimerData = (formData) => {
  const duration = calculateDuration(formData.hours, formData.minutes, formData.seconds)
  return {
    name: formData.name,
    category: formData.category,
    duration: duration,
    timeLeft: duration,
    createdAt: new Date().toISOString()
  }
} 