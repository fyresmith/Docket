import { useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiTag } from 'react-icons/fi'
import { useNotchDB } from '../../../hooks/useNotchDB'
import './style.css'

const predefinedColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
]

function CategoryManager({ selectedCategory, onCategorySelect, onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useNotchDB()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(predefinedColors[0])
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleStartCreate = () => {
    setIsCreating(true)
    setNewCategoryName('')
    setNewCategoryColor(predefinedColors[0])
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewCategoryName('')
    setNewCategoryColor(predefinedColors[0])
  }

  const handleSaveCreate = async () => {
    if (!newCategoryName.trim()) return
    
    const success = await addCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor
    })
    
    if (success) {
      setIsCreating(false)
      setNewCategoryName('')
      setNewCategoryColor(predefinedColors[0])
    } else {
      // Handle error - category already exists
      alert('A category with this name already exists!')
    }
  }

  const handleStartEdit = (category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    
    const success = await updateCategory(editingId, {
      name: editName.trim(),
      color: editColor
    })
    
    if (success) {
      setEditingId(null)
      setEditName('')
      setEditColor('')
    }
  }

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      await deleteCategory(categoryId)
    }
  }

  const handleCategorySelect = (category) => {
    onCategorySelect(category)
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <h3>
          <FiTag size={16} />
          Manage Categories
        </h3>
        <button 
          className="category-add-btn"
          onClick={handleStartCreate}
          disabled={isCreating}
        >
          <FiPlus size={14} />
          Add Category
        </button>
      </div>

      <div className="category-list">
        {/* Existing Categories */}
        {categories.map(category => (
          <div 
            key={category.id} 
            className={`category-item ${selectedCategory?.id === category.id ? 'selected' : ''}`}
          >
            {editingId === category.id ? (
              // Edit Mode
              <div className="category-edit-form">
                <div className="category-form-row">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="category-name-input"
                    placeholder="Category name"
                    maxLength={20}
                  />
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="color-input"
                    />
                    <div className="color-preview" style={{ backgroundColor: editColor }}></div>
                  </div>
                </div>
                <div className="category-predefined-colors">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      className={`color-option ${editColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="category-edit-actions">
                  <button
                    onClick={handleSaveEdit}
                    className="category-save-btn"
                    disabled={!editName.trim()}
                  >
                    <FiCheck size={14} />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="category-cancel-btn"
                  >
                    <FiX size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <>
                <div 
                  className="category-display"
                  onClick={() => handleCategorySelect(category)}
                >
                  <div 
                    className="category-color" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="category-name">{category.name}</span>
                  {category.isDefault && (
                    <span className="category-default-badge">Default</span>
                  )}
                </div>
                <div className="category-actions">
                  <button
                    onClick={() => handleStartEdit(category)}
                    className="category-edit-btn"
                    title="Edit category"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  {!category.isDefault && (
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="category-delete-btn"
                      title="Delete category"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {/* Create New Category Form */}
        {isCreating && (
          <div className="category-item creating">
            <div className="category-edit-form">
              <div className="category-form-row">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="category-name-input"
                  placeholder="Category name"
                  maxLength={20}
                  autoFocus
                />
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="color-input"
                  />
                  <div className="color-preview" style={{ backgroundColor: newCategoryColor }}></div>
                </div>
              </div>
              <div className="category-predefined-colors">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="category-edit-actions">
                <button
                  onClick={handleSaveCreate}
                  className="category-save-btn"
                  disabled={!newCategoryName.trim()}
                >
                  <FiCheck size={14} />
                  Create
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="category-cancel-btn"
                >
                  <FiX size={14} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {categories.length === 0 && !isCreating && (
        <div className="category-empty-state">
          <p>No categories yet. Create your first one!</p>
        </div>
      )}
    </div>
  )
}

export default CategoryManager 