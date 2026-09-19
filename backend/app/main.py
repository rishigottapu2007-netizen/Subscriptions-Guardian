from typing import List, Optional
import csv
import io
import re
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Subscription & Recurring-Spend Guardian Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# DEMO AUTH STORAGE
# ------------------------------------------------------------

DEMO_USERS = {
    "demo@example.com": "Demo@123"
}


class AuthRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str


# ------------------------------------------------------------
# AUDIT MODELS
# ------------------------------------------------------------

class Charge(BaseModel):
    merchant: str
    amount: float
    cadence: str = "monthly"
    category: str = "unknown"
    date: Optional[str] = None
    description: Optional[str] = None
    last_used_days_ago: Optional[int] = None


class EmailSignal(BaseModel):
    merchant: str = ""
    sender: str = ""
    subject: str = ""
    body: str = ""


class AuditRequest(BaseModel):
    charges: List[Charge] = Field(default_factory=list)
    emails: List[EmailSignal] = Field(default_factory=list)
    auto_action_limit: float = 500
    protected_categories: List[str] = Field(default_factory=list)


# ------------------------------------------------------------
# BASIC HELPERS
# ------------------------------------------------------------

def normalize(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def money(value: float) -> float:
    return round(float(value or 0), 2)


def format_money(value: float) -> str:
    return f"₹{money(value):,.2f}"


def category_is_protected(category: str, protected_categories: List[str]) -> bool:
    normalized_category = normalize(category)
    if not normalized_category:
        return False

    for protected in protected_categories:
        normalized_protected = normalize(protected)
        if not normalized_protected:
            continue
        if (
            normalized_category == normalized_protected
            or normalized_protected in normalized_category
            or normalized_category in normalized_protected
        ):
            return True

    return False


# ------------------------------------------------------------
# EMAIL MATCHING
# ------------------------------------------------------------

def find_matching_emails(
    charge: Charge,
    emails: List[EmailSignal],
) -> List[EmailSignal]:
    merchant_name = normalize(charge.merchant)
    matches = []

    if not merchant_name:
        return matches

    merchant_words = [
        word for word in re.split(r"[^a-z0-9]+", merchant_name)
        if len(word) >= 3
    ]

    for email in emails:
        fields = [
            normalize(email.merchant),
            normalize(email.sender),
            normalize(email.subject),
            normalize(email.body),
        ]

        joined = " ".join(fields)

        if any(
            merchant_name in field or field in merchant_name
            for field in fields
            if field
        ):
            matches.append(email)
            continue

        if merchant_words and sum(word in joined for word in merchant_words) >= max(1, len(merchant_words) // 2):
            matches.append(email)

    return matches


def email_evidence_score(charge: Charge, matching_emails: List[EmailSignal]) -> int:
    """Return 0-25 based on the quality of merchant-specific email evidence."""
    if not matching_emails:
        return 0

    merchant = normalize(charge.merchant)
    best = 0

    for email in matching_emails:
        score = 8
        sender = normalize(email.sender)
        subject = normalize(email.subject)
        body = normalize(email.body)

        if merchant and merchant in sender:
            score += 7
        elif sender and any(part in sender for part in merchant.split() if len(part) >= 3):
            score += 4

        if merchant and merchant in subject:
            score += 5
        elif any(word in subject for word in merchant.split() if len(word) >= 3):
            score += 3

        recurring_words = [
            "subscription",
            "renew",
            "renewed",
            "monthly",
            "payment",
            "charged",
            "membership",
            "trial",
        ]
        if any(word in subject or word in body for word in recurring_words):
            score += 5

        best = max(best, score)

    return min(best, 25)


# ------------------------------------------------------------
# SCORE CALCULATIONS
# ------------------------------------------------------------

def calculate_waste_score(charge: Charge) -> int:
    """Heuristic demo score. Higher means stronger waste signal."""
    amount = money(charge.amount)
    days = charge.last_used_days_ago

    score = 20

    if amount >= 1500:
        score += 20
    elif amount >= 800:
        score += 16
    elif amount >= 500:
        score += 12
    elif amount >= 300:
        score += 8
    elif amount >= 150:
        score += 5

    if days is not None:
        if days >= 180:
            score += 45
        elif days >= 120:
            score += 38
        elif days >= 90:
            score += 30
        elif days >= 60:
            score += 20
        elif days >= 30:
            score += 10
        elif days >= 14:
            score += 5

    return max(0, min(score, 100))


def calculate_confidence(
    charge: Charge,
    email_matches: int,
    email_quality: int = 0,
) -> int:
    """Confidence is evidence-based and deliberately varies by available evidence."""
    score = 0

    # Transaction evidence
    if charge.amount > 0:
        score += 20

    if charge.date:
        score += 10

    if charge.description:
        score += 10

    if charge.category and normalize(charge.category) != "unknown":
        score += 10

    # Email evidence: 0-25
    if email_matches >= 1:
        score += 15
    if email_matches >= 2:
        score += 5
    score += min(email_quality, 5)

    # Usage evidence: 0-20
    if charge.last_used_days_ago is not None:
        days = charge.last_used_days_ago
        if days >= 180:
            score += 20
        elif days >= 120:
            score += 17
        elif days >= 90:
            score += 14
        elif days >= 60:
            score += 11
        elif days >= 30:
            score += 8
        elif days >= 14:
            score += 5
        else:
            score += 2

    return max(0, min(score, 100))


# ------------------------------------------------------------
# DECISION ENGINE
# ------------------------------------------------------------

def build_decision(
    charge: Charge,
    matching_emails: List[EmailSignal],
    auto_action_limit: float,
    protected_categories: List[str],
):
    waste_score = calculate_waste_score(charge)
    confidence_score = calculate_confidence(
        charge,
        len(matching_emails),
        email_evidence_score(charge, matching_emails),
    )

    protected = category_is_protected(
        charge.category,
        protected_categories,
    )

    amount_over_limit = money(charge.amount) > money(auto_action_limit)
    days = charge.last_used_days_ago

    # Prototype action policy.
    if protected:
        action = "Escalate"
        guardrail = "Protected category: automatic cancellation or downgrade is blocked."
    elif amount_over_limit:
        action = "Escalate"
        guardrail = (
            f"Amount {format_money(charge.amount)} is above the auto-action limit "
            f"of {format_money(auto_action_limit)}. Approval required."
        )
    elif confidence_score < 55:
        action = "Escalate"
        guardrail = "Confidence is below the configured evidence threshold."
    elif days is not None and days >= 120 and waste_score >= 60:
        action = "Cancel"
        guardrail = "Low-use signal is strong and the charge is within the auto-action limit."
    elif days is not None and days >= 60 and waste_score >= 45:
        action = "Downgrade"
        guardrail = "Usage is relatively low; downgrade is suggested before cancellation."
    else:
        action = "Keep"
        guardrail = "No strong low-use signal met the prototype action threshold."

    if days is None:
        usage_text = "No usage-history value was supplied."
    elif days == 0:
        usage_text = "Used today."
    else:
        usage_text = f"Last reported use was {days} day(s) ago."

    if action == "Cancel":
        reason = (
            f"The recurring charge is {format_money(charge.amount)} and has a strong "
            f"waste signal. {usage_text} Evidence confidence is {confidence_score}%."
        )
    elif action == "Downgrade":
        reason = (
            f"The service shows relatively low recent usage. {usage_text} "
            f"A downgrade is suggested before cancellation. Confidence is {confidence_score}%."
        )
    elif action == "Escalate":
        reason = (
            f"The agent found a recurring charge but will not take an autonomous action. "
            f"{usage_text} Confidence is {confidence_score}%, and the guardrail requires review."
        )
    else:
        reason = (
            f"The available evidence does not show strong recurring-spend waste. "
            f"{usage_text} Confidence is {confidence_score}%."
        )

    estimated_savings = money(charge.amount) if action in {"Cancel", "Downgrade"} else 0

    return {
        "merchant": charge.merchant,
        "amount": money(charge.amount),
        "cadence": charge.cadence,
        "category": charge.category,
        "waste_score": waste_score,
        "confidence_score": confidence_score,
        "recommended_action": action,
        "action": action.lower(),
        "protected": protected,
        "guardrail": guardrail,
        "reason": reason,
        "estimated_monthly_savings": estimated_savings,
        "matching_email_count": len(matching_emails),
    }


# ------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "Subscription Guardian Backend is running"}


@app.get("/api/health")
def health():
    return {"ok": True, "message": "Subscription Guardian Backend is healthy"}


@app.post("/api/auth/signup")
def signup(request: AuthRequest):
    email = request.email.strip().lower()

    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    if email in DEMO_USERS:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    DEMO_USERS[email] = request.password

    return {
        "message": "Account created successfully.",
        "token": "demo-session",
        "email": email,
    }


@app.post("/api/auth/signin")
def signin(request: AuthRequest):
    email = request.email.strip().lower()

    if DEMO_USERS.get(email) != request.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Signed in successfully.",
        "token": "demo-session",
        "email": email,
    }


@app.post("/api/auth/change-password")
def change_password(request: ChangePasswordRequest):
    email = request.email.strip().lower()

    if DEMO_USERS.get(email) != request.current_password:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must contain at least 6 characters.")

    DEMO_USERS[email] = request.new_password

    return {"message": "Password updated successfully."}


@app.post("/api/auth/signout")
def signout():
    return {"message": "Signed out successfully."}


@app.post("/api/audit")
def audit(request: AuditRequest):
    decisions = []
    email_findings = []
    trace = []

    for charge in request.charges:
        matching_emails = find_matching_emails(
            charge,
            request.emails,
        )

        decision = build_decision(
            charge,
            matching_emails,
            request.auto_action_limit,
            request.protected_categories,
        )

        decisions.append(decision)

        if matching_emails:
            email_findings.append({
                "merchant": charge.merchant,
                "finding": (
                    f"Found {len(matching_emails)} matching email signal(s) for "
                    f"this recurring charge."
                ),
            })

        trace.append(
            f"Analyzed {charge.merchant}: "
            f"waste={decision['waste_score']}, "
            f"confidence={decision['confidence_score']}%, "
            f"action={decision['recommended_action']}, "
            f"email_matches={decision['matching_email_count']}."
        )

    savings = money(
        sum(
            float(item.get("estimated_monthly_savings", 0) or 0)
            for item in decisions
        )
    )

    cancel_count = sum(
        item["recommended_action"] == "Cancel"
        for item in decisions
    )
    downgrade_count = sum(
        item["recommended_action"] == "Downgrade"
        for item in decisions
    )
    escalate_count = sum(
        item["recommended_action"] == "Escalate"
        for item in decisions
    )

    summary = (
        f"Guardian analyzed {len(request.charges)} recurring charge(s). "
        f"It identified {cancel_count} cancellation candidate(s), "
        f"{downgrade_count} downgrade candidate(s), and "
        f"{escalate_count} item(s) requiring review. "
        f"Estimated monthly savings from cancel/downgrade recommendations: "
        f"{format_money(savings)}."
    )

    return {
        "success": True,
        "message": "Agent audit completed successfully.",
        "recurring_count": len(request.charges),
        "decisions": decisions,
        "estimated_monthly_savings": savings,
        "email_findings": email_findings,
        "trace": trace,
        "summary": summary,
    }


@app.post("/api/transactions/csv")
async def upload_transactions_csv(file: UploadFile = File(...)):
    content = await file.read()

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV file must be UTF-8 encoded.")

    try:
        reader = csv.DictReader(io.StringIO(text))
        transactions = []

        for row in reader:
            merchant = (row.get("merchant") or row.get("Merchant") or "").strip()
            amount_text = (row.get("amount") or row.get("Amount") or "0").strip()

            if not merchant:
                continue

            amount = float(amount_text.replace("₹", "").replace(",", "").strip() or 0)

            transactions.append({
                "merchant": merchant,
                "amount": amount,
                "category": (row.get("category") or row.get("Category") or "unknown").strip(),
                "date": (row.get("date") or row.get("Date") or "").strip() or None,
                "description": (row.get("description") or row.get("Description") or "").strip() or None,
                "cadence": (row.get("cadence") or row.get("Cadence") or "monthly").strip(),
                "last_used_days_ago": int(row["last_used_days_ago"])
                if row.get("last_used_days_ago") not in (None, "")
                else None,
            })

    except (ValueError, TypeError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}")

    return {
        "message": "CSV transactions loaded successfully.",
        "count": len(transactions),
        "transactions": transactions,
    }
