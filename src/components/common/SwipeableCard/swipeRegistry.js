// Global registry for SwipeableCard instances
class SwipeRegistry {
  constructor() {
    this.cards = new Map()
    this.setupGlobalListeners()
  }

  register(id, resetFn) {
    this.cards.set(id, resetFn)
  }

  unregister(id) {
    this.cards.delete(id)
  }

  resetOthers(excludeId) {
    this.cards.forEach((resetFn, id) => {
      if (id !== excludeId) {
        resetFn()
      }
    })
  }

  resetAll() {
    this.cards.forEach((resetFn) => {
      resetFn()
    })
  }

  setupGlobalListeners() {
    // Reset all cards on global interactions
    const handleGlobalInteraction = (e) => {
      // Don't reset if the interaction is within a swipeable card
      const isSwipeableCard = e.target.closest('.swipeable-card-container')
      if (!isSwipeableCard) {
        this.resetAll()
      }
    }

    document.addEventListener('touchstart', handleGlobalInteraction, { passive: true })
    document.addEventListener('mousedown', handleGlobalInteraction)
  }
}

// Export singleton instance
export const swipeRegistry = new SwipeRegistry() 