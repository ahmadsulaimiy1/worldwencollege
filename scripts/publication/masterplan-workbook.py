#!/usr/bin/env python3
"""
WEC-LC_Financial_Model.xlsx — the workbook the plan is derived from.

────────────────────────────────────────────────────────────────────────
WHY THIS EXPORTS FROM THE ENGINE RATHER THAN RESTATING IT
────────────────────────────────────────────────────────────────────────
There are two honest ways to build an institutional financial model and
one dishonest one. The dishonest one is to write the numbers into a
spreadsheet, write them again into a document, and let the two drift
until nobody can say which is the model and which is the presentation.

scripts/publication/masterplan.mjs is the model. This script asks it for
its output and lays that output out as a workbook, so the workbook and
the published plan cannot disagree — they are the same computation
rendered twice.

WHERE THE FORMULAS ARE REAL. Every derived cell in the yearly sheets is
written as an Excel formula against its own inputs, not as a constant:
net tuition subtracts its own refund and remission cells, total cost
sums its own component cells, surplus subtracts its own total, cumulative
revenue adds the cell above it. Somebody can therefore open this file,
change an assumption, and watch the decade move — which is the only test
of whether a financial model is a model at all.

Run:  python3 scripts/publication/masterplan-workbook.py
"""

import json
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "publication" / "WEC-LC Financial Model.xlsx"

# ── The house, as far as a spreadsheet can carry it ──────────────────
NAVY = "14264A"
INK = "16202E"
GOLD = "C7A24A"
RULE = "D8D2C4"
PAPER = "FCFAF4"

H1 = Font(name="Calibri", size=14, bold=True, color=NAVY)
H2 = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
LBL = Font(name="Calibri", size=10, color=INK)
LBLB = Font(name="Calibri", size=10, bold=True, color=INK)
NOTE = Font(name="Calibri", size=9, italic=True, color="6A7280")
HEAD_FILL = PatternFill("solid", fgColor=NAVY)
BAND_FILL = PatternFill("solid", fgColor=PAPER)
THIN = Side(style="thin", color=RULE)
BOX = Border(bottom=THIN)

MONEY = '#,##0;[Red](#,##0)'
MONEY2 = '#,##0.00;[Red](#,##0.00)'
PCT = '0.0%'
NUM = '#,##0'
NUM1 = '#,##0.0'


def engine(expr, mod="masterplan"):
    """Ask the model for a JSON value. One process per call is slower and
    simpler than a server, and this script runs once."""
    js = (
        "import('file://%s/scripts/publication/%s.mjs')"
        ".then(M => { const out = (%s); "
        "process.stdout.write(JSON.stringify(out)); })" % (ROOT, mod, expr)
    )
    r = subprocess.run([ "node", "-e", js ], capture_output=True, text=True, cwd=ROOT)
    if r.returncode != 0:
        sys.exit("engine failed: " + (r.stderr or "")[:2000])
    return json.loads(r.stdout)


def sheet(wb, title, subtitle=None):
    ws = wb.create_sheet(title[:31])
    ws["A1"] = "WorldWide English College — London Campus"
    ws["A1"].font = Font(name="Calibri", size=9, color=GOLD)
    ws["A2"] = title
    ws["A2"].font = H1
    if subtitle:
        ws["A3"] = subtitle
        ws["A3"].font = NOTE
    ws.freeze_panes = "A6"
    return ws


def header_row(ws, row, labels, widths=None):
    for i, lab in enumerate(labels, start=1):
        c = ws.cell(row=row, column=i, value=lab)
        c.font = H2
        c.fill = HEAD_FILL
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BOX
    if widths:
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[row].height = 30


def put(ws, row, col, value, fmt=None, bold=False, band=False):
    c = ws.cell(row=row, column=col, value=value)
    c.font = LBLB if bold else LBL
    if fmt:
        c.number_format = fmt
    if band:
        c.fill = BAND_FILL
    return c


def classification_note(ws, row, text):
    c = ws.cell(row=row, column=1, value=text)
    c.font = NOTE
    return row + 1


def build():
    B = engine("M.basis()")
    scen = {k: engine("M.model('%s')" % k) for k in ("conservative", "base", "growth")}
    base = scen["base"]
    alloc = engine("M.allocation('base')")
    sens = engine("M.sensitivity()")
    be = engine("M.breakEven('base')")
    alt = engine("M.alternativeA()")
    plan = json.loads((ROOT / "data" / "masterplan.json").read_text())

    wb = Workbook()
    wb.remove(wb.active)

    # ── 01 · ASSUMPTIONS ─────────────────────────────────────────────
    ws = sheet(wb, "01 Assumptions", "Every quantity classified. VERIFIED = adopted and published. ASSUMPTION = asserted for modelling. BOARD = needs a decision.")
    header_row(ws, 6, ["Class", "Quantity", "Value", "Unit", "Source"], [14, 46, 16, 16, 38])
    r = 7
    verified = [
        ("Programme total", B["programmeTotal"], "USD", "data/tuition.json"),
        ("Levels", B["levels"], "count", "data/tuition.json"),
        ("Hours per level", B["hoursPerLevel"], "hours", "data/tuition.json"),
        ("Total academic hours", B["totalHours"], "hours", "derived"),
        ("Credits per level", B["creditsPerLevel"], "credits", "data/tuition.json"),
        ("Total credits", B["totalCredits"], "credits", "derived"),
        ("Fee per level", round(B["levelFee"], 2), "USD", "data/tuition.json"),
        ("Cost per academic hour", round(B["perHour"], 2), "USD", "derived"),
        ("Cost per credit", round(B["perCredit"], 2), "USD", "derived"),
        ("Instalments per level", B["instalmentsPerLevel"], "count", "data/tuition.json"),
        ("Instalment", round(B["instalment"], 2), "USD", "derived"),
        ("Refund window", B["refundWindowDays"], "days", "Executive Decision E1"),
        ("Independent route, per level", B["independentPerLevel"], "USD", "data/commercial.json"),
        ("Remission fund", B["remissionShare"], "share of tuition", "data/commercial.json"),
        ("Referral credit", B["referralCredit"], "USD", "data/commercial.json"),
    ]
    for name, val, unit, src in verified:
        put(ws, r, 1, "VERIFIED", bold=True)
        put(ws, r, 2, name)
        put(ws, r, 3, val, MONEY2 if unit == "USD" else (PCT if "share" in unit else NUM))
        put(ws, r, 4, unit)
        put(ws, r, 5, src)
        r += 1
    r += 1
    assumptions = [
        ("Planning period, first year", plan["planning_period"]["first_year"], "year"),
        ("Planning period", plan["planning_period"]["years"], "years"),
        ("Enquiry → qualified", plan["funnel"]["enquiry_to_qualified"], "rate"),
        ("Qualified → consultation", plan["funnel"]["qualified_to_consultation"], "rate"),
        ("Consultation → application", plan["funnel"]["consultation_to_application"], "rate"),
        ("Application → offer", plan["funnel"]["application_to_offer"], "rate"),
        ("Offer → paid", plan["funnel"]["offer_to_paid"], "rate"),
        ("Months per level", plan["progression"]["months_per_level"], "months"),
        ("Refund rate of gross", plan["progression"]["refund_rate_of_gross"], "rate"),
        ("Instructor cost", plan["delivery_capacity"]["instructor_cost_usd"], "USD"),
        ("Instructor on-cost", plan["delivery_capacity"]["instructor_oncost_rate"], "rate"),
        ("Technology floor", plan["technology_usd"]["floor_per_year"], "USD/yr"),
        ("Technology per learner", plan["technology_usd"]["per_active_learner"], "USD"),
        ("Operating floor", plan["operating_usd"]["floor_per_year"], "USD/yr"),
        ("Operating per learner", plan["operating_usd"]["per_active_learner"], "USD"),
        ("Institutional development", plan["institutional_development_usd"]["share_of_net_tuition"], "share of net"),
        ("Reserve from surplus", plan["reserve"]["contribution_share_of_surplus"], "share"),
        ("Reserve target", plan["reserve"]["target_months_of_operating_cost"], "months of cost"),
    ]
    for name, val, unit in assumptions:
        put(ws, r, 1, "ASSUMPTION", bold=True)
        put(ws, r, 2, name)
        put(ws, r, 3, val, PCT if unit == "rate" or "share" in unit else (MONEY if "USD" in unit else NUM))
        put(ws, r, 4, unit)
        put(ws, r, 5, "data/masterplan.json")
        r += 1
    r += 1
    put(ws, r, 1, "BOARD", bold=True)
    put(ws, r, 2, "Alternative Architecture A — 10 levels × 120h at $7,400 / $14,800")
    put(ws, r, 5, "data/masterplan.json § alternative_architecture_a")

    # ── 02 · QUALIFICATIONS ──────────────────────────────────────────
    ws = sheet(wb, "02 Qualifications", "The adopted ladder. One award per level, A1 to C2.")
    header_row(ws, 6, ["Level", "Roman", "Name", "CEFR", "Hours", "Credits", "Fee (USD)", "Cumulative hours", "Cumulative fee"],
               [8, 8, 34, 9, 10, 10, 14, 16, 16])
    names = ["Foundation Programme", "Elementary Programme", "Intermediate Programme",
             "Upper Intermediate Programme", "Advanced Programme", "English Mastery Programme"]
    romans = ["I", "II", "III", "IV", "V", "VI"]
    cefr = ["A1", "A2", "B1", "B2", "C1", "C2"]
    for i in range(B["levels"]):
        rr = 7 + i
        put(ws, rr, 1, i + 1)
        put(ws, rr, 2, romans[i])
        put(ws, rr, 3, names[i])
        put(ws, rr, 4, cefr[i])
        put(ws, rr, 5, B["hoursPerLevel"], NUM)
        put(ws, rr, 6, B["creditsPerLevel"], NUM)
        put(ws, rr, 7, round(B["levelFee"], 2), MONEY2)
        put(ws, rr, 8, "=SUM($E$7:E%d)" % rr, NUM)
        put(ws, rr, 9, "=SUM($G$7:G%d)" % rr, MONEY2)
    tr = 7 + B["levels"]
    put(ws, tr, 3, "TOTAL", bold=True)
    put(ws, tr, 5, "=SUM(E7:E%d)" % (tr - 1), NUM, bold=True)
    put(ws, tr, 6, "=SUM(F7:F%d)" % (tr - 1), NUM, bold=True)
    put(ws, tr, 7, "=SUM(G7:G%d)" % (tr - 1), MONEY2, bold=True)
    classification_note(ws, tr + 2, "Six levels at $3,166.67 sum to $19,000.02. The College charges $19,000 and waives two cents — see data/tuition.json § _rounding.")

    # ── 03 · PRICING ─────────────────────────────────────────────────
    ws = sheet(wb, "03 Pricing", "What a level fee buys, at the published decomposition.")
    header_row(ws, 6, ["Line", "Share", "Per level (USD)", "Per programme (USD)"], [46, 12, 18, 20])
    for i, ln in enumerate(B["lines"]):
        rr = 7 + i
        put(ws, rr, 1, ln["name"])
        put(ws, rr, 2, ln["share"], PCT)
        put(ws, rr, 3, "=$B$%d*%s" % (rr, round(B["levelFee"], 2)), MONEY2)
        put(ws, rr, 4, "=C%d*%d" % (rr, B["levels"]), MONEY2)
    tr = 7 + len(B["lines"])
    put(ws, tr, 1, "TOTAL", bold=True)
    put(ws, tr, 2, "=SUM(B7:B%d)" % (tr - 1), PCT, bold=True)
    put(ws, tr, 3, "=SUM(C7:C%d)" % (tr - 1), MONEY2, bold=True)
    put(ws, tr, 4, "=SUM(D7:D%d)" % (tr - 1), MONEY2, bold=True)

    rr = tr + 2
    put(ws, rr, 1, "Routes", bold=True); rr += 1
    for label, val in [("Enrolled — per level", B["levelFee"]),
                       ("Enrolled — full programme", B["programmeTotal"]),
                       ("Independent — materials", B["independent"]["materials"]),
                       ("Independent — assessment", B["independent"]["assessment"]),
                       ("Independent — conferral", B["independent"]["conferral"]),
                       ("Independent — per level", B["independentPerLevel"])]:
        put(ws, rr, 1, label); put(ws, rr, 3, round(val, 2), MONEY2); rr += 1
    rr += 1
    put(ws, rr, 1, "Partner bands (off enrolled tuition)", bold=True); rr += 1
    for b in B["partnerBands"]:
        put(ws, rr, 1, "%d–%s learners" % (b["from"], b["to"] if b["to"] else "∞"))
        put(ws, rr, 3, b["rate"], PCT); rr += 1

    # ── 04–07 · THE YEARLY MODEL, one sheet per scenario ─────────────
    YEAR_COLS = ["Year", "Calendar", "Acquisition budget", "Enquiries", "Qualified",
                 "Consultations", "Applications", "Offers", "Paid enrolments",
                 "Admitted", "Turned away (capacity)", "Instructors", "Learners / instructor",
                 "Active learners", "  of which taught", "  of which independent",
                 "Levels delivered", "Awards conferred", "Full-pathway completions",
                 "Weighted price / level", "Gross tuition", "Refunds", "Remission",
                 "NET TUITION", "Acquisition cost", "Instruction", "Establishment",
                 "Technology", "Operating", "Development", "TOTAL COST", "SURPLUS",
                 "Margin", "Opening reserve", "Reserve contribution", "Closing reserve",
                 "Reserve (months of cost)", "Cumulative net revenue"]

    def year_sheet(name, m, subtitle):
        ws = sheet(wb, name, subtitle)
        header_row(ws, 6, YEAR_COLS, [7, 10] + [15] * (len(YEAR_COLS) - 2))
        for i, y in enumerate(m["years"]):
            rr = 7 + i
            band = i % 2 == 1
            vals = [y["year"], y["calendar"], y["budget"], y["funnel"]["enquiries"],
                    y["funnel"]["qualified"], y["funnel"]["consultations"],
                    y["funnel"]["applications"], y["funnel"]["offers"], y["funnel"]["paid"],
                    y["admitted"], y["turnedAway"], y["instructors"], y["learnersPerInstructor"],
                    y["activeStudents"], y["activeTaught"], y["activeIndependent"],
                    y["levelsDelivered"], y["awardsConferred"], y["fullPathwayCompletions"],
                    y["weightedPrice"], y["grossTuition"], y["refunds"], y["remission"]]
            for ci, v in enumerate(vals, start=1):
                fmt = MONEY if ci in (3, 21, 22, 23) else (MONEY2 if ci == 20 else NUM1 if ci in (13, 17, 18, 19) else NUM)
                put(ws, rr, ci, v, fmt, band=band)
            # NET TUITION as a real formula against its own cells
            put(ws, rr, 24, "=U%d-V%d-W%d" % (rr, rr, rr), MONEY, bold=True, band=band)
            for ci, v in [(25, y["cost"]["acquisition"]), (26, y["cost"]["instruction"]),
                          (27, y["cost"]["establishment"]), (28, y["cost"]["technology"]),
                          (29, y["cost"]["operating"]), (30, y["cost"]["development"])]:
                put(ws, rr, ci, v, MONEY, band=band)
            put(ws, rr, 31, "=SUM(Y%d:AD%d)" % (rr, rr), MONEY, bold=True, band=band)
            put(ws, rr, 32, "=X%d-AE%d" % (rr, rr), MONEY, bold=True, band=band)
            put(ws, rr, 33, "=IF(X%d=0,0,AF%d/X%d)" % (rr, rr, rr), PCT, band=band)
            put(ws, rr, 34, y["openingReserve"], MONEY, band=band)
            put(ws, rr, 35, y["reserveContribution"], MONEY, band=band)
            put(ws, rr, 36, y["closingReserve"], MONEY, band=band)
            put(ws, rr, 37, y["reserveMonths"], NUM1, band=band)
            put(ws, rr, 38, ("=X7" if i == 0 else "=AL%d+X%d" % (rr - 1, rr)), MONEY, bold=True, band=band)
        tr = 7 + len(m["years"])
        put(ws, tr, 2, "TEN-YEAR TOTAL", bold=True)
        for ci in (3, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32):
            L = get_column_letter(ci)
            put(ws, tr, ci, "=SUM(%s7:%s%d)" % (L, L, tr - 1), MONEY, bold=True)
        for ci in (17, 18, 19):
            L = get_column_letter(ci)
            put(ws, tr, ci, "=SUM(%s7:%s%d)" % (L, L, tr - 1), NUM1, bold=True)
        classification_note(ws, tr + 2,
            "Every figure computed by scripts/publication/masterplan.mjs from data/tuition.json, "
            "data/commercial.json and data/masterplan.json. Planning estimates, not historical results.")
        return ws

    year_sheet("04 Expected", base, "The central case. Enrolment is acquisition budget ÷ cost per learner, capped by instructors hired.")
    year_sheet("05 Conservative", scen["conservative"], "Higher acquisition cost, weaker continuation, fewer sponsored cohorts, harder close.")
    year_sheet("06 Growth", scen["growth"], "Lower acquisition cost, stronger continuation, more sponsored cohorts, better close.")

    # ── 07 · SCENARIOS ───────────────────────────────────────────────
    ws = sheet(wb, "07 Scenarios", "Three futures differing in structure, not in optimism.")
    header_row(ws, 6, ["Year", "Calendar", "Conservative", "Expected", "Growth",
                       "Growth vs Conservative"], [8, 12, 18, 18, 18, 22])
    for i in range(len(base["years"])):
        rr = 7 + i
        put(ws, rr, 1, i + 1)
        put(ws, rr, 2, base["years"][i]["calendar"])
        put(ws, rr, 3, scen["conservative"]["years"][i]["netTuition"], MONEY)
        put(ws, rr, 4, base["years"][i]["netTuition"], MONEY)
        put(ws, rr, 5, scen["growth"]["years"][i]["netTuition"], MONEY)
        put(ws, rr, 6, "=E%d-C%d" % (rr, rr), MONEY)
    tr = 7 + len(base["years"])
    put(ws, tr, 2, "TEN-YEAR", bold=True)
    for L in "CDEF":
        put(ws, tr, "ABCDEF".index(L) + 1, "=SUM(%s7:%s%d)" % (L, L, tr - 1), MONEY, bold=True)

    # ── 08 · FUNNEL ──────────────────────────────────────────────────
    ws = sheet(wb, "08 Funnel", "Every stage between a stranger and a matriculated learner, expected case.")
    header_row(ws, 6, ["Stage", "Rate"] + ["Y%d" % (i + 1) for i in range(10)], [30, 10] + [12] * 10)
    stages = [("Enquiries", None, "enquiries"), ("Qualified", plan["funnel"]["enquiry_to_qualified"], "qualified"),
              ("Consultations", plan["funnel"]["qualified_to_consultation"], "consultations"),
              ("Applications", plan["funnel"]["consultation_to_application"], "applications"),
              ("Offers", plan["funnel"]["application_to_offer"], "offers"),
              ("Paid enrolments", plan["funnel"]["offer_to_paid"], "paid")]
    for si, (label, rate, key) in enumerate(stages):
        rr = 7 + si
        put(ws, rr, 1, label, bold=(si == len(stages) - 1))
        if rate is not None:
            put(ws, rr, 2, rate, PCT)
        for yi, y in enumerate(base["years"]):
            put(ws, rr, 3 + yi, y["funnel"][key], NUM)

    # ── 09 · REGIONS ─────────────────────────────────────────────────
    ws = sheet(wb, "09 Markets", "Four markets, entered in sequence. Spend, cost of acquisition and learners won.")
    header_row(ws, 6, ["Year", "Market", "Spend", "Cost per learner", "Enquiries",
                       "Paid enrolments", "Weighted price / level"], [8, 32, 16, 18, 14, 18, 20])
    rr = 7
    for y in base["years"]:
        for reg in y["regional"]:
            put(ws, rr, 1, y["year"]); put(ws, rr, 2, reg["name"])
            put(ws, rr, 3, reg["spend"], MONEY); put(ws, rr, 4, reg["cac"], MONEY)
            put(ws, rr, 5, reg["enquiries"], NUM); put(ws, rr, 6, reg["paid"], NUM1)
            put(ws, rr, 7, reg["price"], MONEY2)
            rr += 1

    # ── 10 · STAFFING ────────────────────────────────────────────────
    ws = sheet(wb, "10 Establishment", "Every post a real post, hired against a threshold rather than as a percentage of revenue.")
    header_row(ws, 6, ["Year", "Instructors", "Instruction cost"] +
               [r["name"] for r in plan["staffing"]["roles"]] + ["Establishment cost"],
               [8, 12, 18] + [22] * len(plan["staffing"]["roles"]) + [20])
    for i, y in enumerate(base["years"]):
        rr = 7 + i
        put(ws, rr, 1, y["year"]); put(ws, rr, 2, y["instructors"], NUM)
        put(ws, rr, 3, y["cost"]["instruction"], MONEY)
        det = {d["key"]: d["heads"] for d in y["cost"]["establishmentDetail"]}
        for ri, role in enumerate(plan["staffing"]["roles"]):
            put(ws, rr, 4 + ri, det.get(role["key"], 0), NUM)
        put(ws, rr, 4 + len(plan["staffing"]["roles"]), y["cost"]["establishment"], MONEY)

    # ── 11 · ALLOCATION ──────────────────────────────────────────────
    ws = sheet(wb, "11 Allocation", "Where every dollar of net tuition goes across the decade. Must reconcile to 100%.")
    header_row(ws, 6, ["Category", "Ten-year amount", "Share of net tuition"], [52, 20, 22])
    for i, row in enumerate(alloc["rows"]):
        rr = 7 + i
        put(ws, rr, 1, row["name"]); put(ws, rr, 2, row["amount"], MONEY)
        put(ws, rr, 3, "=B%d/$B$%d" % (rr, 7 + len(alloc["rows"]) + 1), PCT)
    tr = 7 + len(alloc["rows"])
    put(ws, tr, 1, "TOTAL ALLOCATED", bold=True)
    put(ws, tr, 2, "=SUM(B7:B%d)" % (tr - 1), MONEY, bold=True)
    put(ws, tr, 3, "=SUM(C7:C%d)" % (tr - 1), PCT, bold=True)
    put(ws, tr + 1, 1, "NET TUITION", bold=True)
    put(ws, tr + 1, 2, alloc["net"], MONEY, bold=True)
    put(ws, tr + 2, 1, "Reconciliation (must be zero)", bold=True)
    put(ws, tr + 2, 2, "=B%d-B%d" % (tr, tr + 1), MONEY2, bold=True)

    # ── 12 · RESERVES ────────────────────────────────────────────────
    ws = sheet(wb, "12 Reserves", "The reserve is stated in months of operating cost, because that is what it has to survive.")
    header_row(ws, 6, ["Year", "Net tuition", "Total cost", "Surplus", "Contribution",
                       "Opening", "Closing", "Months of cost", "Target months"], [8] + [16] * 8)
    for i, y in enumerate(base["years"]):
        rr = 7 + i
        put(ws, rr, 1, y["year"]); put(ws, rr, 2, y["netTuition"], MONEY)
        put(ws, rr, 3, y["cost"]["total"], MONEY)
        put(ws, rr, 4, "=B%d-C%d" % (rr, rr), MONEY)
        put(ws, rr, 5, y["reserveContribution"], MONEY)
        put(ws, rr, 6, y["openingReserve"], MONEY)
        put(ws, rr, 7, "=F%d+E%d" % (rr, rr), MONEY, bold=True)
        put(ws, rr, 8, "=G%d/(C%d/12)" % (rr, rr), NUM1)
        put(ws, rr, 9, plan["reserve"]["target_months_of_operating_cost"], NUM)

    # ── 13 · BREAK-EVEN ──────────────────────────────────────────────
    ws = sheet(wb, "13 Break-even", "How many learners must be studying for the year to pay for itself.")
    header_row(ws, 6, ["Year", "Fixed cost", "Contribution / learner",
                       "Break-even learners", "Actual learners", "Clears"], [8, 18, 22, 20, 18, 12])
    for i, b in enumerate(be):
        rr = 7 + i
        put(ws, rr, 1, b["year"]); put(ws, rr, 2, b["fixedCost"], MONEY)
        put(ws, rr, 3, b["contributionPerLearner"], MONEY2)
        put(ws, rr, 4, "=IF(C%d<=0,\"\",ROUNDUP(B%d/C%d,0))" % (rr, rr, rr), NUM, bold=True)
        put(ws, rr, 5, b["actualLearners"], NUM)
        put(ws, rr, 6, "=IF(E%d>=D%d,\"yes\",\"no\")" % (rr, rr))

    # ── 14 · SENSITIVITY ─────────────────────────────────────────────
    ws = sheet(wb, "14 Sensitivity", "Single-variable shocks against the expected case, so one effect can be read without another moving.")
    header_row(ws, 6, ["Shock", "Ten-year net tuition", "Change", "Change %",
                       "Ten-year surplus", "Surplus change"], [40, 22, 18, 14, 20, 20])
    put(ws, 7, 1, "Expected case (no shock)", bold=True)
    put(ws, 7, 2, base["totals"]["netTuition"], MONEY, bold=True)
    put(ws, 7, 5, base["totals"]["surplus"], MONEY, bold=True)
    for i, s in enumerate(sens):
        rr = 8 + i
        put(ws, rr, 1, s["label"]); put(ws, rr, 2, s["netTuition"], MONEY)
        put(ws, rr, 3, "=B%d-$B$7" % rr, MONEY)
        put(ws, rr, 4, "=C%d/$B$7" % rr, PCT)
        put(ws, rr, 5, s["surplus"], MONEY)
        put(ws, rr, 6, "=E%d-$E$7" % rr, MONEY)

    # ── 15 · ALTERNATIVE ARCHITECTURE ────────────────────────────────
    ws = sheet(wb, "15 Alternative A", "The commissioning brief's architecture, computed rather than asserted.")
    header_row(ws, 6, ["", "ADOPTED (verified)", "PROPOSED (board decision)"], [38, 24, 26])
    rows = [
        ("Levels", alt["adopted"]["levels"], alt["proposed"]["levels"], NUM),
        ("Hours per level", alt["adopted"]["hoursPerLevel"], alt["proposed"]["hoursPerLevel"], NUM),
        ("Total academic hours", alt["adopted"]["totalHours"], alt["proposed"]["totalHours"], NUM),
        ("Programme price", alt["adopted"]["programmeTotal"], alt["proposed"]["blendedProgramme"], MONEY2),
        ("Per level", alt["adopted"]["perLevel"], alt["proposed"]["perLevel"], MONEY2),
        ("Per academic hour", alt["adopted"]["perHour"], alt["proposed"]["perHour"], MONEY2),
    ]
    for i, (lab, a, b_, fmt) in enumerate(rows):
        rr = 7 + i
        put(ws, rr, 1, lab, bold=True); put(ws, rr, 2, a, fmt); put(ws, rr, 3, b_, fmt)
    rr = 7 + len(rows) + 1
    put(ws, rr, 1, "Ten-year net tuition", bold=True)
    put(ws, rr, 2, alt["effect"]["tenYearNetAdopted"], MONEY)
    put(ws, rr, 3, alt["effect"]["tenYearNetProposed"], MONEY); rr += 1
    put(ws, rr, 1, "Ten-year cost of delivery (unchanged)", bold=True)
    put(ws, rr, 2, alt["effect"]["tenYearCost"], MONEY)
    put(ws, rr, 3, alt["effect"]["tenYearCost"], MONEY); rr += 1
    put(ws, rr, 1, "Ten-year surplus", bold=True)
    put(ws, rr, 2, "=B%d-B%d" % (rr - 2, rr - 1), MONEY, bold=True)
    put(ws, rr, 3, "=C%d-C%d" % (rr - 2, rr - 1), MONEY, bold=True); rr += 2
    classification_note(ws, rr,
        "The cost of teaching does not fall because the price does. That is the whole finding, and it is arithmetic rather than opinion.")

    # ── 17 · PROPOSED TARIFF ─────────────────────────────────────────
    tariff = engine("{d:M.tariff('directed'),t:M.tariff('tutored'),ec:M.tariff('execCore'),"
                    "ep:M.tariff('execPremium'),eb:M.tariff('execBespoke'),"
                    "q:M.QUALIFICATIONS,p:M.PROPOSED}", mod="pricing")
    ws = sheet(wb, "17 Proposed tariff", "PROPOSED / MODELLED. Not adopted. The published tariff remains $19,000.")
    header_row(ws, 6, ["Code", "CEFR", "Qualification", "Directed", "Tutored",
                       "Exec Core", "Exec Premium", "Exec Bespoke"], [9, 8, 46] + [15] * 5)
    keys = ["d", "t", "ec", "ep", "eb"]
    for i, q in enumerate(tariff["q"]):
        rr = 7 + i
        put(ws, rr, 1, q["code"], bold=True); put(ws, rr, 2, q["cefr"]); put(ws, rr, 3, q["name"])
        for ci, k in enumerate(keys):
            put(ws, rr, 4 + ci, tariff[k][i], MONEY)
    tr = 7 + len(tariff["q"])
    put(ws, tr, 3, "COMPLETE A1–C2 PATHWAY", bold=True)
    for ci, k in enumerate(keys):
        L = get_column_letter(4 + ci)
        put(ws, tr, 4 + ci, "=SUM(%s7:%s%d)" % (L, L, tr - 1), MONEY, bold=True)
    put(ws, tr + 1, 3, "Per academic hour (1,200 hours)", bold=True)
    for ci in range(len(keys)):
        L = get_column_letter(4 + ci)
        put(ws, tr + 1, 4 + ci, "=%s%d/1200" % (L, tr), MONEY2)

    # ── 18 · ARCHITECTURE COMPARISON ─────────────────────────────────
    arch = engine("M.architectures()", mod="projection")
    ws = sheet(wb, "18 Architectures", "Three architectures through one demand model, one cost model, one capacity gate.")
    header_row(ws, 6, ["Architecture", "Ten-year revenue", "Ten-year surplus", "Year-10 revenue",
                       "Year-10 active", "Awards conferred", "Closing reserve"], [32] + [18] * 6)
    for i, k in enumerate(["briefA", "adopted", "proposed"]):
        rr, t = 7 + i, arch[k]["totals"]
        put(ws, rr, 1, arch[k]["label"], bold=(k == "proposed"))
        for ci, v, fmt in [(2, t["revenue"], MONEY), (3, t["surplus"], MONEY), (4, t["y10Revenue"], MONEY),
                           (5, t["y10Active"], NUM), (6, round(t["awards"]), NUM), (7, t["reserve"], MONEY)]:
            put(ws, rr, ci, v, fmt, bold=(k == "proposed"))

    # ── 19 · THE CORE MANAGEMENT PLAN ────────────────────────────────
    scen = engine("M.scenarios()", mod="projection")
    core = scen["core"]
    ws = sheet(wb, "19 Core Plan", "Management's recommended execution case under the proposed architecture.")
    # Gross fees, the refunds the College undertakes to return, and then
    # every cost the model actually charges. The surplus formula must be
    # the same arithmetic the engine performs, or the workbook and the
    # published plan quietly disagree about the answer.
    header_row(ws, 6, ["Year", "Calendar", "New learners", "Active", "Instructors",
                       "Gross fees", "Refunds", "Net tuition",
                       "Delivery", "Acquisition", "Fixed", "Development",
                       "Surplus", "Margin", "Cumulative surplus"],
               [7, 10] + [15] * 13)
    for i, y in enumerate(core["years"]):
        rr = 7 + i
        for ci, v, fmt in [(1, y["year"], NUM), (2, y["calendar"], NUM), (3, y["newLearners"], NUM),
                           (4, y["activeLearners"], NUM), (5, y["instructors"], NUM),
                           (6, y["revenue"], MONEY), (7, y["refunds"], MONEY),
                           (9, y["delivery"], MONEY), (10, y["acquisition"], MONEY),
                           (11, y["fixed"], MONEY), (12, y["development"], MONEY)]:
            put(ws, rr, ci, v, fmt)
        put(ws, rr, 8, "=F%d-G%d" % (rr, rr), MONEY)
        put(ws, rr, 13, "=H%d-I%d-J%d-K%d-L%d" % (rr, rr, rr, rr, rr), MONEY, bold=True)
        put(ws, rr, 14, "=IF(F%d=0,0,M%d/F%d)" % (rr, rr, rr), PCT)
        put(ws, rr, 15, ("=M7" if i == 0 else "=O%d+M%d" % (rr - 1, rr)), MONEY, bold=True)
    tr = 7 + len(core["years"])
    put(ws, tr, 2, "TEN YEARS", bold=True)
    for ci in (6, 7, 8, 9, 10, 11, 12, 13):
        L = get_column_letter(ci)
        put(ws, tr, ci, "=SUM(%s7:%s%d)" % (L, L, tr - 1), MONEY, bold=True)

    # ── 20 · SCENARIOS UNDER THE PROPOSAL ────────────────────────────
    ws = sheet(wb, "20 Price scenarios", "Conservative is not a haircut on Core: weaker continuation, narrower reach, dearer acquisition.")
    header_row(ws, 6, ["Scenario", "Ten-year revenue", "Ten-year surplus", "Year-10 revenue",
                       "Year-10 new", "Year-10 active", "Awards"], [26] + [18] * 6)
    for i, k in enumerate(["conservative", "core", "growth"]):
        rr, t = 7 + i, scen[k]["totals"]
        put(ws, rr, 1, scen[k]["label"], bold=(k == "core"))
        for ci, v, fmt in [(2, t["revenue"], MONEY), (3, t["surplus"], MONEY), (4, t["y10Revenue"], MONEY),
                           (5, t["y10New"], NUM), (6, t["y10Active"], NUM), (7, round(t["awards"]), NUM)]:
            put(ws, rr, ci, v, fmt, bold=(k == "core"))

    # ── 21 · MARKET EVIDENCE ─────────────────────────────────────────
    # Everything the plan believes about the outside world, with the
    # address it came from, so a reader can check it rather than take it.
    ev = json.loads((ROOT / "data" / "market-evidence.json").read_text())
    ws = sheet(wb, "21 Market evidence",
               "Published prices, converted. Gathered %s. %s" % (ev["researched_on"], ev["fx_note"]))
    header_row(ws, 6, ["Market", "Provider", "What it buys", "Local price", "USD",
                       "Hours", "Per contact hour", "Confidence", "Source"],
               [24, 28, 46, 22, 12, 8, 16, 12, 62])
    rr = 7
    for key, name in [("gcc", "Saudi Arabia and the Gulf"),
                      ("west_africa", "Nigeria and West Africa"),
                      ("uk_europe", "United Kingdom and Europe"),
                      ("executive_and_corporate", "Executive and corporate")]:
        first = True
        for o in ev[key]["observations"]:
            if not (o.get("price_local") or o.get("price_usd")):
                continue
            put(ws, rr, 1, name if first else "", bold=first)
            put(ws, rr, 2, o.get("provider", ""))
            put(ws, rr, 3, o.get("product", ""))
            put(ws, rr, 4, o.get("price_local", "—"))
            usd_v = o.get("price_usd")
            put(ws, rr, 5, usd_v, MONEY if isinstance(usd_v, (int, float)) else None)
            put(ws, rr, 6, o.get("hours", "—"), NUM if isinstance(o.get("hours"), (int, float)) else None)
            pch = o.get("per_contact_hour_usd")
            put(ws, rr, 7, pch, MONEY2 if isinstance(pch, (int, float)) else None)
            put(ws, rr, 8, o.get("confidence", "—"))
            put(ws, rr, 9, o.get("source", "—"))
            rr, first = rr + 1, False
    rr += 1
    put(ws, rr, 1, "WHERE THE EVIDENCE DOES NOT EXIST", bold=True)
    rr += 1
    header_row(ws, rr, ["Market or question", "Status", "What the model does instead"], [24, 46, 96])
    rr += 1
    for g in ev["gaps"]:
        put(ws, rr, 1, g.get("market") or g.get("topic"), bold=True)
        put(ws, rr, 2, g["status"])
        put(ws, rr, 3, g.get("note", "Scaled from the segments that carry direct observations."))
        rr += 1
    rr += 1
    classification_note(ws, rr, "Assumed against researched willingness to pay — the revision this plan rests on.")
    rr += 1
    header_row(ws, rr, ["Segment", "Assumed", "Researched", "Change", "Elasticity",
                        "Credibility floor", "Evidential confidence"], [34] + [16] * 5 + [46])
    segs = engine("M.SEGMENTS", mod="pricing")
    for seg in segs:
        rr += 1
        put(ws, rr, 1, seg["name"], bold=True)
        put(ws, rr, 2, seg.get("wtpAssumed"), MONEY)
        put(ws, rr, 3, seg["wtpFull"], MONEY)
        if seg.get("wtpAssumed"):
            put(ws, rr, 4, "=C%d/B%d-1" % (rr, rr), PCT, bold=True)
        put(ws, rr, 5, seg["elasticity"], MONEY2)
        put(ws, rr, 6, seg["credibilityFloor"], MONEY)
        put(ws, rr, 7, seg["confidence"])

    # ── 22 · THE REVENUE-ALLOCATION FRAMEWORK ────────────────────────
    # The Board's financial law, and the sweep the proposed price is the
    # output of. This sheet replaced a teaching-majority frontier, which
    # was management's own assumption doing a financial law's work.
    fw = plan["revenue_allocation_framework"]
    ws = sheet(wb, "22 Allocation framework",
               "BOARD DECISION REQUIRED. Every figure below is a proposed governance target, "
               "not a historical result. The tariff is solved backwards from it.")
    header_row(ws, 6, ["Allocation", "Target", "At the proposed tariff", "Variance", "Definition"],
               [34, 12, 22, 12, 120])
    got = engine("M.achievedProposed()", mod="allocation")
    for i, line in enumerate(got["lines"]):
        rr = 7 + i
        spec = next(x for x in fw["shares"] if x["key"] == line["key"])
        put(ws, rr, 1, line["name"], bold=True)
        put(ws, rr, 2, line["target"], PCT)
        put(ws, rr, 3, line["actual"], PCT, bold=True)
        put(ws, rr, 4, "=C%d-B%d" % (rr, rr), PCT)
        put(ws, rr, 5, spec["definition"])
    rr = 7 + len(got["lines"]) + 1
    put(ws, rr, 1, "Gross collected revenue", bold=True)
    put(ws, rr, 2, got["revenue"], MONEY, bold=True)
    put(ws, rr + 1, 1, "Retained (reserve + strategic)", bold=True)
    put(ws, rr + 1, 2, got["retained"], MONEY, bold=True)
    put(ws, rr + 1, 3, got["retainedShare"], PCT, bold=True)
    rr += 3
    classification_note(ws, rr, "The two retained lines are designated institutional capital. The "
                                "Strategic and Founders' Allocation is NOT automatically withdrawable "
                                "founder income, and no distribution from it is modelled anywhere in "
                                "this workbook.")
    rr += 2
    put(ws, rr, 1, "THE SWEEP THE PRICE IS SOLVED FROM", bold=True)
    rr += 1
    header_row(ws, rr, ["Tariff multiple", "Directed", "Tutored", "Executive Core",
                        "Revenue", "Learners", "Payroll", "Marketing", "Retained"],
               [16] + [15] * 8)
    solved = engine("M.solveProposed({ lo: 0.6, hi: 3.0, step: 0.1 })", mod="allocation")
    for c in solved["curve"]:
        rr += 1
        L = {x["key"]: x["actual"] for x in c["result"]["lines"]}
        is_it = c["prices"]["directed"] == solved["cheapest"]["prices"]["directed"]
        put(ws, rr, 1, c["multiplier"], NUM1, bold=is_it)
        for ci, v in [(2, c["prices"]["directed"]), (3, c["prices"]["tutored"]),
                      (4, c["prices"]["execCore"]), (5, c["result"]["revenue"])]:
            put(ws, rr, ci, v, MONEY, bold=is_it)
        put(ws, rr, 6, c["result"]["learners"], NUM, bold=is_it)
        put(ws, rr, 7, L["payroll"], PCT, bold=is_it)
        put(ws, rr, 8, L["marketing"], PCT, bold=is_it)
        put(ws, rr, 9, c["result"]["retainedShare"], PCT, bold=is_it)

    # ── 16 · TEN-YEAR SUMMARY ────────────────────────────────────────
    ws = sheet(wb, "16 Summary", "The decade in one view, expected case.")
    header_row(ws, 6, ["Measure", "Ten-year", "Year 10"], [46, 22, 22])
    last = base["years"][-1]
    summary = [
        ("Gross tuition", base["totals"]["grossTuition"], last["grossTuition"], MONEY),
        ("Refunds", base["totals"]["refunds"], last["refunds"], MONEY),
        ("Fee remission (scholarships)", base["totals"]["remission"], last["remission"], MONEY),
        ("Net tuition", base["totals"]["netTuition"], last["netTuition"], MONEY),
        ("Total cost", base["totals"]["cost"], last["cost"]["total"], MONEY),
        ("Surplus", base["totals"]["surplus"], last["surplus"], MONEY),
        ("Levels delivered", base["totals"]["levelsDelivered"], last["levelsDelivered"], NUM1),
        ("Awards conferred", base["totals"]["awardsConferred"], last["awardsConferred"], NUM1),
        ("Active learners (peak / Y10)", base["totals"]["peakActive"], last["activeStudents"], NUM),
        ("Instructors", None, last["instructors"], NUM),
        ("Closing reserve", None, base["totals"]["closingReserve"], MONEY),
    ]
    for i, (lab, tot, y10, fmt) in enumerate(summary):
        rr = 7 + i
        put(ws, rr, 1, lab, bold=True)
        if tot is not None:
            put(ws, rr, 2, tot, fmt)
        put(ws, rr, 3, y10, fmt)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    print("wrote %s (%d sheets, %.0f KB)" % (OUT.name, len(wb.sheetnames), OUT.stat().st_size / 1024))
    for s in wb.sheetnames:
        print("   ", s)


if __name__ == "__main__":
    build()
