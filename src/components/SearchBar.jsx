import { useState, useRef, useEffect } from 'react';
import { searchTickers } from '../api/secEdgar';

export default function SearchBar({ onSelect, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    if (val.length >= 2) {
      const matches = searchTickers(val);
      setResults(matches);
      setOpen(matches.length > 0);
    } else {
      setResults([]);
      setOpen(false);
    }
  }

  function handleSelect(item) {
    setQuery(`${item.ticker} — ${item.name}`);
    setOpen(false);
    setResults([]);
    onSelect(item);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[activeIndex >= 0 ? activeIndex : 0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="search-bar" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setQuery('');
          setResults([]);
          setActiveIndex(-1);
          setOpen(false);
        }}
        placeholder="Search by ticker or company name..."
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
      />
      {open && (
        <ul className="search-dropdown">
          {results.map((item, i) => (
            <li
              key={item.cik}
              className={i === activeIndex ? 'active' : ''}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="search-ticker">{item.ticker}</span>
              <span className="search-name">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
