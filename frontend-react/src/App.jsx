import "./App.css";
import { useMemo, useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.healthyeatingforeveryone.ch";

function formatCzk(value) {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value);
}

export default function App() {
  const [ovzMonthly, setOvzMonthly] = useState("50000");
  const [years, setYears] = useState("35");
  const [calcYear, setCalcYear] = useState("2025");
  const [earlyDays, setEarlyDays] = useState("0");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const res = await fetch("/api/geoip");
        const data = await res.json();
        setGeo(data);
      } catch (e) {
        console.error("GeoIP auto load fehlgeschlagen", e);
      }
    };

    loadGeo();
  }, []);


  const parsed = useMemo(() => {
    const ovz = Number(String(ovzMonthly).replace(",", "."));
    const yrs = Number(String(years).replace(",", "."));
    const yearNum = Number(String(calcYear).replace(",", "."));
    const earlyNum = Number(String(earlyDays).replace(",", "."));

    return {
      ovz, yrs, yearNum, earlyNum,
      ovzValid: Number.isFinite(ovz) && ovz >= 0,
      yrsValid: Number.isInteger(yrs) && yrs >= 0,
      yearValid: [2025, 2026].includes(yearNum),
      earlyValid: Number.isInteger(earlyNum) && earlyNum >= 0,
    };
  }, [ovzMonthly, years, calcYear, earlyDays]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!parsed.ovzValid || !parsed.yrsValid) {
      setError("Zadejte prosím platné údaje.");
      return;
    }

    setIsLoading(true);

    try {
        // KEIN navigator.geolocation mehr -> KEIN Popup!
        const res = await fetch(`${API_BASE}/api/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ovz_monthly: parsed.ovz,
            years: parsed.yrs,
            year: parsed.yearNum,
            early_days: parsed.earlyNum,
            // Wir senden keine Koordinaten, das Backend macht das still über die IP
          }),
        });

        const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Neznámá chyba.");
            setResult(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        }

  function onReset() {
    setOvzMonthly("50000");
    setYears("35");
    setCalcYear("2025");
    setEarlyDays("0");
    setResult(null);
    setError("");
  }

  // Daten für UI
  const resData = result?.results;
  const params = result?.params;

  return (
    <div className="page">
      <div className="shell">
        <div className="header">
          <h1 className="title">Kalkulačka starobního důchodu (ČR)</h1>
          <p className="subtitle">
            Zjednodušený model výpočtu starobního důchodu. Zadání v CZK za měsíc.
          </p>
        </div>

        <div className="grid">
          <div className="card">
            <div className="cardBody">
              <form className="form" onSubmit={onSubmit}>
                <div className="row">
                  <div className="label">Výpočtový rok</div>
                  <select className="input" value={calcYear} onChange={(e) => setCalcYear(e.target.value)}>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <div className="row">
                  <div className="label">Průměrný měsíční hrubý příjem (CZK)</div>
                  <input className="input" value={ovzMonthly} onChange={(e) => setOvzMonthly(e.target.value)} inputMode="decimal" />
                </div>

                <div className="row">
                  <div className="label">Doba pojištění (roky)</div>
                  <input className="input" value={years} onChange={(e) => setYears(e.target.value)} inputMode="numeric" />
                </div>

                <div className="row">
                  <div className="label">Předčasný důchod (dny)</div>
                  <input className="input" value={earlyDays} onChange={(e) => setEarlyDays(e.target.value)} inputMode="numeric" />
                </div>

                <div className="actions">
                  <button className="button" type="submit" disabled={isLoading}>
                    {isLoading ? "Výpočet..." : "Spočítat"}
                  </button>
                  <button className="button ghost" type="button" onClick={onReset} disabled={isLoading}>
                    Obnovit
                  </button>
                </div>
                {error && <div className="error">{error}</div>}
              </form>
            </div>
          </div>

          <div className="kpis">
            <div className="kpiBig">
              <p className="kpiTitle">Odhadovaná měsíční výše důchodu</p>
              <p className="kpiValue">
                {result ? formatCzk(resData?.pension_monthly) : " - "}
                {result && <span className="kpiUnit"> CZK</span>}
              </p>
            </div>

            <div className="kpiGrid">
              <div className="kpi">
                <p className="kpiName">Základní výměra</p>
                <p className="kpiNum">{result ? `${formatCzk(params?.basic_amount)} CZK` : " - "}</p>
              </div>
              <div className="kpi">
                <p className="kpiName">Výpočtový základ</p>
                <p className="kpiNum">{result ? `${formatCzk(resData?.reduced_base)} CZK` : " - "}</p>
              </div>
              <div className="kpiFull">
                <p className="kpiName">Procentní výměra (po krácení)</p>
                <p className="kpiNum">{result ? `${formatCzk(resData?.percent_part_net)} CZK` : " - "}</p>
              </div>
            </div>

            <div className="footerNote">
              Upozornění: Jedná se o orientační výpočet pro studijní účely IT Security.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}