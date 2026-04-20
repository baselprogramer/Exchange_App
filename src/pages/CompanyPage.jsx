import { useState, useMemo, useEffect, useCallback } from 'react';
import CurrencyHero from '../components/CurrencyHero';
import Table from '../components/Table';
import TableNavBar from '../components/TableNavBar';
import { useOfficialRates } from '../components/useOfficialRates';
import * as XLSX from 'xlsx';

function getSafeMargin(raw) {
  const n = Number(raw);
  if (!n || n <= 0 || n >= 9999) return 12;
  return n;
}

const CSS = `
.company-table-wrap{flex:1;min-width:0;background-color:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;overflow:hidden;overflow-x:auto;box-shadow:0 20px 25px -5px var(--shadow-dark);animation:fadeUp 0.45s ease both;}
.company-margin-bar{display:flex;align-items:center;flex-wrap:wrap;gap:16px;padding:12px 16px;border-bottom:1px solid var(--border-color);background-color:var(--accent-gold-rgba-05);direction:rtl;}
.cmb-group{display:flex;flex-direction:column;gap:4px;}
.cmb-label{font-size:10px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;font-family:'Tajawal',sans-serif;white-space:nowrap;}
.cmb-badges{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.cmb-badge{padding:5px 12px;border-radius:20px;font-size:13px;font-weight:700;font-family:'Cairo',sans-serif;direction:ltr;white-space:nowrap;}
.cmb-badge--buy {border:1px solid var(--green-border);color:var(--green);background:var(--green-bg);}
.cmb-badge--sell{border:1px solid var(--red-border);color:var(--red);background:var(--red-bg);}
.cmb-badge--avg {border:1px solid var(--accent-gold-rgba-40);color:var(--accent-gold);background:var(--accent-gold-rgba-08);}
.cmb-margin-display{font-size:18px;font-weight:700;font-family:'Cairo',sans-serif;direction:ltr;display:inline-block;}
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

function applyMargin(rate, margin) {
  const mul  = 1 + (Number(margin) || 0) / 100;
  const buy  = parseFloat((Number(rate.buy)  * mul).toFixed(3));
  const sell = parseFloat((Number(rate.sell) * mul).toFixed(3));
  const avg  = parseFloat(((buy + sell) / 2).toFixed(3));
  return { ...rate, clientBuy: buy, clientSell: sell, clientAvg: avg };
}

function exportToExcel(rows, margin, maxMargin) {
  const today = new Date().toLocaleDateString('ar-SY');
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['نشرات البنك المركزي السوري — جدول أسعار الشركة'],
    [`تاريخ: ${today}   |   هامش البنك المركزي: ${maxMargin}%   |   هامش الشركة: ${margin}%`],
    [],
    ['البلد','الكود','شراء العميل','بيع العميل','وسطي العميل','شراء النشرة','بيع النشرة','وسطي النشرة'],
    ...rows.map(r=>[r.country,r.code,r.clientBuy,r.clientSell,r.clientAvg,Number(r.buy),Number(r.sell),Number(r.average??r.avg)]),
  ]);
  ws1['!cols']=[{wch:22},{wch:8},{wch:16},{wch:16},{wch:16},{wch:16},{wch:16},{wch:16}];
  ws1['!merges']=[{s:{r:0,c:0},e:{r:0,c:7}},{s:{r:1,c:0},e:{r:1,c:7}}];
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['كود العملة','سعر الشراء','سعر البيع','السعر الوسطي'],
    ...rows.map(r=>[r.code,r.clientBuy,r.clientSell,r.clientAvg]),
  ]);
  ws2['!cols']=[{wch:12},{wch:14},{wch:14},{wch:16}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws1,'نشرة الأسعار');
  XLSX.utils.book_append_sheet(wb,ws2,'برنامج الحوالات');
  XLSX.writeFile(wb,`نشرة_الشركة_${today.replace(/\//g,'-')}.xlsx`);
}

export default function CompanyPage() {
  useEffect(() => { injectCSS(); }, []);

  const [selectedId,      setSelectedId]      = useState('USD');
  const [effectiveMargin, setEffectiveMargin] = useState(0);

  const { rates, loading, error, priceMargin } = useOfficialRates();
  const maxMargin = getSafeMargin(priceMargin);

  // callback مستقر — Table بيستدعيه لما يتغير الهامش
  const handleMarginChange = useCallback((m) => {
    setEffectiveMargin(m);
  }, []);

  const rows = useMemo(
    () => rates.map(r => applyMargin(r, effectiveMargin)),
    [rates, effectiveMargin]
  );

  const usdRates  = useMemo(() => rows.find(r => r.code === 'USD') || null, [rows]);
  const canExport = rows.length > 0 && effectiveMargin !== 0;

  // لون الهامش حسب الإشارة
  const marginColor = effectiveMargin > 0 ? 'var(--green)' : effectiveMargin < 0 ? 'var(--red)' : 'var(--text-secondary)';

  return (
    <>
      <CurrencyHero selectedId={selectedId} onSelect={setSelectedId} />

      {/* Table ترفع الهامش عبر onMarginChange */}
      <Table onMarginChange={handleMarginChange} />

      <TableNavBar />

      <section className="table-section">
        <div className="table-layout">
          <div className="company-table-wrap">

            {/* ── شريط معلومات — بدون input ── */}
            <div className="company-margin-bar">

              {/* الهامش المطبّق حالياً */}
              <div className="cmb-group">
                <span className="cmb-label">هامش الشركة المطبّق</span>
                <span className="cmb-margin-display" style={{color: marginColor}}>
                  {effectiveMargin > 0 ? '+' : ''}{effectiveMargin}%
                </span>
              </div>

              {/* Badges USD */}
              {usdRates && (
                <div className="cmb-group">
                  <div className="cmb-badges">
                    <span className="cmb-badge cmb-badge--buy">شراء {usdRates.clientBuy.toLocaleString()}</span>
                    <span className="cmb-badge cmb-badge--sell">بيع {usdRates.clientSell.toLocaleString()}</span>
                    <span className="cmb-badge cmb-badge--avg">وسطي {usdRates.clientAvg.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                className="cmb-export"
                disabled={!canExport}
                onClick={() => exportToExcel(rows, effectiveMargin, maxMargin)}
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
            {loading && <div className="forex-state-msg">جاري تحميل البيانات…</div>}
            {error   && <div className="forex-state-msg forex-state-msg--error">{error}</div>}

            {!loading && !error && rows.length > 0 && (
              <>
                <div className="company-header-row">
                  <div className="table-header-cell col-country">البلد</div>
                  <div className="table-header-cell col-code">كود</div>
                  <div className="table-header-cell col-num">شراء العميل</div>
                  <div className="table-header-cell col-num">بيع العميل</div>
                  <div className="table-header-cell col-num col-sep-after">وسطي العميل</div>
                  <div className="table-header-cell col-num mgt-official">شراء النشرة</div>
                  <div className="table-header-cell col-num mgt-official">بيع النشرة</div>
                  <div className="table-header-cell col-num mgt-official">وسطي النشرة</div>
                </div>
                <div className="table-body">
                  {rows.map((row, i) => {
                    const isSelected = row.id === selectedId;
                    return (
                      <div
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
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
                          <span className="table-numeric mgt-buy">{row.clientBuy.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell">
                          <span className="table-numeric mgt-sell">{row.clientSell.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell col-sep-after">
                          <span className="table-numeric mgt-avg">{row.clientAvg.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{Number(row.buy).toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{Number(row.sell).toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{Number(row.average ?? row.avg).toLocaleString()}</span>
                        </div>
                        <div className="card-chips">
                          <div className="chip"><span className="chip__label">كود</span><span className="chip__value chip__value--code">{row.code}</span></div>
                          <div className="chip"><span className="chip__label">شراء العميل</span><span className="chip__value mgt-buy">{row.clientBuy.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">بيع العميل</span><span className="chip__value mgt-sell">{row.clientSell.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">الوسطي</span><span className="chip__value mgt-avg">{row.clientAvg.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">شراء النشرة</span><span className="chip__value">{Number(row.buy).toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">بيع النشرة</span><span className="chip__value">{Number(row.sell).toLocaleString()}</span></div>
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