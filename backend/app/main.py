import csv
import io

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models import AuditRequest, AuditResponse, ApprovalRequest
from .parsers import parse_transactions_csv, parse_eml, parse_email_text
from .graph import graph


app = FastAPI(
    title="Subscription Guardian API",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "ok": True,
        "llm_configured": bool(settings.openai_api_key)
    }


# --------------------------------------------------
# NORMAL AUDIT
# --------------------------------------------------

@app.post("/api/audit", response_model=AuditResponse)
def audit(req: AuditRequest):

    state = {
        "charges": [
            c.model_dump()
            for c in req.charges
        ],

        "emails": [
            e.model_dump()
            for e in req.emails
        ],

        "auto_action_limit": (
            req.auto_action_limit
            if req.auto_action_limit is not None
            else settings.auto_action_limit
        ),

        "protected_categories": (
            req.protected_categories
            if req.protected_categories
            else list(settings.protected)
        ),

        "trace": []
    }

    result = graph.invoke(state)

    return AuditResponse(
        summary=result["summary"],
        decisions=result["decisions"],
        estimated_monthly_savings=result["savings"],
        recurring_count=len(req.charges),
        email_findings=result.get("email_findings", []),
        trace=result["trace"]
    )


# --------------------------------------------------
# TRANSACTION CSV UPLOAD
# --------------------------------------------------

@app.post("/api/transactions/csv")
async def transactions_csv(
    file: UploadFile = File(...)
):

    data = await file.read()

    try:
        transactions = parse_transactions_csv(data)

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    return {
        "success": True,
        "count": len(transactions),

        "transactions": [
            transaction.model_dump()
            if hasattr(transaction, "model_dump")
            else transaction
            for transaction in transactions
        ]
    }


# --------------------------------------------------
# CSV AUDIT
# --------------------------------------------------

@app.post("/api/audit/csv")
async def audit_csv(
    file: UploadFile = File(...),
    auto_action_limit: float = settings.auto_action_limit
):

    data = await file.read()

    try:
        charges = parse_transactions_csv(data)

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    req = AuditRequest(
        charges=charges,
        auto_action_limit=auto_action_limit
    )

    return audit(req)


# --------------------------------------------------
# EMAIL FILE SCAN
# --------------------------------------------------

@app.post("/api/audit/emails")
async def scan_email_files(
    files: list[UploadFile] = File(...)
):

    emails = []

    for f in files:

        data = await f.read()

        try:

            if f.filename.lower().endswith(".eml"):

                emails.append(
                    parse_eml(data)
                )

            else:

                emails.append(
                    parse_email_text(
                        data.decode(
                            "utf-8",
                            errors="ignore"
                        )
                    )
                )

        except Exception as exc:

            raise HTTPException(
                status_code=400,
                detail=f"{f.filename}: {exc}"
            )

    return {
        "emails": [
            e.model_dump()
            for e in emails
        ]
    }


# --------------------------------------------------
# APPROVAL
# --------------------------------------------------

@app.post("/api/approval")
def approval(
    req: ApprovalRequest
):

    # Demo-only endpoint.
    # In production this should create an auditable job
    # and call a merchant API only after explicit user approval.

    return {
        "status": "approved_for_execution",
        "merchant": req.merchant,
        "action": req.action,
        "message": (
            "Approval recorded. "
            "Connect a merchant API here for real execution."
        )
    }