import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

const FOREX_SOURCES = [
  { id: 'central',   label: 'المركزي'  },
  { id: 'reuters',   label: 'Reuters'  },
  { id: 'investing', label: 'Investing'},
];

export default function TableNavBar() {
  const location       = useLocation();
  const [searchParams] = useSearchParams();
  const isForex        = location.pathname === '/forex';
  const activeSource   = searchParams.get('source') || 'central';

  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeForexLabel = FOREX_SOURCES.find(s => s.id === activeSource)?.label || 'فوركس';

  return (
    <nav className="table-navbar">
      <Link to="/" className={`table-navbar__btn ${!isForex ? 'table-navbar__btn--active' : ''}`}>
        رسمي
      </Link>
      <div className="table-navbar__dropdown-wrap" ref={dropRef}>
        <button
          className={`table-navbar__btn table-navbar__btn--forex ${isForex ? 'table-navbar__btn--active' : ''}`}
          onClick={() => setDropOpen(prev => !prev)}
        >
          {isForex ? activeForexLabel : 'فوركس'}
          <span className={`table-navbar__arrow ${dropOpen ? 'table-navbar__arrow--open' : ''}`}>▾</span>
        </button>
        {dropOpen && (
          <div className="table-navbar__dropdown">
            {FOREX_SOURCES.map(source => (
              <Link
                key={source.id}
                to={`/forex?source=${source.id}`}
                className={`table-navbar__drop-item ${isForex && activeSource === source.id ? 'table-navbar__drop-item--active' : ''}`}
                onClick={() => setDropOpen(false)}
              >
                {source.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
