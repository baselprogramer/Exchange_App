import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CurrencyHero from '../components/CurrencyHero';
import Table from '../components/Table';
import TableNavBar from '../components/TableNavBar';
import { useOfficialRates } from '../components/useOfficialRates';
import { useForexRates, FOREX_SOURCE_LABELS } from '../components/useForexRates';
import * as XLSX from 'xlsx';


function getSafeMargin(raw) {
  const n = Number(raw);
  if (!n || n <= 0 || n >= 9999) return 12;
  return n;
}

const CSS = `
.company-table-wrap{flex:1;min-width:0;background-color:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;overflow:hidden;overflow-x:auto;box-shadow:0 20px 25px -5px var(--shadow-dark);animation:fadeUp 0.45s ease both;}
.company-margin-bar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border-color);background-color:var(--accent-gold-rgba-05);direction:rtl;}
.cmb-group{display:flex;flex-direction:column;gap:4px;}
.cmb-label{font-size:10px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;font-family:'Tajawal',sans-serif;white-space:nowrap;}
.cmb-inline-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;direction:rtl;}
.cmb-badge{padding:5px 12px;border-radius:20px;font-size:13px;font-weight:700;font-family:'Cairo',sans-serif;direction:ltr;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;}
.cmb-badge-label{font-size:9px;opacity:.7;letter-spacing:.04em;font-family:'Tajawal',sans-serif;}
.cmb-badge--buy {border:1px solid var(--green-border);color:var(--green);background:var(--green-bg);}
.cmb-badge--sell{border:1px solid var(--red-border);color:var(--red);background:var(--red-bg);}
.cmb-badge--avg {border:1px solid var(--accent-gold-rgba-40);color:var(--accent-gold);background:var(--accent-gold-rgba-08);}
.cmb-margin-pill{padding:5px 14px;border-radius:20px;font-size:15px;font-weight:700;font-family:'Cairo',sans-serif;border:1px solid;direction:ltr;display:inline-block;min-width:60px;text-align:center;transition:all .2s;}
.cmb-margin-display{font-size:18px;font-weight:700;font-family:'Cairo',sans-serif;direction:ltr;display:inline-block;}

/* Forex dropdown */
.cmb-forex-wrap{position:relative;}
.cmb-forex-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:var(--accent-gold-rgba-08);border:1px solid var(--accent-gold-rgba-30);border-radius:20px;color:var(--accent-gold);font-size:12px;font-weight:700;font-family:'Cairo',sans-serif;cursor:pointer;transition:all .2s;white-space:nowrap;}
.cmb-forex-btn:hover{background:var(--accent-gold-rgba-15);border-color:var(--accent-gold-rgba-50);}
.cmb-forex-btn--active{background:var(--accent-gold-rgba-15);border-color:var(--accent-gold-rgba-60);box-shadow:0 0 0 1px var(--accent-gold-rgba-20);}
.cmb-forex-clear{background:var(--red-bg);border-color:var(--red-border);color:var(--red);}
.cmb-forex-clear:hover{background:var(--red-bg);border-color:var(--red);}
.cmb-forex-dropdown{position:absolute;top:calc(100% + 6px);right:0;background-color:var(--bg-secondary);border:1px solid var(--border-color);border-radius:10px;overflow:hidden;box-shadow:0 8px 24px var(--shadow-dropdown);z-index:200;min-width:160px;animation:fadeUp 0.15s ease both;}
.cmb-forex-item{display:block;width:100%;padding:10px 16px;font-size:13px;font-family:'Cairo',sans-serif;color:var(--text-secondary);background:none;border:none;text-align:right;cursor:pointer;transition:background-color .15s,color .15s;direction:rtl;}
.cmb-forex-item:hover{background-color:var(--accent-gold-rgba-10);color:var(--text-primary);}
.cmb-forex-item--active{background-color:var(--accent-gold-rgba-12);color:var(--accent-gold);font-weight:700;}
.cmb-forex-item:not(:last-child){border-bottom:1px solid var(--border-light);}
.cmb-forex-source-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;font-family:'Tajawal',sans-serif;background:var(--accent-gold-rgba-12);border:1px solid var(--accent-gold-rgba-30);color:var(--accent-gold);}

.cmb-export{margin-right:auto;display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:linear-gradient(135deg,var(--bg-secondary),var(--accent-gold-rgba-12));border:1px solid var(--accent-gold-rgba-40);border-radius:8px;color:var(--accent-gold);font-size:13px;font-weight:700;font-family:'Cairo',sans-serif;cursor:pointer;transition:all .2s;white-space:nowrap;}
.cmb-export:hover:not(:disabled){background:var(--accent-gold-rgba-15);border-color:var(--accent-gold-rgba-60);transform:translateY(-1px);box-shadow:0 4px 14px var(--glow);}
.cmb-export:disabled{opacity:.35;cursor:not-allowed;}

.company-header-row,.company-data-row{display:grid!important;grid-template-columns:1.8fr 72px 115px 115px 110px 105px 105px 105px!important;align-items:center;direction:rtl;min-width:860px;}
.company-header-row{background-color:var(--accent-gold-rgba-10);border-bottom:1px solid var(--border-color);}
.company-data-row{cursor:pointer;transition:background-color .2s;border-bottom:1px solid var(--border-light);animation:rowIn 0.35s ease both;}
.company-data-row:last-child{border-bottom:none;}
.company-data-row:hover{background-color:var(--accent-gold-rgba-10)!important;}
.company-data-row.table-row-even{background-color:var(--accent-gold-rgba-05);}
.company-data-row.table-row-odd{background-color:transparent;}
.company-data-row.table-row-selected{background-color:var(--accent-gold-rgba-12)!important;border-right:3px solid var(--accent-gold);}
.company-data-row.table-row-selected .table-country-name{color:var(--accent-gold);}
.col-sep-after{border-left:1px solid var(--border-color);}
.mgt-official{opacity:.55;}
.mgt-buy{color:var(--green)!important;font-weight:700;}
.mgt-sell{color:var(--red)!important;font-weight:700;}
.mgt-avg{color:var(--accent-gold)!important;font-weight:700;}
.chip__value.mgt-buy{color:var(--green);}
.chip__value.mgt-sell{color:var(--red);}
.chip__value.mgt-avg{color:var(--accent-gold);}
.table-navbar__btn--margin{display:inline-flex;align-items:center;gap:5px;}
@media(max-width:480px){
  .company-margin-bar{flex-direction:column;align-items:flex-start;gap:12px;}
  .cmb-export{margin-right:0;width:100%;justify-content:center;}
  .company-header-row{display:none!important;}
  .company-data-row{display:flex!important;flex-direction:column;min-width:unset;padding:14px 14px 10px;gap:10px;border-bottom:1px solid var(--border-medium)!important;}
  .company-data-row .desktop-cell{display:none;}
  .company-data-row .card-chips{display:flex;}
  .company-data-row .table-country-cell{padding:0;}
}
`;

function injectCSS() {
  if (document.getElementById('company-page-css')) return;
  const s = document.createElement('style');
  s.id = 'company-page-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/******** Code start from here : *******/

function applyMargin(rate, margin) {
  
  const mul  = 1 + (Number(margin) || 0) / 100;
  const buy  = parseFloat((Number(rate.buy)  * mul).toFixed(3));
  const sell = parseFloat((Number(rate.sell) * mul).toFixed(3));
  const avg  = parseFloat(((buy + sell) / 2).toFixed(3));
  
  return { ...rate, clientBuy: buy, clientSell: sell, clientAvg: avg };
}

function exportToExcel(displayRows, margin, maxMargin, source, usdRates) {
  const today = new Date().toLocaleDateString('ar-SY');
  const srcLabel = source ? FOREX_SOURCE_LABELS[source] : 'النشرة الرسمية';

  // USD row — always first
const usdRow = [
  'الدولار الأمريكي', 'USD',
  usdRates.clientBuy, usdRates.clientSell, usdRates.clientAvg,
  '', '', ''
];
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['نشرات البنك المركزي السوري — جدول أسعار الشركة'],
    [`تاريخ: ${today}   |   المصدر: ${srcLabel}   |   هامش البنك المركزي: ${maxMargin}%   |   هامش الشركة: ${margin}%`],
    [],
    ['البلد','الكود','شراء الشركة','بيع الشركة','وسطي الشركة',`شراء ${srcLabel}`,`بيع ${srcLabel}`,`وسطي ${srcLabel}`],
    usdRow,
    ...displayRows
      .filter(r => r.code !== 'USD') // avoid duplicate USD
      .map(r => {
        const buy  = r.finalBuy  ?? r.clientBuy;
        const sell = r.finalSell ?? r.clientSell;
        const avg  = r.finalAvg  ?? r.clientAvg;
        return [r.country, r.code, buy, sell, avg,Number(r.buy), Number(r.sell), Number( r.mid ?? r.average ?? r.avg)];
      }),
  ]);
  ws1['!cols'] = [{wch:22},{wch:8},{wch:16},{wch:16},{wch:16},{wch:16},{wch:16},{wch:16}];
  ws1['!merges'] = [{s:{r:0,c:0},e:{r:0,c:7}},{s:{r:1,c:0},e:{r:1,c:7}}];

  const ws2 = XLSX.utils.aoa_to_sheet([
    ['كود العملة','سعر الشراء','سعر البيع','السعر الوسطي'],
    ['USD', usdRates.clientBuy, usdRates.clientSell, usdRates.clientAvg],
    ...displayRows
      .filter(r => r.code !== 'USD')
      .map(r => {
        const buy  = r.finalBuy  ?? r.clientBuy;
        const sell = r.finalSell ?? r.clientSell;
        const avg  = r.finalAvg  ?? r.clientAvg;
        return [r.code, buy, sell, avg];
      }),
  ]);
  ws2['!cols'] = [{wch:12},{wch:14},{wch:14},{wch:16}];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'نشرة الأسعار');
  XLSX.utils.book_append_sheet(wb, ws2, 'برنامج الحوالات');
  XLSX.writeFile(wb, `نشرة_الشركة_${today.replace(/\//g,'-')}.xlsx`);
}

const FOREX_SOURCES = [
  { id: 'central',   label: 'المركزي (فوركس)' },
  { id: 'reuters',   label: 'Reuters'           },
  { id: 'investing', label: 'Investing'         },
];

const MULTIPLY_CURRENCIES = ['EUR', 'GBP', 'AUD'];

export default function CompanyPage() {
  useEffect(() => { injectCSS(); }, []);

  const [selectedId,      setSelectedId]      = useState('USD');
  const [effectiveMargin, setEffectiveMargin] = useState(0);
  const [forexSource,     setForexSource]     = useState(null); // null = نشرة رسمية
  const [dropOpen,        setDropOpen]        = useState(false);
  const dropRef = useRef(null);

  const { rates: officialRates, loading: offLoading, error: offError, priceMargin } = useOfficialRates();
  const { rows:  forexRows,     loading: fxLoading,  error: fxError  } = useForexRates(forexSource);

  const maxMargin = getSafeMargin(priceMargin);

  // إغلاق الـ dropdown لما يضغط برا
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleMarginChange = useCallback((m) => { setEffectiveMargin(m); }, []);

  // الأسعار المستخدمة — فوركس للعملات غير USD، رسمي لـ USD دايماً
  const baseRates = useMemo(() => {
    if (!forexSource || !forexRows.length) return officialRates;
    const usdOfficial = officialRates.find(r => r.code === 'USD');
    const merged = forexRows.map(r => ({
      ...r,
      average: r.average ?? r.avg
    }));
    
    // USD دايماً من النشرة الرسمية
    if (usdOfficial) {
      const idx = merged.findIndex(r => r.code === 'USD');
      if (idx >= 0) merged[idx] = usdOfficial;
      else merged.unshift(usdOfficial);
    }
    return merged;
  }, [forexSource, forexRows, officialRates]);

  const rows = useMemo(
    () => baseRates.map(r => applyMargin(r, effectiveMargin)),
    [baseRates, effectiveMargin]
    );

    const usdRates  = useMemo(() => rows.find(r => r.code === 'USD') || null, [rows]);

    /************ Computing The Final Rates Here ************/

    const finalRates = useMemo(() => {
      if (!forexRows.length) return [];

      const usdAvg = usdRates?.clientAvg;
      if (!usdAvg) return [];

      return forexRows.map(r => {
        
        const forexAvg = r.mid ?? r.avg ?? r.average;
        const finalAvg  = MULTIPLY_CURRENCIES.includes(r.code)
              ? parseFloat((usdAvg * forexAvg).toFixed(3))
              : parseFloat((usdAvg / forexAvg).toFixed(3))

        const finalBuy = parseFloat((finalAvg * 0.995495495495496).toFixed(3));
        const finalSell  = parseFloat((finalAvg * 1.00454545454545).toFixed(3));

        return { ...r, finalAvg, finalSell, finalBuy };
      });

    }, [usdRates, forexRows]);

    const displayRows = finalRates.length > 0 ? finalRates : rows;
    const FinalRates = finalRates.map(r => `${r.code} → avg: ${r.finalAvg} | buy: ${r.finalBuy} | sell: ${r.finalSell}`)

    const canExport = rows.length > 0;
    const isLoading = offLoading || fxLoading;
    const error     = offError || fxError;

    const marginColor = effectiveMargin > 0 ? 'var(--green)' : effectiveMargin < 0 ? 'var(--red)' : 'var(--text-secondary)';

  return (
    <>
      <CurrencyHero selectedId={selectedId} onSelect={setSelectedId} />
      <Table onMarginChange={handleMarginChange} />
      <TableNavBar />

      <section className="table-section">
        <div className="table-layout">
          <div className="company-table-wrap">

            {/* ── شريط المعلومات ── */}
            <div className="company-margin-bar">

              {/* Forex dropdown */}
              <div className="cmb-forex-wrap" ref={dropRef}>
                <button
                  className={`cmb-forex-btn ${forexSource ? 'cmb-forex-btn--active' : ''}`}
                  onClick={() => setDropOpen(o => !o)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="6" x2="23" y2="6"/><line x1="1" y1="12" x2="23" y2="12"/><line x1="1" y1="18" x2="23" y2="18"/>
                  </svg>
                  {forexSource ? FOREX_SOURCE_LABELS[forexSource] : 'مصدر الفوركس'}
                  <span style={{fontSize:'10px',opacity:.7}}>{dropOpen ? '▲' : '▾'}</span>
                </button>

                {dropOpen && (
                  <div className="cmb-forex-dropdown">
                    {FOREX_SOURCES.map(s => (
                      <button
                        key={s.id}
                        className={`cmb-forex-item ${forexSource === s.id ? 'cmb-forex-item--active' : ''}`}
                        onClick={() => { setForexSource(s.id); setDropOpen(false); }}
                      >
                        {s.label}
                      </button>
                    ))}
                    {forexSource && (
                      <button
                        className="cmb-forex-item"
                        style={{color:'var(--red)',borderTop:'1px solid var(--border-color)'}}
                        onClick={() => { setForexSource(null); setDropOpen(false); }}
                      >
                        ✕ العودة للنشرة الرسمية
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* مصدر الفوركس النشط */}
              {forexSource && (
                <span className="cmb-forex-source-badge">
                  📡 {FOREX_SOURCE_LABELS[forexSource]}
                </span>
              )}

              {/* Badges USD */}
              {usdRates && (
                <div className="cmb-inline-row">
                  <span className="cmb-badge cmb-badge--buy">
                    <span className="cmb-badge-label">شراء</span>
                    {usdRates.clientBuy.toLocaleString()}
                  </span>
                  <span className="cmb-margin-pill" style={{
                    color: marginColor,
                    borderColor: effectiveMargin > 0 ? 'var(--green-border)' : effectiveMargin < 0 ? 'var(--red-border)' : 'var(--border-heavy)',
                    background:  effectiveMargin > 0 ? 'var(--green-bg)'    : effectiveMargin < 0 ? 'var(--red-bg)'    : 'var(--accent-gold-rgba-06)',
                  }}>
                    {effectiveMargin > 0 ? '+' : ''}{effectiveMargin}%
                  </span>
                  <span className="cmb-badge cmb-badge--sell">
                    <span className="cmb-badge-label">بيع</span>
                    {usdRates.clientSell.toLocaleString()}
                  </span>
                  <span className="cmb-badge cmb-badge--avg">
                    <span className="cmb-badge-label">وسطي</span>
                    {usdRates.clientAvg.toLocaleString()}
                  </span>
                </div>
              )}

              <button
                className="cmb-export"
                disabled={!canExport}
                onClick={() => exportToExcel(displayRows, effectiveMargin, maxMargin, forexSource, usdRates)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                تصدير Excel
              </button>
            </div>

            {/* ── الجدول ── */}
            {isLoading && <div className="forex-state-msg">جاري تحميل البيانات…</div>}
            {error     && <div className="forex-state-msg forex-state-msg--error">{error}</div>}

            {!isLoading && !error && rows.length > 0 && (
              <>
                <div className="company-header-row">
                  <div className="table-header-cell col-country">البلد</div>
                  <div className="table-header-cell col-code">كود</div>
                  <div className="table-header-cell col-num">شراء الشركة</div>
                  <div className="table-header-cell col-num">بيع الشركة</div>
                  <div className="table-header-cell col-num col-sep-after">وسطي الشركة</div>
                  <div className="table-header-cell col-num mgt-official">شراء النشرة المعتمدة</div>
                  <div className="table-header-cell col-num mgt-official">بيع النشرة المعتمدة</div>
                  <div className="table-header-cell col-num mgt-official">وسطي النشرة المعتمدة</div>
                </div>
                <div className="table-body">
                  {displayRows.map((row, i) => {
                    const isSelected = row.id === selectedId || row.code === selectedId;
                    
                    // safe values — works for both rows and finalRates
                    const buy = row.finalBuy  ?? row.clientBuy;
                    const sell = row.finalSell ?? row.clientSell;
                    const avg  = row.finalAvg  ?? row.clientAvg;

                    const forexBuy  = Number(row.buy);
                    const forexSell = Number(row.sell);
                    const forexAvg  = Number(row.mid ?? row.average ?? row.avg);

                    return (
                      <div
                        key={row.code}
                        onClick={() => setSelectedId(row.code)}
                        className={`company-data-row ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}${isSelected ? ' table-row-selected' : ''}`}
                      >
                        <div className="table-country-cell col-country">
                          <div className="table-country-content">
                            <img src={row.flag} alt={row.country} className="table-flag-image" loading="lazy" />
                            <span className="table-country-name">{row.country}</span>
                          </div>
                        </div>
                        <div className="table-data-cell col-code desktop-cell">
                          <span className="table-currency-code table-numeric">{row.code}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell">
                          <span className="table-numeric mgt-buy">{buy.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell">
                          <span className="table-numeric mgt-sell">{sell.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell col-sep-after">
                          <span className="table-numeric mgt-avg">{avg.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>

                            {/* 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 } */}

                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{forexBuy.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>
                        
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{forexSell.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>

                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{forexAvg.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>

                        <div className="card-chips">
                          <div className="chip"><span className="chip__label">كود</span><span className="chip__value chip__value--code">{row.code}</span></div>
                          <div className="chip"><span className="chip__label">شراء الشركة</span><span className="chip__value mgt-buy">{buy.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">بيع الشركة</span><span className="chip__value mgt-sell">{sell.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">وسطي الشركة</span><span className="chip__value mgt-avg">{avg.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">شراء النشرة المعتمدة</span><span className="chip__value">{forexBuy.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">بيع النشرة المعتمدة</span><span className="chip__value">{forexSell.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">وسطي النشرة المعتمدة</span><span className="chip__value">{forexAvg.toLocaleString()}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}