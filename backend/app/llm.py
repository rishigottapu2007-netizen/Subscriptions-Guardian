from typing import Any
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from .config import settings

class LLMDecision(BaseModel):
    merchant: str
    category: str
    waste_score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    recommendation: str = Field(description="keep, cancel, downgrade, or escalate")
    reason: str
    evidence: list[str] = Field(default_factory=list)

def get_llm():
    if not settings.openai_api_key:
        return None
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0
    )

def ask_llm(charges: list[dict[str, Any]], email_findings: list[dict[str, Any]]):
    llm = get_llm()
    if not llm:
        return []

    structured = llm.with_structured_output(LLMDecision)
    outputs = []
    for charge in charges:
        relevant = [
            x for x in email_findings
            if charge["merchant"].lower() in (x.get("subject", "") + " " + x.get("sender", "")).lower()
        ]
        prompt = f"""
You are the reasoning agent for a subscription-spend guardian.

Analyze ONLY the supplied evidence. Do not invent usage, contracts, or cancellation policies.
The deterministic guardrail layer will override your recommendation if needed.

Charge:
{charge}

Related email findings:
{relevant}

Return a usage/waste assessment and recommendation. A recommendation is advisory only.
"""
        try:
            outputs.append(structured.invoke(prompt).model_dump())
        except Exception as exc:
            outputs.append({
                "merchant": charge["merchant"],
                "category": charge.get("category", "unknown"),
                "waste_score": 0,
                "confidence": 0,
                "recommendation": "escalate",
                "reason": f"LLM unavailable for this item: {type(exc).__name__}",
                "evidence": []
            })
    return outputs
