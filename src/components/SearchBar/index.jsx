import { FiSearch } from 'react-icons/fi'
import './style.css'

function SearchBar({ searchQuery, onSearchChange }) {
  return (
    <div className="search-container">
      <div className="search-input">
        <FiSearch size={20} />
        <input
          type="text"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default SearchBar 