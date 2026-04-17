import { useState, useRef } from 'react';

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState('above');
  const wrapRef = useRef(null);

  function handleEnter() {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      // If there isn't enough room above the wrapper for a typical tooltip,
      // flip it below so it doesn't clip the top of the viewport.
      setPosition(rect.top < 80 ? 'below' : 'above');
    }
    setVisible(true);
  }

  return (
    <span
      className="tooltip-wrapper"
      ref={wrapRef}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span className="tooltip-icon">ⓘ</span>
      {visible && (
        <span className={`tooltip-bubble tooltip-${position}`}>{text}</span>
      )}
    </span>
  );
}
