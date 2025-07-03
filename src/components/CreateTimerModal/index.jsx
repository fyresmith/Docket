import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import TimePicker from '../TimePicker'
import { createTimerData } from '../../utils/timeUtils'
import './style.css'

function CreateTimerModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.name && (formData.hours > 0 || formData.minutes > 0 || formData.seconds > 0)) {
      const timerData = createTimerData(formData)
      onCreate(timerData)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Notch</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Notch Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter Notch name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category (Optional)</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              placeholder="Enter category"
            />
          </div>
          
          <div className="time-picker-section">
            <label className="time-picker-label">Duration</label>
            <div className="time-picker">
              
              <TimePicker
                value={formData.hours}
                onChange={(value) => setFormData({...formData, hours: value})}
                maxValue={25}
                label="Hours"
              />
              
              <div className="time-picker-separator">:</div>
              
              <TimePicker
                value={formData.minutes}
                onChange={(value) => setFormData({...formData, minutes: value})}
                maxValue={60}
                label="Minutes"
              />
              
              <div className="time-picker-separator">:</div>
              
              <TimePicker
                value={formData.seconds}
                onChange={(value) => setFormData({...formData, seconds: value})}
                maxValue={60}
                label="Seconds"
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Notch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTimerModal 