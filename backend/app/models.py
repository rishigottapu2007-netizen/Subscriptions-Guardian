from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

Action = Literal["keep", "cancel", "downgrade", "escalate"]

class Charge(BaseModel):
    merchant: str
    amount: float
    cadence: str = "monthly"
    category: str = "unknown"
    last_used_days_ago: Optional[int] = None
    source: str = "csv"
    last_billed_amount: Optional[float] = None
    current_amount: Optional[float] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

class EmailItem(BaseModel):
    sender: str = ""
    subject: str = ""
    date: str = ""
    body: str = ""

class Decision(BaseModel):
    merchant: str
    amount: float
    category: str
    waste_score: float
    confidence: float
    action: Action
    reason: str
    evidence: list[str] = Field(default_factory=list)
    source: list[str] = Field(default_factory=list)

class AuditRequest(BaseModel):
    charges: list[Charge] = Field(default_factory=list)
    emails: list[EmailItem] = Field(default_factory=list)
    auto_action_limit: Optional[float] = None
    protected_categories: Optional[list[str]] = None

class AuditResponse(BaseModel):
    summary: str
    decisions: list[Decision]
    estimated_monthly_savings: float
    recurring_count: int
    email_findings: list[dict[str, Any]] = Field(default_factory=list)
    trace: list[str] = Field(default_factory=list)

class ApprovalRequest(BaseModel):
    merchant: str
    action: Literal["cancel", "downgrade"]
