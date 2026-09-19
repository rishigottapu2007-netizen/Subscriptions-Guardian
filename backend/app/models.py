from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ============================================================
# ACTION TYPES
# ============================================================

Action = Literal[
    "keep",
    "cancel",
    "downgrade",
    "escalate",
]


# ============================================================
# CHARGE
# ============================================================

class Charge(BaseModel):

    merchant: str

    amount: float

    cadence: str = "monthly"

    category: str = "unknown"

    last_used_days_ago: Optional[int] = None

    source: str = "csv"

    last_billed_amount: Optional[float] = None

    current_amount: Optional[float] = None

    metadata: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# EMAIL
# ============================================================

class EmailItem(BaseModel):

    sender: str = ""

    subject: str = ""

    date: str = ""

    body: str = ""


# ============================================================
# DECISION
# ============================================================

class Decision(BaseModel):

    merchant: str

    amount: float

    category: str = "unknown"

    # --------------------------------------------------------
    # Scores
    # --------------------------------------------------------

    waste_score: float = 0

    confidence_score: float = 0

    # Keep this for compatibility with older code
    confidence: Optional[float] = None

    # --------------------------------------------------------
    # Action
    # --------------------------------------------------------

    action: Action = "keep"

    # Keep this for compatibility with frontend/backend code
    recommended_action: Optional[str] = None

    # --------------------------------------------------------
    # Guardrail information
    # --------------------------------------------------------

    protected: bool = False

    guardrail: str = ""

    # --------------------------------------------------------
    # Explanation
    # --------------------------------------------------------

    reason: str = ""

    evidence: list[str] = Field(
        default_factory=list
    )

    source: list[str] = Field(
        default_factory=list
    )

    # --------------------------------------------------------
    # Savings
    # --------------------------------------------------------

    estimated_monthly_savings: float = 0


# ============================================================
# AUDIT REQUEST
# ============================================================

class AuditRequest(BaseModel):

    charges: list[Charge] = Field(
        default_factory=list
    )

    emails: list[EmailItem] = Field(
        default_factory=list
    )

    auto_action_limit: Optional[float] = None

    protected_categories: Optional[list[str]] = None


# ============================================================
# AUDIT RESPONSE
# ============================================================

class AuditResponse(BaseModel):

    summary: str

    decisions: list[Decision] = Field(
        default_factory=list
    )

    estimated_monthly_savings: float = 0

    recurring_count: int = 0

    email_findings: list[dict[str, Any]] = Field(
        default_factory=list
    )

    trace: list[str] = Field(
        default_factory=list
    )


# ============================================================
# APPROVAL REQUEST
# ============================================================

class ApprovalRequest(BaseModel):

    merchant: str

    action: Literal[
        "cancel",
        "downgrade",
    ]