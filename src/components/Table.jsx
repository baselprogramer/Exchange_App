import { useState } from 'react';
import { useOfficialRates } from './useOfficialRates';

export default function Table() {
  const { rates, loading , priceMargin} = useOfficialRates();

  const [direction, setDirection] = useState('نحو الأعلى');
  const directionClass = direction === 'نحو الأعلى' ? 'st-direction--up' : 'st-direction--down';

  if (loading || !rates.length) return null;

  const currency = rates[0];
  const buy      = Number(currency.buy);
  const sell     = Number(currency.sell);
  const average  = Number(currency.average);

  return (
    <section className="st-wrapper">
      <div className="st-header-row">
        <div className="st-header-cell">العملة</div>
        <div className="st-header-cell">الحد الأدنى الوسطي</div>
        <div className="st-header-cell">الحد الأعلى الوسطي</div>
        <div className="st-header-cell">السعر الوسطي حسب المركزي</div>
        <div className="st-header-cell">هامش الحركة السعري المركزي</div>
        <div className="st-header-cell">اختيار الاتجاه</div>
        <div className="st-header-cell">هامش الحركة السعري للشركة</div>
      </div>
      <div className="st-data-row">
        <div className="st-cell st-cell--name">{currency.country}</div>
        <div className="st-cell"><span className="st-num">{(buy * 0.93).toFixed(2)}</span></div>
        <div className="st-cell"><span className="st-num">{(sell * 1.07).toFixed(2)}</span></div>
        <div className="st-cell st-cell--highlight"><span className="st-num">{average.toFixed(2)}</span></div>
        <div className="st-cell st-cell--highlight"><span className="st-num">{priceMargin}%</span></div>
        <div className={`st-cell ${directionClass}`}>
          <span className="st-direction-badge" onClick={() => setDirection(d => d === 'نحو الأعلى' ? 'نحو الأسفل' : 'نحو الأعلى')}>
            {direction} <span className="direction-arrow">{direction === 'نحو الأعلى' ? '↑' : '↓'}</span>
          </span>
        </div>
        <div className="st-cell st-cell--company">
          <input className="st-num" type="number" step="0.01" defaultValue="0" min={`-${priceMargin}`} max={`${priceMargin}`} />
        </div>
      </div>
      <div className="st-sub-row">
        <div className="st-cell st-cell--empty"></div>
        <div className="st-cell"><span className="st-num">{buy.toFixed(2)}</span></div>
        <div className="st-cell"><span className="st-num">{sell.toFixed(2)}</span></div>
        <div className="st-cell st-cell--sub-label">شراء</div>
        <div className="st-cell"></div><div className="st-cell"></div><div className="st-cell"></div>
      </div>
      <div className="st-sub-row">
        <div className="st-cell st-cell--empty"></div>
        <div className="st-cell"><span className="st-num">{(buy * 1.07).toFixed(2)}</span></div>
        <div className="st-cell"><span className="st-num">{(sell * 0.93).toFixed(2)}</span></div>
        <div className="st-cell st-cell--sub-label">بيع</div>
        <div className="st-cell"></div><div className="st-cell"></div><div className="st-cell"></div>
      </div>
    </section>
  );
}
