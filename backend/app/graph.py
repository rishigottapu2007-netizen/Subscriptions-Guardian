from typing import Any, Dict, List

from langgraph.graph import StateGraph, END


# =========================================================
# Helper functions
# =========================================================

def money(value: float) -> str:
    try:
        return f"₹{float(value):,.0f}"
    except (TypeError, ValueError):
        return "₹0"


def get_merchant(charge: Dict[str, Any]) -> str:
    return (
        charge.get("merchant")
        or charge.get("name")
        or charge.get("description")
        or "Unknown subscription"
    )


def get_amount(charge: Dict[str, Any]) -> float:
    try:
        return float(charge.get("amount", 0) or 0)
    except (TypeError, ValueError):
        return 0.0


def get_category(charge: Dict[str, Any]) -> str:
    return (
        charge.get("category")
        or "Other"
    )


# =========================================================
# 1. Detect recurring payments
# =========================================================

def detect_recurring(state: Dict[str, Any]) -> Dict[str, Any]:
    charges = state.get("charges", [])

    recurring = []

    for charge in charges:
        recurring.append(
            {
                **charge,
                "merchant": get_merchant(charge),
                "amount": get_amount(charge),
                "category": get_category(charge),
            }
        )

    state["recurring"] = recurring

    state.setdefault("trace", []).append(
        f"Checked {len(recurring)} recurring payment(s)."
    )

    return state


# =========================================================
# 2. Analyze subscriptions
# =========================================================

def analyze_subscriptions(state: Dict[str, Any]) -> Dict[str, Any]:
    recurring = state.get("recurring", [])

    decisions: List[Dict[str, Any]] = []

    total_monthly = 0.0
    potential_savings = 0.0

    for charge in recurring:

        merchant = get_merchant(charge)
        amount = get_amount(charge)
        category = get_category(charge)

        total_monthly += amount

        # -------------------------------------------------
        # HIGH COST
        # -------------------------------------------------

        if amount >= 1000:

            action = "escalate"
            waste_score = 80
            confidence = 0.90

            reason = (
                f"{merchant} costs {money(amount)} every month. "
                f"This is a high recurring expense, so you may want "
                f"to check whether you still use this subscription."
            )

            potential_savings += amount

        # -------------------------------------------------
        # MEDIUM COST
        # -------------------------------------------------

        elif amount >= 500:

            action = "downgrade"
            waste_score = 50
            confidence = 0.75

            reason = (
                f"{merchant} costs {money(amount)} every month. "
                f"Consider checking whether you need the current "
                f"plan or whether a cheaper option is available."
            )

        # -------------------------------------------------
        # LOW COST
        # -------------------------------------------------

        else:

            action = "keep"
            waste_score = 15
            confidence = 0.85

            reason = (
                f"{merchant} costs {money(amount)} every month. "
                f"No immediate concern was found based on the "
                f"information available."
            )

        # -------------------------------------------------
        # IMPORTANT:
        # These field names MUST match models.py
        # -------------------------------------------------

        decisions.append(
            {
                "merchant": merchant,
                "category": category,
                "amount": amount,
                "waste_score": waste_score,
                "confidence": confidence,
                "action": action,
                "reason": reason,
            }
        )

    state["decisions"] = decisions
    state["total_monthly"] = total_monthly
    state["savings"] = potential_savings

    state.setdefault("trace", []).append(
        "Reviewed recurring payments and identified subscriptions that may need attention."
    )

    return state


# =========================================================
# 3. Create simple summary
# =========================================================

def create_summary(state: Dict[str, Any]) -> Dict[str, Any]:

    recurring = state.get("recurring", [])
    decisions = state.get("decisions", [])

    total_monthly = state.get(
        "total_monthly",
        0
    )

    potential_savings = state.get(
        "savings",
        0
    )

    count = len(recurring)

    high_attention = sum(
        1
        for decision in decisions
        if decision.get("action") == "escalate"
    )

    cheaper_option = sum(
        1
        for decision in decisions
        if decision.get("action") == "downgrade"
    )

    if count == 0:

        summary = (
            "No recurring payments were found in the "
            "information provided."
        )

    else:

        summary_parts = []

        # -------------------------------------------------
        # Basic information
        # -------------------------------------------------

        payment_word = (
            "payment"
            if count == 1
            else "payments"
        )

        summary_parts.append(
            f"You have {count} recurring {payment_word}."
        )

        summary_parts.append(
            f"Together, they cost about "
            f"{money(total_monthly)} every month."
        )

        # -------------------------------------------------
        # High-cost subscriptions
        # -------------------------------------------------

        if high_attention > 0:

            subscription_word = (
                "subscription"
                if high_attention == 1
                else "subscriptions"
            )

            summary_parts.append(
                f"{high_attention} {subscription_word} "
                f"may need your attention because "
                f"of the monthly cost."
            )

        # -------------------------------------------------
        # Cheaper plan possibility
        # -------------------------------------------------

        if cheaper_option > 0:

            subscription_word = (
                "subscription"
                if cheaper_option == 1
                else "subscriptions"
            )

            summary_parts.append(
                f"We also found {cheaper_option} "
                f"{subscription_word} where a cheaper "
                f"plan may be worth checking."
            )

        # -------------------------------------------------
        # Savings
        # -------------------------------------------------

        if potential_savings > 0:

            summary_parts.append(
                f"If you decide that the flagged "
                f"subscription"
                + (
                    " is"
                    if high_attention == 1
                    else "s are"
                )
                + " no longer needed, "
                f"you could save up to "
                f"{money(potential_savings)} per month."
            )

        else:

            summary_parts.append(
                "No specific cancellation savings "
                "were identified in this audit."
            )

        summary = " ".join(summary_parts)

    state["summary"] = summary

    state.setdefault("trace", []).append(
        "Created an easy-to-understand summary of the audit."
    )

    return state


# =========================================================
# 4. Analyze emails
# =========================================================

def analyze_emails(state: Dict[str, Any]) -> Dict[str, Any]:

    emails = state.get("emails", [])

    findings = []

    for email in emails:

        subject = email.get(
            "subject",
            "Subscription-related email"
        )

        sender = email.get(
            "sender",
            ""
        )

        findings.append(
            {
                "subject": subject,
                "sender": sender,
                "message": (
                    f"We found an email that may be related "
                    f"to a subscription: {subject}."
                ),
            }
        )

    state["email_findings"] = findings

    state.setdefault("trace", []).append(
        f"Checked {len(emails)} email(s) for subscription information."
    )

    return state


# =========================================================
# Build LangGraph
# =========================================================

workflow = StateGraph(dict)


workflow.add_node(
    "detect_recurring",
    detect_recurring
)

workflow.add_node(
    "analyze_subscriptions",
    analyze_subscriptions
)

workflow.add_node(
    "create_summary",
    create_summary
)

workflow.add_node(
    "analyze_emails",
    analyze_emails
)


workflow.set_entry_point(
    "detect_recurring"
)


workflow.add_edge(
    "detect_recurring",
    "analyze_subscriptions"
)

workflow.add_edge(
    "analyze_subscriptions",
    "create_summary"
)

workflow.add_edge(
    "create_summary",
    "analyze_emails"
)

workflow.add_edge(
    "analyze_emails",
    END
)


graph = workflow.compile()