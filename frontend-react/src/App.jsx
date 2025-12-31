import { useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

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

  const parsed = useMemo(() => {
    const ovz = Number(String(ovzMonthly).replace(",", "."));
    const yrs = Number(String(years).replace(",", "."));
    const yearNum = Number(String(calcYear).replace(",", "."));
    const earlyNum = Number(String(earlyDays).replace(",", "."));

    return {
      ovz,
      yrs,
      yearNum,
      earlyNum,
      ovzValid: Number.isFinite(ovz) && ovz >= 0,
      yrsValid: Number.isInteger(yrs) && yrs >= 0,
      yearValid: Number.isInteger(yearNum) && (yearNum === 2025 || yearNum === 2026),
      earlyValid: Number.isInteger(earlyNum) && earlyNum >= 0,
    };
  }, [ovzMonthly, years, calcYear, earlyDays]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!parsed.ovzValid) {
      setError("Zadejte prosím platnou částku příjmu, číslo větší nebo rovné 0.");
      return;
    }
    if (!parsed.yrsValid) {
      setError("Zadejte prosím platný počet let pojištění, celé číslo větší nebo rovné 0.");
      return;
    }
    if (!parsed.yearValid) {
      setError("Vyberte prosím výpočtový rok 2025 nebo 2026.");
      return;
    }
    if (!parsed.earlyValid) {
      setError("Zadejte prosím platný počet dnů předčasného důchodu, celé číslo větší nebo rovné 0.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ovz_monthly: parsed.ovz,
          years: parsed.yrs,
          year: parsed.yearNum,
          early_days: parsed.earlyNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Neznámá chyba.");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(String(err));
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

  const pension = result?.results?.pension_monthly;
  const reducedBase = result?.results?.reduced_base;

  const percentGross = result?.results?.percent_part_gross;
  const percentNet = result?.results?.percent_part_net;
  const earlyBlocks = result?.results?.early_blocks_90days;
  const earlyFactor = result?.results?.early_factor;

  const basic = result?.params?.basic_amount;

  return (
    <div className="page">
      <div className="shell">
        <div className="header">
          <h1 className="title">Kalkulačka starobního důchodu (ČR)</h1>
          <p className="subtitle">
            Zjednodušený model výpočtu starobního důchodu. Zadání v CZK za měsíc, počet let pojištění,
            výpočtový rok a volitelně předčasný důchod.
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
                  <div className="help">
                    Některé parametry se mohou lišit podle roku (např. procentní sazba za rok pojištění).
                  </div>
                </div>

                <div className="row">
                  <div className="label">Průměrný měsíční hrubý příjem (CZK)</div>
                  <input
                    className="input"
                    value={ovzMonthly}
                    onChange={(e) => setOvzMonthly(e.target.value)}
                    inputMode="decimal"
                    placeholder="např. 50000"
                  />
                  <div className="help">
                    Lze použít tečku nebo čárku. Příklad: 50000 nebo 50000,50.
                  </div>
                </div>

                <div className="row">
                  <div className="label">Doba důchodového pojištění (roky)</div>
                  <input
                    className="input"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    inputMode="numeric"
                    placeholder="např. 35"
                  />
                  <div className="help">Celý počet let, např. 35.</div>
                </div>

                <div className="row">
                  <div className="label">Předčasný důchod – počet dnů před dosažením důchodového věku</div>
                  <input
                    className="input"
                    value={earlyDays}
                    onChange={(e) => setEarlyDays(e.target.value)}
                    inputMode="numeric"
                    placeholder="např. 0"
                  />
                  <div className="help">
                    Hodnota 0 znamená řádný důchod. Každých započatých 90 dnů snižuje procentní výměru.
                  </div>
                </div>

                <div className="actions">
                  <button className="button" type="submit" disabled={isLoading}>
                    {isLoading ? "Výpočet..." : "Spočítat"}
                  </button>
                  <button className="button ghost" type="button" onClick={onReset} disabled={isLoading}>
                    Obnovit
                  </button>
                </div>

                {error ? <div className="error">{error}</div> : null}
              </form>
            </div>
          </div>

          <div className="kpis">
            <div className="kpiBig">
              <p className="kpiTitle">Odhadovaná měsíční výše důchodu</p>
              <p className="kpiValue">
                {result ? formatCzk(pension) : " "}
                {result ? <span className="kpiUnit">CZK</span> : null}
              </p>
            </div>

            <div className="kpiGrid">
              <div className="kpi">
                <div className="kpiLine">
                  <p className="kpiName">Výpočtový základ (po redukci)</p>
                  <p className="kpiNum">{result ? `${formatCzk(reducedBase)} CZK` : " "}</p>
                </div>
              </div>

              <div className="kpi">
                <div className="kpiLine">
                  <p className="kpiName">Základní výměra</p>
                  <p className="kpiNum">{result ? `${formatCzk(basic)} CZK` : " "}</p>
                </div>
              </div>

              <div className="kpi" style={{ gridColumn: "1 / -1" }}>
                <div className="kpiLine">
                  <p className="kpiName">Procentní výměra před krácením</p>
                  <p className="kpiNum">{result ? `${formatCzk(percentGross)} CZK` : " "}</p>
                </div>
              </div>

              <div className="kpi" style={{ gridColumn: "1 / -1" }}>
                <div className="kpiLine">
                  <p className="kpiName">Krácení za předčasný důchod</p>
                  <p className="kpiNum">
                    {result
                      ? `${earlyBlocks} × 90 dnů, koeficient ${Number.isFinite(earlyFactor) ? earlyFactor.toFixed(3) : ""}`
                      : " "}
                  </p>
                </div>
              </div>

              <div className="kpi" style={{ gridColumn: "1 / -1" }}>
                <div className="kpiLine">
                  <p className="kpiName">Procentní výměra po krácení</p>
                  <p className="kpiNum">{result ? `${formatCzk(percentNet)} CZK` : " "}</p>
                </div>
              </div>
            </div>

            <div className="footerNote">
              Upozornění: Jedná se o orientační výpočet. Nezahrnuje valorizaci historických příjmů ani
              další zákonné úpravy. Krácení předčasného důchodu je zjednodušeno po blocích 90 dnů.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
