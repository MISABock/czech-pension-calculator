from dataclasses import dataclass
import math

@dataclass(frozen=True)
class Params:
    year: int
    basic_amount: float
    rh1: float
    rh2: float
    pct_to_rh1: float
    pct_between: float
    pct_above: float
    accrual_rate_per_year: float
    early_reduction_per_90days: float

PARAMS_BY_YEAR = {
    2025: Params(
        year=2025,
        basic_amount=4660.0,
        rh1=20486.0,
        rh2=186228.0,
        pct_to_rh1=1.00,
        pct_between=0.26,
        pct_above=0.00,
        accrual_rate_per_year=0.015,
        early_reduction_per_90days=0.015,
    ),
    2026: Params(
        year=2026,
        basic_amount=4900.0,            # hier nur beispielhaft, du kannst es jährlich updaten
        rh1=21546.0,                   # hier nur beispielhaft
        rh2=195868.0,                  # hier nur beispielhaft
        pct_to_rh1=0.99,               # laut ČSSZ Textänderung ab 2026 möglich
        pct_between=0.26,
        pct_above=0.00,
        accrual_rate_per_year=0.01495, # 1,495 Prozent
        early_reduction_per_90days=0.015,
    ),
}

def reduced_base(ovz_monthly: float, p: Params) -> float:
    if ovz_monthly <= p.rh1:
        return ovz_monthly * p.pct_to_rh1
    if ovz_monthly <= p.rh2:
        return p.rh1 * p.pct_to_rh1 + (ovz_monthly - p.rh1) * p.pct_between
    return (
        p.rh1 * p.pct_to_rh1
        + (p.rh2 - p.rh1) * p.pct_between
        + (ovz_monthly - p.rh2) * p.pct_above
    )

def early_reduction_factor(p: Params, early_days: int) -> tuple[float, int]:
    if early_days <= 0:
        return 1.0, 0
    blocks = math.ceil(early_days / 90)
    reduction = blocks * p.early_reduction_per_90days
    factor = max(0.0, 1.0 - reduction)
    return factor, blocks

def calculate_pension(
    ovz_monthly: float,
    years: int,
    year: int = 2025,
    early_days: int = 0,
) -> dict:
    if years < 0:
        raise ValueError("years must be >= 0")
    if ovz_monthly < 0:
        raise ValueError("ovz_monthly must be >= 0")
    if year not in PARAMS_BY_YEAR:
        raise ValueError(f"year must be one of: {sorted(PARAMS_BY_YEAR.keys())}")
    if early_days < 0:
        raise ValueError("early_days must be >= 0")

    p = PARAMS_BY_YEAR[year]

    rb = reduced_base(ovz_monthly, p)
    percent_part_gross = rb * p.accrual_rate_per_year * years

    factor, blocks = early_reduction_factor(p, early_days)
    percent_part_net = percent_part_gross * factor

    pension_monthly = p.basic_amount + percent_part_net

    return {
        "inputs": {
            "ovz_monthly": ovz_monthly,
            "years": years,
            "year": year,
            "early_days": early_days,
        },
        "params": {
            "basic_amount": p.basic_amount,
            "rh1": p.rh1,
            "rh2": p.rh2,
            "pct_to_rh1": p.pct_to_rh1,
            "pct_between": p.pct_between,
            "pct_above": p.pct_above,
            "accrual_rate_per_year": p.accrual_rate_per_year,
            "early_reduction_per_90days": p.early_reduction_per_90days,
        },
        "results": {
            "reduced_base": rb,
            "percent_part_gross": percent_part_gross,
            "early_blocks_90days": blocks,
            "early_factor": factor,
            "percent_part_net": percent_part_net,
            "pension_monthly": pension_monthly,
        },
    }
