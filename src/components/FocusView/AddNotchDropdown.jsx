import { FiPlus } from 'react-icons/fi'
import './AddNotchDropdown.css'

function AddNotchDropdown({ isOpen, onClose, onNewNotch, onNewQuickNotch }) {
  if (!isOpen) return null

  return (
    <div className="add-dropdown">
      <button 
        className="add-dropdown-btn top"
        onClick={onNewNotch}
      >
        New Task
      </button>
      <button 
        className="add-dropdown-btn bottom"
        onClick={onNewQuickNotch}
      >
        New Quick Task
      </button>
    </div>
  )
}

export default AddNotchDropdown 