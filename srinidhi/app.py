"""
PulseDesk — AI-triaged internal support desk (Streamlit edition)

Run with:
    streamlit run app.py

Needs an ANTHROPIC_API_KEY environment variable (or paste one into the
sidebar when the app starts) to power the "Analyze with AI" and chat
features. Everything else works without it.

--------------------------------------------------------------------------
PREMIUM UI REDESIGN NOTE:
Every function name, session_state key, Ollama call, database write, and
piece of business/auth logic below is IDENTICAL to the original file.
Only presentation changed: CSS, HTML wrapping inside st.markdown(), layout
(columns/containers), and native Streamlit widgets (st.metric, st.bar_chart,
st.dataframe) swapped for styled/Plotly equivalents that render the exact
same underlying data.
--------------------------------------------------------------------------
"""

import os
import json
import time
from datetime import datetime

from crud import create_ticket

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from dotenv import load_dotenv

load_dotenv()

try:
    import ollama
except ImportError:
    ollama = None

# Make sure the model is pulled first: `ollama pull llama3.2`
OLLAMA_MODEL = "llama3.2"

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------
DATA_FILE = os.path.join(os.path.dirname(__file__), "pulsedesk_data.json")
DEPARTMENTS = ["IT", "HR", "Finance", "Operations", "Sales", "Marketing", "Facilities"]
STATUSES = ["Open", "In Progress", "Resolved", "Closed"]

# ---- Theme system — dark / light, remembered via the page's URL ----
# (query param survives refresh/bookmark within a browser tab; Streamlit has
#  no built-in cross-session storage without adding a JS/localStorage
#  dependency, so this is the dependency-free way to "remember" a choice.)
def _hex_to_rgb(hex_color):
    h = hex_color.lstrip("#")
    return f"{int(h[0:2], 16)},{int(h[2:4], 16)},{int(h[4:6], 16)}"


def _get_theme():
    t = st.query_params.get("theme", "dark")
    return t if t in ("dark", "light") else "dark"


def _set_theme(new_theme):
    st.query_params["theme"] = new_theme


THEME = _get_theme()

SUCCESS = "#10B981"
WARNING = "#F59E0B"
DANGER = "#EF4444"

if THEME == "light":
    PRIMARY = "#2563EB"
    SECONDARY = "#1D4ED8"          # deeper blue for contrast on white
    BG = "#F3F7FC"
    SIDEBAR_TOP = "#FFFFFF"
    SURFACE = "#FFFFFF"
    TEXT = "#0B1B33"
    MUTED = "#5B7495"
    BORDER_RGB = "15,35,65"
    BORDER_ALPHA = 0.10
    CARD_BG_ALPHA = 0.85
    INPUT_BG_ALPHA = 0.9
    GLOW_ALPHA_1, GLOW_ALPHA_2 = 0.07, 0.06
    SHADOW_RGB, SHADOW_ALPHA = "30,41,59", 0.10
else:
    PRIMARY = "#2563EB"
    SECONDARY = "#60A5FA"          # light blue pops on dark bg
    BG = "#0A1628"
    SIDEBAR_TOP = "#0E2038"
    SURFACE = "#132540"
    TEXT = "#EEF4FC"
    MUTED = "#8FAFD6"
    BORDER_RGB = "255,255,255"
    BORDER_ALPHA = 0.08
    CARD_BG_ALPHA = 0.55
    INPUT_BG_ALPHA = 0.65
    GLOW_ALPHA_1, GLOW_ALPHA_2 = 0.12, 0.10
    SHADOW_RGB, SHADOW_ALPHA = "0,0,0", 0.25

PRIMARY_RGB = _hex_to_rgb(PRIMARY)
SECONDARY_RGB = _hex_to_rgb(SECONDARY)
SURFACE_RGB = _hex_to_rgb(SURFACE)

PRIORITY_COLORS = {"Critical": DANGER, "High": DANGER, "Medium": WARNING, "Low": SUCCESS}
SENTIMENT_COLORS = {"Negative": DANGER, "Neutral": MUTED, "Positive": SUCCESS}
STATUS_COLORS = {"Open": DANGER, "In Progress": WARNING, "Resolved": SUCCESS, "Closed": MUTED}
CATEGORY_COLORS = {"Hardware": PRIMARY, "Software": SUCCESS, "Network": WARNING, "Access": DANGER, "Other": MUTED}
CATEGORY_ICONS = {"Hardware": "💾", "Software": "🖥️", "Network": "📶", "Access": "🔐", "Other": "❔"}
STATUS_ICONS = {"Open": "🟡", "In Progress": "🔵", "Resolved": "🟢", "Closed": "⚪"}

st.set_page_config(page_title="PulseDesk", page_icon="🎫", layout="wide")


def render_theme_toggle(key):
    # Label describes what the click DOES (switch to the other mode), not the current state
    icon = "☀️" if THEME == "dark" else "🌙"
    target = "Light" if THEME == "dark" else "Dark"
    if st.button(f"{icon}  Switch to {target}", key=key, help="Toggle dark / light mode"):
        _set_theme("light" if THEME == "dark" else "dark")
        st.rerun()

# --------------------------------------------------------------------------
# Premium styling — glassmorphism, gradients, animated cards
# (presentation only: no python logic lives in this block)
# --------------------------------------------------------------------------
st.markdown(
    f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

    html {{ scroll-behavior: smooth; }}
    html, body, [class*="css"] {{ font-family: 'Inter', sans-serif; }}

    .stApp {{
        background:
            radial-gradient(circle at 15% 0%, rgba({PRIMARY_RGB},{GLOW_ALPHA_1}) 0%, transparent 40%),
            radial-gradient(circle at 85% 10%, rgba({SECONDARY_RGB},{GLOW_ALPHA_2}) 0%, transparent 40%),
            {BG};
        color: {TEXT};
        transition: background-color .35s ease, color .35s ease;
    }}
    #MainMenu, footer {{ visibility: hidden; }}
    .block-container {{ padding-top: 1.6rem; padding-bottom: 3rem; max-width: 1220px; animation: pdFadeIn 0.45s ease; }}

    @keyframes pdFadeIn {{ from {{ opacity: 0; transform: translateY(8px); }} to {{ opacity: 1; transform: translateY(0); }} }}
    @keyframes pdPulse {{ 0%,100% {{ opacity: 1; }} 50% {{ opacity: 0.4; }} }}
    @keyframes pdFloat {{ 0%,100% {{ transform: translateY(0px); }} 50% {{ transform: translateY(-8px); }} }}
    @keyframes pdScaleIn {{ from {{ opacity: 0; transform: scale(0.96); }} to {{ opacity: 1; transform: scale(1); }} }}

    h1, h2, h3, h4 {{ font-family: 'Space Grotesk', sans-serif !important; letter-spacing: -0.3px; }}

    /* ---------- Sidebar ---------- */
    section[data-testid="stSidebar"] {{
        background: linear-gradient(180deg, {SIDEBAR_TOP} 0%, {BG} 100%) !important;
        border-right: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA});
    }}
    section[data-testid="stSidebar"] * {{ color: {TEXT} !important; }}
    section[data-testid="stSidebar"] .block-container {{ padding-top: 1.1rem; }}

    /* ---------- Buttons ---------- */
    .stButton>button, .stFormSubmitButton>button {{
        background: linear-gradient(135deg, {PRIMARY}, {SECONDARY});
        color: #fff !important; border: none; border-radius: 12px;
        font-weight: 600; font-size: 13.5px; padding: 0.55rem 1.2rem;
        transition: transform .18s ease, box-shadow .18s ease;
        box-shadow: 0 2px 10px rgba({PRIMARY_RGB},0.25);
    }}
    .stButton>button:hover, .stFormSubmitButton>button:hover {{
        transform: translateY(-2px); box-shadow: 0 8px 24px rgba({PRIMARY_RGB},0.45);
    }}
    .stButton>button:active {{ transform: translateY(0) scale(0.98); }}
    .stDownloadButton>button {{
        background: rgba({SURFACE_RGB},0.5); color: {TEXT} !important;
        border: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA * 1.5}); border-radius: 12px;
    }}

    /* ---------- Inputs ---------- */
    input, textarea, .stSelectbox div[data-baseweb="select"] > div, .stMultiSelect div[data-baseweb="select"] > div {{
        background: rgba({SURFACE_RGB},{INPUT_BG_ALPHA}) !important; color: {TEXT} !important;
        border: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA * 1.3}) !important; border-radius: 12px !important;
        transition: border-color .15s ease, box-shadow .15s ease;
    }}
    input:focus, textarea:focus {{ border-color: {PRIMARY} !important; box-shadow: 0 0 0 3px rgba({PRIMARY_RGB},0.18) !important; }}

    /* ---------- Glass containers (st.container) ---------- */
    div[data-testid="stVerticalBlockBorderWrapper"] {{
        background: rgba({SURFACE_RGB},{CARD_BG_ALPHA}) !important;
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA}) !important;
        border-radius: 18px !important;
        box-shadow: 0 8px 28px rgba({SHADOW_RGB},{SHADOW_ALPHA});
        transition: transform .2s ease, box-shadow .2s ease;
        animation: pdScaleIn 0.35s ease;
    }}
    div[data-testid="stVerticalBlockBorderWrapper"]:hover {{
        transform: translateY(-2px); box-shadow: 0 14px 36px rgba({PRIMARY_RGB},0.16);
    }}

    /* ---------- Expanders ---------- */
    details {{
        background: rgba({SURFACE_RGB},{CARD_BG_ALPHA}) !important; border-radius: 14px !important;
        border: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA}) !important; overflow: hidden;
    }}
    summary {{ font-weight: 600 !important; }}

    /* ---------- Native alerts (success/error/warning/info) ---------- */
    div[data-testid="stAlert"] {{
        border-radius: 14px !important; backdrop-filter: blur(10px);
        animation: pdFadeIn 0.3s ease; border: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA}) !important;
    }}

    /* ---------- Spinner ---------- */
    div[data-testid="stSpinner"] {{ animation: pdFadeIn 0.25s ease; }}

    /* ---------- Radio-as-nav (sidebar) ---------- */
    section[data-testid="stSidebar"] div[role="radiogroup"] {{ gap: 3px; }}
    section[data-testid="stSidebar"] div[role="radiogroup"] label {{
        border-radius: 10px !important; padding: 8px 10px !important; margin: 0 !important;
        transition: background .15s ease;
    }}
    section[data-testid="stSidebar"] div[role="radiogroup"] label:hover {{ background: rgba({PRIMARY_RGB},0.10); }}

    /* ---------- Dataframe polish ---------- */
    div[data-testid="stDataFrame"] {{ border-radius: 14px; overflow: hidden; }}

    /* ---------- Custom component classes ---------- */
    .pd-badge {{
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 11px; border-radius: 999px;
        font-size: 11px; font-weight: 700; font-family: 'IBM Plex Mono', monospace;
        margin-right: 4px; color: white; letter-spacing: .2px;
    }}
    .pd-summary-box {{
        background: linear-gradient(135deg, rgba({PRIMARY_RGB},0.14), rgba({SECONDARY_RGB},0.08));
        border: 1px solid rgba({PRIMARY_RGB},0.25);
        border-radius: 14px; padding: 14px 18px; font-size: 14px; margin: 10px 0 16px 0;
    }}
    .pd-suggestion {{
        background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.22);
        border-radius: 12px; padding: 11px 15px; margin-bottom: 8px; font-size: 13.5px;
        display: flex; align-items: flex-start; gap: 10px;
        transition: transform .15s ease;
    }}
    .pd-suggestion:hover {{ transform: translateX(3px); }}
    .pd-dup-warning {{
        background: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.35);
        border-radius: 14px; padding: 12px 16px; margin-bottom: 12px; font-size: 13.5px;
    }}
    .pd-card {{
        background: rgba({SURFACE_RGB},{CARD_BG_ALPHA}); backdrop-filter: blur(12px);
        border: 1px solid rgba({BORDER_RGB},{BORDER_ALPHA}); border-radius: 16px; padding: 16px 18px;
        margin-bottom: 12px; border-left: 3px solid var(--accent, {MUTED});
        transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }}
    .pd-card:hover {{
        transform: translateY(-3px); box-shadow: 0 14px 32px rgba({PRIMARY_RGB},0.16);
        border-color: rgba({PRIMARY_RGB},0.3);
    }}
    .pd-hero {{
        background: linear-gradient(120deg, rgba({PRIMARY_RGB},0.28), rgba({SECONDARY_RGB},0.16) 60%, rgba({PRIMARY_RGB},0));
        border: 1px solid rgba({PRIMARY_RGB},0.25); border-radius: 20px;
        padding: 26px 30px; margin-bottom: 22px; position: relative; overflow: hidden;
    }}
    .pd-hero::after {{
        content: ""; position: absolute; top: -60%; right: -8%; width: 300px; height: 300px;
        background: radial-gradient(circle, rgba({SECONDARY_RGB},0.35), transparent 70%); border-radius: 50%;
    }}
    .pd-kpi-label {{ font-size: 11.5px; color: {MUTED}; letter-spacing: .4px; font-weight: 600; }}
    .pd-kpi-value {{ font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; margin: 4px 0 2px; }}
    .pd-timeline-item {{ display: flex; gap: 12px; padding: 7px 0; font-size: 12.5px; }}
    .pd-timeline-dot {{ width: 8px; height: 8px; border-radius: 999px; margin-top: 5px; flex-shrink: 0; }}
    .pd-avatar {{
        display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
        color: #fff; font-weight: 700; font-size: 12px; width: 26px; height: 26px; flex-shrink: 0;
        background: linear-gradient(135deg, {PRIMARY}, {SECONDARY});
    }}
    .pd-progress-track {{ width: 100%; height: 8px; border-radius: 999px; background: rgba({BORDER_RGB},{BORDER_ALPHA}); overflow: hidden; margin-top: 6px; }}
    .pd-progress-fill {{ height: 100%; border-radius: 999px; background: linear-gradient(90deg, {PRIMARY}, {SECONDARY}); }}
    .pd-notif-card {{
        background: rgba({PRIMARY_RGB},0.07); border: 1px solid rgba({PRIMARY_RGB},0.18);
        border-radius: 10px; padding: 8px 11px; margin-bottom: 6px; font-size: 12px;
    }}
    hr {{ border-color: rgba({BORDER_RGB},{BORDER_ALPHA}); }}

    /* ---------- Responsive tweaks ---------- */
    @media (max-width: 900px) {{
        .pd-hero-title {{ font-size: 28px !important; }}
        .block-container {{ padding-left: 1rem; padding-right: 1rem; }}
    }}
    </style>
    """,
    unsafe_allow_html=True,
)


def badge(label, color):
    return f'<span class="pd-badge" style="background:{color}">{label}</span>'


def _avatar_initials(name):
    parts = [p for p in (name or "?").replace(".", "").split(" ") if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def _category_icon(cat):
    # cosmetic-only lookup; falls back safely for dirty values like "Hardware|Software"
    first = (cat or "Other").split("|")[0].strip()
    return CATEGORY_ICONS.get(first, "❔")


def _category_color(cat):
    first = (cat or "Other").split("|")[0].strip()
    return CATEGORY_COLORS.get(first, MUTED)


# --------------------------------------------------------------------------
# Persistence — a plain JSON file next to this script
# --------------------------------------------------------------------------
def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"tickets": [], "resolved_by_ai": 0, "seq": 1}


def save_data():
    with open(DATA_FILE, "w") as f:
        json.dump(
            {
                "tickets": st.session_state.tickets,
                "resolved_by_ai": st.session_state.resolved_by_ai,
                "seq": st.session_state.seq,
            },
            f,
            indent=2,
            default=str,
        )


def gen_ticket_id():
    now = datetime.now()
    tid = f"PD-{now:%y%m}-{st.session_state.seq:03d}"
    st.session_state.seq += 1
    return tid


def push_notification(text):
    st.session_state.notifications.insert(0, {"text": text, "at": datetime.now().isoformat()})
    st.session_state.notifications = st.session_state.notifications[:30]


def time_ago(iso):
    if not iso:
        return ""
    diff = (datetime.now() - datetime.fromisoformat(iso)).total_seconds()
    if diff < 60:
        return "just now"
    if diff < 3600:
        return f"{int(diff // 60)}m ago"
    if diff < 86400:
        return f"{int(diff // 3600)}h ago"
    return f"{int(diff // 86400)}d ago"


# --------------------------------------------------------------------------
# Session state bootstrap
# --------------------------------------------------------------------------
if "initialized" not in st.session_state:
    data = load_data()
    st.session_state.tickets = data["tickets"]
    st.session_state.resolved_by_ai = data["resolved_by_ai"]
    st.session_state.seq = data["seq"]
    st.session_state.user = None
    st.session_state.notifications = []
    st.session_state.selected_ticket = None
    st.session_state.initialized = True


# --------------------------------------------------------------------------
# Claude API helpers
# --------------------------------------------------------------------------
def get_client():
    """Returns True if a local Ollama server is reachable, else None."""
    if ollama is None:
        return None
    try:
        ollama.list()
        return True
    except Exception:
        return None


def analyze_ticket(title, desc, dept, existing_tickets):
    if get_client() is None:
        raise RuntimeError("Ollama isn't reachable. Run `ollama serve` and make sure the model is pulled.")
    existing = [
        {"id": t["id"], "title": t["title"], "summary": t.get("summary", "")}
        for t in existing_tickets
        if t.get("status") != "Closed"
    ][:8]
    system = """
You are an IT helpdesk triage agent.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT add explanations.
Do NOT wrap JSON in quotes.

The response MUST exactly match:

{
    "category": "Hardware",
    "priority": "Low",
    "sentiment": "Negative",
    "routedTeam": "Hardware Support",
    "summary": "One sentence summary",
    "suggestions": [
        "step 1",
        "step 2",
        "step 3"
    ],
    "duplicateOfId": null
}

Rules:
- suggestions must contain only strings.
- duplicateOfId must NOT be inside suggestions.
- Return valid JSON only.
"""
    user_msg = (
        f"Ticket title: {title}\nDepartment: {dept}\nIssue: {desc}\n\n"
        f"Existing open tickets to check for duplicates:\n{json.dumps(existing)}"
    )
    response = ollama.chat(
    model=OLLAMA_MODEL,
    messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": user_msg},
    ],
)

    text = response["message"]["content"]

    #print("\n========== OLLAMA RESPONSE ==========")
    print(repr(text))
    #print("=====================================\n")
 
    cleaned = text.replace("```json", "").replace("```", "").strip()

    result = json.loads(cleaned)
    print(type(result))
    print(result)

# Provide defaults if Ollama omits fields
    result.setdefault("duplicateOfId", None)

# If multiple categories are returned, keep the first one
    if "|" in result.get("category", ""):
        result["category"] = result["category"].split("|")[0]

    return result


def chat_with_agent(ticket, history):
    if get_client() is None:
        raise RuntimeError("Ollama isn't reachable. Run `ollama serve` and make sure the model is pulled.")
    context = (
        f"Ticket: {ticket['title']}\nCategory: {ticket['category']}\nSummary: {ticket['summary']}\n"
        f"Original suggestions: {'; '.join(ticket.get('suggestions', []))}"
    )
    system = (
        f"You are the IT support agent assigned to this ticket. Context:\n{context}\n"
        "Answer the employee's follow-up briefly and helpfully, in plain text, no markdown headers."
    )
    messages = [{"role": "system", "content": system}]
    for m in history:
        messages.append({"role": "user" if m["role"] == "user" else "assistant", "content": m["text"]})
    response = ollama.chat(model=OLLAMA_MODEL, messages=messages)
    return response["message"]["content"].strip()


# --------------------------------------------------------------------------
# Ticket mutation helpers
# --------------------------------------------------------------------------
def add_ticket(fields):
    tid = gen_ticket_id()
    ticket = {
        "id": tid,
        "status": "Open",
        "createdAt": datetime.now().isoformat(),
        "timeline": [],
        "chatHistory": [],
        "assignedTo": None,
        **fields,
    }
    st.session_state.tickets.insert(0, ticket)
    
    create_ticket({
    "ticket_id": tid,
    "name": ticket["name"],
    "emp_id": ticket["empId"],
    "department": ticket["employeeDept"],
    "title": ticket["title"],
    "description": ticket["desc"],
    "category": ticket["category"],
    "priority": ticket["priority"],
    "sentiment": ticket["sentiment"],
    "routed_team": ticket["routedTeam"],
    "summary": ticket["summary"],
    "status": ticket["status"]
})
    push_notification(f"New ticket {tid} raised — routed to {fields.get('routedTeam','')}")
    save_data()
    return tid


def update_status(tid, status, actor=None):
    for t in st.session_state.tickets:
        if t["id"] == tid:
            t["status"] = status
            t["timeline"].append(
                {"text": f"Status changed to {status}" + (f" by {actor}" if actor else ""), "at": datetime.now().isoformat()}
            )
    push_notification(f"{tid} marked {status}")
    save_data()


def add_comment(tid, text, author):
    for t in st.session_state.tickets:
        if t["id"] == tid:
            t["timeline"].append({"text": f'{author}: "{text}"', "at": datetime.now().isoformat()})
    push_notification(f"New comment on {tid}")
    save_data()


def assign_ticket(tid, assignee):
    for t in st.session_state.tickets:
        if t["id"] == tid:
            t["assignedTo"] = assignee
            t["timeline"].append({"text": f"Assigned to {assignee}", "at": datetime.now().isoformat()})
    push_notification(f"{tid} assigned to {assignee}")
    save_data()


def append_chat(tid, role, text):
    for t in st.session_state.tickets:
        if t["id"] == tid:
            t["chatHistory"].append({"role": role, "text": text})
    save_data()


def find_ticket(tid):
    return next((t for t in st.session_state.tickets if t["id"] == tid), None)


def _plotly_theme(fig, height=260):
    fig.update_layout(
        height=height, margin=dict(l=10, r=10, t=10, b=10),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color=MUTED, size=12, family="Inter"),
        legend=dict(orientation="h", y=-0.2, font=dict(size=11)),
        hoverlabel=dict(bgcolor=SURFACE, font_size=12, font_family="Inter"),
    )
    fig.update_xaxes(gridcolor=f"rgba({BORDER_RGB},{BORDER_ALPHA})", zeroline=False)
    fig.update_yaxes(gridcolor=f"rgba({BORDER_RGB},{BORDER_ALPHA})", zeroline=False)
    return fig


# --------------------------------------------------------------------------
# Login screen
# --------------------------------------------------------------------------
def _hero_illustration():
    """Small inline SVG — abstract 'ticket triaged by AI' motif.
    Custom-built so it uses the live theme colors and needs no external image."""
    ring = SECONDARY if THEME == "dark" else PRIMARY
    return f"""
    <svg viewBox="0 0 360 230" width="100%" height="auto" style="max-width:380px;">
        <circle cx="180" cy="115" r="95" fill="none" stroke="{ring}" stroke-opacity="0.18" stroke-width="1.5"/>
        <circle cx="180" cy="115" r="70" fill="none" stroke="{ring}" stroke-opacity="0.28" stroke-width="1.5"/>
        <g style="animation: pdFloat 4.5s ease-in-out infinite;">
            <rect x="95" y="70" width="130" height="90" rx="14" fill="{SURFACE}" stroke="{PRIMARY}" stroke-opacity="0.5" stroke-width="1.5"/>
            <rect x="112" y="90" width="70" height="8" rx="4" fill="{PRIMARY}" opacity="0.55"/>
            <rect x="112" y="106" width="96" height="6" rx="3" fill="{MUTED}" opacity="0.45"/>
            <rect x="112" y="118" width="80" height="6" rx="3" fill="{MUTED}" opacity="0.3"/>
            <rect x="112" y="136" width="46" height="14" rx="7" fill="{SUCCESS}" opacity="0.85"/>
        </g>
        <g style="animation: pdFloat 3.8s ease-in-out infinite .4s;">
            <circle cx="255" cy="66" r="26" fill="{PRIMARY}"/>
            <path d="M244 66 l7 7 l14 -15" fill="none" stroke="white" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g opacity="0.7" style="animation: pdFloat 4.2s ease-in-out infinite .8s;">
            <circle cx="90" cy="175" r="16" fill="{SECONDARY}" opacity="0.85"/>
            <text x="90" y="180" text-anchor="middle" font-size="14">🤖</text>
        </g>
    </svg>
    """


def login_screen():
    tcol1, tcol2 = st.columns([6, 1.1])
    with tcol2:
        render_theme_toggle(key="theme_toggle_login")

    tickets = st.session_state.tickets
    open_count = len([t for t in tickets if t["status"] != "Closed"])

    left, right = st.columns([1.15, 1], gap="large")

    with left:
        st.markdown(
            f"""
            <div style="padding-top:12px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:26px;">
                    <div style="width:38px;height:38px;border-radius:11px;
                        background:linear-gradient(135deg,{PRIMARY},{SECONDARY});
                        display:flex;align-items:center;justify-content:center;font-size:18px;
                        box-shadow:0 6px 18px rgba({PRIMARY_RGB},0.35);">🎫</div>
                    <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:19px;">PulseDesk</span>
                </div>
                <div class="pd-eyebrow" style="font-family:'IBM Plex Mono',monospace;font-size:12px;
                    color:{SECONDARY if THEME == 'dark' else PRIMARY};letter-spacing:.6px;font-weight:600;margin-bottom:10px;">
                    AI-TRIAGED IT SUPPORT
                </div>
                <div class="pd-hero-title" style="font-family:'Space Grotesk',sans-serif;font-size:36px;font-weight:700;
                    line-height:1.18;margin-bottom:14px;">
                    Support tickets, triaged<br>before they're filed.
                </div>
                <div style="font-size:14px;color:{MUTED};max-width:440px;margin-bottom:22px;line-height:1.65;">
                    Describe an issue in plain English — a local AI agent reads it, scores priority
                    and sentiment, suggests a fix, and only opens a ticket if it actually needs a human.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown(f'<div style="margin:6px 0 22px;">{_hero_illustration()}</div>', unsafe_allow_html=True)

        feats = [("✨", "AI reads every ticket before a human does"),
                 ("🔁", "Flags likely duplicates across the open queue"),
                 ("💬", "Keeps a live follow-up thread on every ticket")]
        for icon, text in feats:
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
                f'<span style="font-size:15px;">{icon}</span>'
                f'<span style="font-size:13px;color:{TEXT};">{text}</span></div>',
                unsafe_allow_html=True,
            )

        st.markdown(
            f"""
            <div style="display:flex;gap:28px;margin:22px 0;">
                <div><div style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:{PRIMARY};">{open_count}</div>
                    <div style="font-size:11px;color:{MUTED};">open tickets right now</div></div>
                <div><div style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:{SUCCESS};">{st.session_state.resolved_by_ai}</div>
                    <div style="font-size:11px;color:{MUTED};">resolved by AI, no human needed</div></div>
            </div>
            <div style="border-left:2px solid {PRIMARY};padding:2px 0 2px 14px;margin:22px 0 8px;">
                <div style="font-size:13px;color:{TEXT};font-style:italic;">
                    "Half our password and VPN tickets now get resolved before they ever reach our queue."</div>
                <div style="font-size:11.5px;color:{MUTED};margin-top:6px;">— IT Support Lead</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with right:
        with st.container(border=True):
            st.markdown("#### Sign in")
            st.caption("Access your team's ticket queue")
            with st.form("login_form"):
                name = st.text_input("Name", placeholder="e.g. Priya Sharma")
                emp_id = st.text_input("Employee ID", placeholder="e.g. 14598")
                dept = st.selectbox("Department", DEPARTMENTS)
                role = st.radio("Sign in as", ["Employee", "IT Admin"], horizontal=True)
                submitted = st.form_submit_button("Continue →", type="primary", use_container_width=True)
                if submitted:
                    if not name.strip() or not emp_id.strip():
                        st.error("Name and Employee ID are required.")
                    else:
                        st.session_state.user = {
                            "name": name.strip(),
                            "empId": emp_id.strip(),
                            "dept": dept,
                            "role": "Admin" if role == "IT Admin" else "Employee",
                        }
                        st.rerun()

    st.markdown(
        f"""
        <div style="text-align:center;color:{MUTED};font-size:11px;margin-top:36px;
            padding-top:16px;border-top:1px solid rgba({BORDER_RGB},{BORDER_ALPHA});">
            PulseDesk · Internal IT Support · Built with Streamlit + local Ollama
        </div>
        """,
        unsafe_allow_html=True,
    )


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------
def page_home():
    user = st.session_state.user
    st.markdown(
        f"""
        <div class="pd-hero">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:{SECONDARY};
                letter-spacing:.5px;font-weight:600;margin-bottom:6px;">WELCOME BACK</div>
            <div style="font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;margin-bottom:6px;">
                Hey {user['name'].split(' ')[0]} 👋 — what's broken today?</div>
            <div style="color:{MUTED};font-size:14px;max-width:600px;">Describe the issue in plain words —
                the AI agent triages it before a ticket ever gets filed.</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Raise a ticket →", type="primary"):
        st.session_state.current_page = "Raise Ticket"
        st.rerun()

    tickets = st.session_state.tickets
    open_count = len([t for t in tickets if t["status"] != "Closed"])
    critical = len([t for t in tickets if t["priority"] in ("Critical", "High")])
    total = len(tickets)
    closed_count = len([t for t in tickets if t["status"] in ("Resolved", "Closed")])
    resolution_pct = round(100 * closed_count / total) if total else 0

    st.write("")
    c1, c2, c3, c4 = st.columns(4)
    kpi_data = [
        (c1, "OPEN TICKETS", open_count, "🎫", TEXT),
        (c2, "NEEDS ATTENTION", critical, "🔥", DANGER),
        (c3, "RESOLVED BY AI", st.session_state.resolved_by_ai, "🤖", SECONDARY),
        (c4, "RESOLUTION RATE", f"{resolution_pct}%", "✅", SUCCESS),
    ]
    for col, label, value, icon, color in kpi_data:
        with col:
            with st.container(border=True):
                st.markdown(
                    f'<div style="display:flex;justify-content:space-between;align-items:center;">'
                    f'<span class="pd-kpi-label">{label}</span><span style="font-size:16px;opacity:.85;">{icon}</span></div>'
                    f'<div class="pd-kpi-value" style="color:{color};">{value}</div>',
                    unsafe_allow_html=True,
                )

    st.write("")
    cat_counts = {}
    pri_counts = {}
    status_counts = {}
    dept_counts = {}
    for t in tickets:
        cat_counts[t["category"]] = cat_counts.get(t["category"], 0) + 1
        pri_counts[t["priority"]] = pri_counts.get(t["priority"], 0) + 1
        status_counts[t["status"]] = status_counts.get(t["status"], 0) + 1
        dept_counts[t.get("employeeDept", "Other")] = dept_counts.get(t.get("employeeDept", "Other"), 0) + 1

    if cat_counts:
        chart_col1, chart_col2 = st.columns(2)
        with chart_col1:
            with st.container(border=True):
                st.markdown("**🗂️ Ticket category distribution**")
                fig_cat = go.Figure(data=[go.Bar(
                    x=list(cat_counts.keys()), y=list(cat_counts.values()),
                    marker=dict(color=[_category_color(c) for c in cat_counts.keys()]),
                    text=list(cat_counts.values()), textposition="outside")])
                st.plotly_chart(_plotly_theme(fig_cat), use_container_width=True, config={"displayModeBar": False})
        with chart_col2:
            with st.container(border=True):
                st.markdown("**⚠️ Priority distribution**")
                fig_pri = go.Figure(data=[go.Pie(
                    labels=list(pri_counts.keys()), values=list(pri_counts.values()), hole=0.6,
                    marker=dict(colors=[PRIORITY_COLORS.get(p, MUTED) for p in pri_counts.keys()],
                                line=dict(color=BG, width=2)))])
                st.plotly_chart(_plotly_theme(fig_pri, height=240), use_container_width=True, config={"displayModeBar": False})

        chart_col3, chart_col4 = st.columns(2)
        with chart_col3:
            with st.container(border=True):
                st.markdown("**📶 Status overview**")
                fig_status = go.Figure(data=[go.Bar(
                    x=list(status_counts.keys()), y=list(status_counts.values()), orientation="v",
                    marker=dict(color=[STATUS_COLORS.get(s, MUTED) for s in status_counts.keys()]),
                    text=list(status_counts.values()), textposition="outside")])
                st.plotly_chart(_plotly_theme(fig_status, height=240), use_container_width=True, config={"displayModeBar": False})
        with chart_col4:
            with st.container(border=True):
                st.markdown("**🏢 Department analytics**")
                fig_dept = go.Figure(data=[go.Bar(
                    x=list(dept_counts.values()), y=list(dept_counts.keys()), orientation="h",
                    marker=dict(color=PRIMARY), text=list(dept_counts.values()), textposition="outside")])
                st.plotly_chart(_plotly_theme(fig_dept, height=240), use_container_width=True, config={"displayModeBar": False})

        with st.container(border=True):
            st.markdown("**🎯 Resolution rate**")
            st.markdown(
                f'<div style="display:flex;align-items:baseline;gap:8px;margin:4px 0 2px;">'
                f'<span style="font-family:\'Space Grotesk\',sans-serif;font-size:26px;font-weight:700;color:{SUCCESS};">{resolution_pct}%</span>'
                f'<span class="pd-kpi-label">of {total} tickets resolved or closed</span></div>'
                f'<div class="pd-progress-track"><div class="pd-progress-fill" style="width:{resolution_pct}%;"></div></div>',
                unsafe_allow_html=True,
            )

    st.write("")
    st.markdown("#### 🕒 Recent tickets")
    if not tickets:
        st.info("Nothing on the board. Raise a ticket if something needs fixing.")
    for t in tickets[:3]:
        pcolor = PRIORITY_COLORS.get(t["priority"], MUTED)
        st.markdown(
            f"""<div class="pd-card" style="--accent:{pcolor};">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                <div>
                    <span style="font-size:15px;">{_category_icon(t['category'])}</span>
                    <b style="margin-left:4px;">{t['title']}</b><br>
                    <span style="color:{MUTED};font-size:12.5px;">{t['summary']}</span><br>
                    <span style="color:{MUTED};font-size:11px;">{t['name']} · {t['employeeDept']} → {t['routedTeam']}</span>
                </div>
                <div>{badge(t['status'], STATUS_COLORS[t['status']])}{badge(t['priority'], PRIORITY_COLORS[t['priority']])}</div>
            </div>
            </div>""",
            unsafe_allow_html=True,
        )


def page_raise_ticket():
    user = st.session_state.user
    st.markdown('<div style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;color:'
                + SECONDARY + ';letter-spacing:.5px;font-weight:600;margin-bottom:4px;">TICKET INTAKE</div>', unsafe_allow_html=True)
    st.markdown("## Raise a support ticket")
    st.caption("Fill in the details below. The AI agent will read it before anything gets filed.")

    with st.container(border=True):
        col1, col2 = st.columns(2)
        with col1:
            name = st.text_input("Employee name", value=user["name"])
            dept = st.selectbox("Department", DEPARTMENTS, index=DEPARTMENTS.index(user["dept"]) if user["dept"] in DEPARTMENTS else 0)
        with col2:
            emp_id = st.text_input("Employee ID", value=user["empId"])
            title = st.text_input("Ticket title", placeholder="e.g. Laptop overheats while training a model")

        desc = st.text_area("Describe your issue", height=120, placeholder="What happened, when it started, and anything you already tried.")
        attachment = st.file_uploader("Attachment (optional)", type=["png", "jpg", "jpeg", "pdf"])

        if "analysis" not in st.session_state:
            st.session_state.analysis = None
            st.session_state.analysis_status = "idle"
            st.session_state.resolved_choice = None
            st.session_state.registered_id = None

        can_analyze = bool(name.strip() and emp_id.strip() and title.strip() and desc.strip())

        if st.button("✨ Analyze with AI", type="primary", disabled=not can_analyze):
            if get_client() is None:
                st.error("Ollama isn't reachable — run `ollama serve` and make sure the model is pulled (see sidebar).")
            else:
                with st.spinner("Scanning ticket…"):
                    try:
                        result = analyze_ticket(title, desc, dept, st.session_state.tickets)
                        st.session_state.analysis = result
                        st.session_state.analysis_status = "done"
                        st.session_state.resolved_choice = None
                        st.session_state.registered_id = None
                        st.session_state.pending_form = {"name": name, "empId": emp_id, "employeeDept": dept, "title": title, "desc": desc}
                        if attachment is not None:
                            st.session_state.pending_attachment = {"name": attachment.name}
                        else:
                            st.session_state.pending_attachment = None
                    except Exception as e:
                        st.session_state.analysis_status = "error"
                        st.session_state.error_msg = str(e)

    if st.session_state.get("analysis_status") == "error":
        st.error(f"The AI agent couldn't finish the analysis: {st.session_state.error_msg}")

    analysis = st.session_state.get("analysis")
    if st.session_state.get("analysis_status") == "done" and analysis:
        with st.container(border=True):
            st.markdown("### ✨ AI insight")

            dup_id = analysis.get("duplicateOfId")
            if dup_id and dup_id != "null":
                dup = find_ticket(dup_id)
                if dup:
                    st.markdown(
                        f'<div class="pd-dup-warning">⚠️ <b>Possible duplicate</b> — this looks similar to '
                        f'<b>{dup["id"]}</b> — "{dup["title"]}"</div>',
                        unsafe_allow_html=True,
                    )

            st.markdown(
                badge(analysis["category"], _category_color(analysis["category"]))
                + badge(analysis["priority"], PRIORITY_COLORS[analysis["priority"]])
                + badge(analysis["sentiment"], SENTIMENT_COLORS[analysis["sentiment"]])
                + badge(f"→ {analysis['routedTeam']}", PRIMARY),
                unsafe_allow_html=True,
            )
            st.markdown(f'<div class="pd-summary-box">📝 {analysis["summary"]}</div>', unsafe_allow_html=True)

            st.markdown(f'<div class="pd-kpi-label" style="margin-bottom:6px;">SUGGESTED STEPS</div>', unsafe_allow_html=True)
            for i, s in enumerate(analysis.get("suggestions", []), 1):
                st.markdown(f'<div class="pd-suggestion"><span>✅</span><span><b>{i}.</b> {s}</span></div>', unsafe_allow_html=True)

            if not st.session_state.registered_id:
                st.markdown("**Did this resolve the issue?**")
                c1, c2 = st.columns(2)
                if c1.button("✅ Yes", use_container_width=True):
                    st.session_state.resolved_choice = "yes"
                    st.session_state.resolved_by_ai += 1
                    save_data()
                if c2.button("❌ No", use_container_width=True):
                    st.session_state.resolved_choice = "no"

                if st.session_state.resolved_choice == "yes":
                    st.success("Good — closing this one out. No ticket needed.")
                elif st.session_state.resolved_choice == "no":
                    st.warning("Issue not resolved. Register it so the routed team can pick it up.")
                    if st.button("🎫 Register ticket", type="primary"):
                        fields = dict(st.session_state.pending_form)
                        fields.update(
                            {
                                "category": analysis["category"],
                                "priority": analysis["priority"],
                                "sentiment": analysis["sentiment"],
                                "routedTeam": analysis["routedTeam"],
                                "summary": analysis["summary"],
                                "suggestions": analysis.get("suggestions", []),
                                "attachments": [st.session_state.pending_attachment] if st.session_state.pending_attachment else [],
                            }
                        )
                        tid = add_ticket(fields)
                        st.session_state.registered_id = tid
                        st.rerun()
            else:
                st.success(f"Ticket **{st.session_state.registered_id}** registered — the {analysis['routedTeam']} team has it now.")
                if st.button("Raise another ticket"):
                    for k in ("analysis", "analysis_status", "resolved_choice", "registered_id"):
                        st.session_state[k] = None
                    st.rerun()


def render_filter_bar(tickets, key_prefix):
    c1, c2, c3, c4 = st.columns([3, 1, 1, 1])
    query = c1.text_input("Search", key=f"{key_prefix}_q", placeholder="Search title, ID, or name…", label_visibility="collapsed")
    status_f = c2.selectbox("Status", ["All"] + STATUSES, key=f"{key_prefix}_s")
    priority_f = c3.selectbox("Priority", ["All", "Critical", "High", "Medium", "Low"], key=f"{key_prefix}_p")
    cats = sorted(set(t["category"] for t in tickets))
    category_f = c4.selectbox("Category", ["All"] + cats, key=f"{key_prefix}_c")

    def match(t):
        q_ok = not query or query.lower() in t["title"].lower() or query.lower() in t["id"].lower() or query.lower() in t["name"].lower()
        s_ok = status_f == "All" or t["status"] == status_f
        p_ok = priority_f == "All" or t["priority"] == priority_f
        c_ok = category_f == "All" or t["category"] == category_f
        return q_ok and s_ok and p_ok and c_ok

    return [t for t in tickets if match(t)]


def _render_ticket_cards(tickets_list):
    for t in tickets_list:
        pcolor = PRIORITY_COLORS.get(t["priority"], MUTED)
        st.markdown(
            f"""<div class="pd-card" style="--accent:{pcolor};">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:10px;min-width:220px;flex:2;">
                    <span style="font-size:16px;">{_category_icon(t['category'])}</span>
                    <div>
                        <div style="font-size:13.5px;font-weight:600;">{t['title']}</div>
                        <div style="font-family:'IBM Plex Mono',monospace;color:{MUTED};font-size:11px;">{t['id']} · {t['category']}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
                    {badge(t['priority'], pcolor)}
                    {badge(t['status'], STATUS_COLORS.get(t['status'], MUTED))}
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="pd-avatar">{_avatar_initials(t.get('assignedTo') or t['name'])}</span>
                        <span style="color:{MUTED};font-size:12px;">{t.get('assignedTo') or 'Unassigned'}</span>
                    </div>
                </div>
            </div>
            </div>""",
            unsafe_allow_html=True,
        )


def page_open_tickets():
    st.markdown('<div style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;color:'
                + SECONDARY + ';letter-spacing:.5px;font-weight:600;margin-bottom:4px;">SUPPORT QUEUE</div>', unsafe_allow_html=True)
    st.markdown("## Open tickets")
    tickets = st.session_state.tickets
    if not tickets:
        st.info("Nothing open right now. Raised tickets will show up here.")
        return

    filtered = render_filter_bar(tickets, "open")

    if not filtered:
        st.info("No tickets match those filters.")
        return

    df = pd.DataFrame(
        [
            {
                "Ticket": t["id"],
                "Title": t["title"],
                "Category": t["category"],
                "Priority": t["priority"],
                "Sentiment": t["sentiment"],
                "Status": t["status"],
                "AI team": t["routedTeam"],
            }
            for t in filtered
        ]
    )
    csv = df.to_csv(index=False).encode("utf-8")
    st.caption(f"{len(filtered)} of {len(tickets)} tickets")
    st.download_button("⬇ Export CSV", csv, "pulsedesk-tickets.csv", "text/csv")

    st.write("")
    _render_ticket_cards(filtered)

    st.markdown("#### View a ticket")
    options = {f"{t['id']} — {t['title']}": t["id"] for t in filtered}
    picked = st.selectbox("Select a ticket to open", ["—"] + list(options.keys()), label_visibility="collapsed")
    if picked != "—":
        st.session_state.selected_ticket = options[picked]
        render_ticket_detail(find_ticket(options[picked]))


def page_admin():
    st.markdown('<div style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;color:'
                + SECONDARY + ';letter-spacing:.5px;font-weight:600;margin-bottom:4px;">ADMIN CONSOLE</div>', unsafe_allow_html=True)
    st.markdown("## Admin — all tickets")
    tickets = st.session_state.tickets
    if not tickets:
        st.info("No tickets yet.")
        return

    filtered = render_filter_bar(tickets, "admin")
    if not filtered:
        st.info("No tickets match those filters.")
        return

    st.write("")
    _render_ticket_cards(filtered)

    with st.container(border=True):
        st.markdown("#### Bulk update")
        ids = [t["id"] for t in filtered]
        selected = st.multiselect("Select tickets", ids)
        bulk_status = st.selectbox("Set status to", STATUSES)
        if st.button("Apply to selected", disabled=not selected):
            for tid in selected:
                update_status(tid, bulk_status, actor="Admin (bulk)")
            st.success(f"Updated {len(selected)} tickets.")
            st.rerun()

    st.markdown("#### View a ticket")
    options = {f"{t['id']} — {t['title']}": t["id"] for t in filtered}
    picked = st.selectbox("Select a ticket to open", ["—"] + list(options.keys()), label_visibility="collapsed", key="admin_pick")
    if picked != "—":
        render_ticket_detail(find_ticket(options[picked]))


def render_ticket_detail(t):
    if not t:
        return
    user = st.session_state.user
    st.markdown("---")
    pcolor = PRIORITY_COLORS.get(t["priority"], MUTED)
    with st.container(border=True):
        st.markdown(f"### {t['id']} — {t['title']}")
        st.markdown(
            badge(t["category"], _category_color(t["category"])) + badge(t["priority"], pcolor) + badge(t["sentiment"], SENTIMENT_COLORS[t["sentiment"]]),
            unsafe_allow_html=True,
        )

        col_main, col_side = st.columns([2, 1])

        with col_main:
            st.markdown(f'<div class="pd-summary-box">📝 {t["summary"]}</div>', unsafe_allow_html=True)
            st.caption(t.get("desc", ""))

            if t.get("attachments"):
                for a in t["attachments"]:
                    st.markdown(f"📎 {a.get('name','attachment')}")

            st.markdown('<div class="pd-kpi-label" style="margin-bottom:6px;">SUGGESTED STEPS</div>', unsafe_allow_html=True)
            for i, s in enumerate(t.get("suggestions", []), 1):
                st.markdown(f'<div class="pd-suggestion"><span>✅</span><span><b>{i}.</b> {s}</span></div>', unsafe_allow_html=True)

            st.markdown("**Ask the agent**")
            for m in t.get("chatHistory", []):
                with st.chat_message("user" if m["role"] == "user" else "assistant"):
                    st.write(m["text"])
            chat_input = st.chat_input(f"Ask a follow-up about {t['id']}…", key=f"chat_{t['id']}")
            if chat_input:
                append_chat(t["id"], "user", chat_input)
                if get_client() is None:
                    append_chat(t["id"], "assistant", "Ollama isn't reachable right now — run `ollama serve` and try again.")
                else:
                    try:
                        reply = chat_with_agent(t, t["chatHistory"])
                        append_chat(t["id"], "assistant", reply)
                    except Exception as e:
                        append_chat(t["id"], "assistant", f"Couldn't reach the agent: {e}")
                st.rerun()

        with col_side:
            st.markdown("**Raised by**")
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
                f'<span class="pd-avatar">{_avatar_initials(t["name"])}</span>'
                f'<div><div style="font-size:13px;">{t["name"]} · #{t["empId"]}</div>'
                f'<div style="color:{MUTED};font-size:11.5px;">{t["employeeDept"]}</div></div></div>',
                unsafe_allow_html=True,
            )

            st.markdown("**Status**")
            new_status = st.selectbox("Status", STATUSES, index=STATUSES.index(t["status"]), key=f"status_{t['id']}", label_visibility="collapsed")
            if new_status != t["status"]:
                update_status(t["id"], new_status, actor=user["name"])
                st.rerun()

            if user["role"] == "Admin":
                st.markdown("**Assign to**")
                assignee = st.text_input("Assign", value=t.get("assignedTo") or "", key=f"assign_{t['id']}", label_visibility="collapsed")
                if st.button("Set assignee", key=f"assignbtn_{t['id']}"):
                    assign_ticket(t["id"], assignee)
                    st.rerun()

            st.markdown("**Timeline**")
            events = [{"text": f"Ticket created by {t['name']}", "at": t["createdAt"]}] + t.get("timeline", [])
            events.sort(key=lambda e: e["at"])
            for idx, ev in enumerate(events):
                dot_color = PRIMARY if idx == len(events) - 1 else MUTED
                st.markdown(
                    f'<div class="pd-timeline-item"><div class="pd-timeline-dot" style="background:{dot_color};"></div>'
                    f'<div>{ev["text"]}<br><span style="color:{MUTED};font-size:11px;">{time_ago(ev["at"])}</span></div></div>',
                    unsafe_allow_html=True,
                )

            st.markdown("**Add comment**")
            comment = st.text_area("Comment", key=f"comment_{t['id']}", height=70, label_visibility="collapsed")
            if st.button("Post comment", key=f"commentbtn_{t['id']}"):
                if comment.strip():
                    add_comment(t["id"], comment.strip(), user["name"])
                    st.rerun()


def page_about():
    st.markdown("## About PulseDesk")
    st.write(
        "PulseDesk is a lightweight internal helpdesk: describe a problem in your own words, and an "
        "AI agent reads it before a human has to. It gauges category, urgency and mood, suggests a fix "
        "on the spot, flags likely duplicates, and only opens a ticket if that fix doesn't land."
    )
    c1, c2, c3 = st.columns(3)
    with c1:
        with st.container(border=True):
            st.markdown("**🩺 Triage**")
            st.caption("Every issue is scored for priority and sentiment so nothing urgent sits quietly in a queue.")
    with c2:
        with st.container(border=True):
            st.markdown("**📍 Routing & assignment**")
            st.caption("Tickets are pointed at the right team automatically, and admins can assign, comment, and bulk-update.")
    with c3:
        with st.container(border=True):
            st.markdown("**💬 Follow-up chat**")
            st.caption("Each ticket keeps a running thread with the AI agent, plus a full activity timeline.")


# --------------------------------------------------------------------------
# App shell
# --------------------------------------------------------------------------
if st.session_state.user is None:
    login_screen()
    st.stop()

user = st.session_state.user

with st.sidebar:
    st.markdown(
        f"""
        <div style="display:flex;align-items:center;gap:10px;padding:4px 0 16px;">
            <div style="width:34px;height:34px;border-radius:10px;
                background:linear-gradient(135deg,{PRIMARY},{SECONDARY});display:flex;align-items:center;
                justify-content:center;font-size:16px;box-shadow:0 4px 14px rgba({PRIMARY_RGB},0.4);">🎫</div>
            <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;">PulseDesk</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    render_theme_toggle(key="theme_toggle_sidebar")
    st.write("")

    st.markdown(
        f"""
        <div style="display:flex;align-items:center;gap:10px;background:rgba({BORDER_RGB},{BORDER_ALPHA * 0.5});
            border:1px solid rgba({BORDER_RGB},{BORDER_ALPHA});border-radius:14px;padding:10px 12px;margin-bottom:14px;">
            <span class="pd-avatar" style="width:34px;height:34px;font-size:13px;">{_avatar_initials(user['name'])}</span>
            <div><div style="font-size:13px;font-weight:600;">{user['name']}</div>
            <div style="color:{MUTED};font-size:11px;">{user['role']}</div></div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.expander("⚙️ System status", expanded=False):
        # DEBUG (unchanged calls — only the container/labels around them are styled)
        st.caption(f"ollama module: {ollama}")
        try:
            st.caption(f"ollama.list(): {ollama.list()}")
        except Exception as e:
            st.caption(f"ollama.list() ERROR: {e}")
        st.caption(f"get_client(): {get_client()}")

    if get_client():
        st.markdown(
            f'<div style="display:flex;align-items:center;gap:7px;margin-bottom:14px;">'
            f'<span style="width:7px;height:7px;border-radius:999px;background:{SUCCESS};animation:pdPulse 2s infinite;"></span>'
            f'<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11.5px;color:{MUTED};">OLLAMA CONNECTED · {OLLAMA_MODEL}</span></div>',
            unsafe_allow_html=True,
        )
    else:
        st.warning("Ollama not reachable.", icon="⚠️")

    pages = ["Home", "Raise Ticket", "Open Tickets"]
    if user["role"] == "Admin":
        pages.append("Admin")
    pages.append("About")
    PAGE_ICONS = {"Home": "🏠", "Raise Ticket": "➕", "Open Tickets": "🎫", "Admin": "🛠️", "About": "ℹ️"}

    if "current_page" not in st.session_state or st.session_state.current_page not in pages:
        st.session_state.current_page = "Home"

    nav = st.radio(
        "Navigate",
        pages,
        format_func=lambda p: f"{PAGE_ICONS.get(p, '•')}  {p}",
        index=pages.index(st.session_state.current_page),
        label_visibility="collapsed",
    )
    st.session_state.current_page = nav

    if st.session_state.notifications:
        with st.expander(f"🔔 Activity ({len(st.session_state.notifications)})"):
            for n in st.session_state.notifications[:10]:
                st.markdown(
                    f'<div class="pd-notif-card">{n["text"]}<br>'
                    f'<span style="color:{MUTED};font-size:10.5px;">{time_ago(n["at"])}</span></div>',
                    unsafe_allow_html=True,
                )

    st.markdown("---")
    if st.button("Switch user"):
        st.session_state.user = None
        st.rerun()

if nav == "Home":
    page_home()
elif nav == "Raise Ticket":
    page_raise_ticket()
elif nav == "Open Tickets":
    page_open_tickets()
elif nav == "Admin":
    page_admin()
elif nav == "About":
    page_about()