from typing import Any, Dict, List

from langgraph.graph import StateGraph, END


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_float(value: Any, default: float = 0.0) -> float:
    """Convert a value to float safely."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def clean_text(value: Any) -> str:
    """Convert a value to clean text."""
    if value is None:
        return ""
    return str(value).strip()


def normalize_category(value: Any) -> str:
    """Normalize category names for comparison."""
    return clean_text(value).lower()


def calculate_waste_score(
    amount: float,
    category: str,
    merchant: str,
) -> int:
    """
    Calculate a prototype waste score from 0-100.

    Higher score = greater potential waste.
    """

    score = 0

    # --------------------------------------------------------
    # Amount-based signal
    # --------------------------------------------------------

    if amount >= 1500:
        score += 55

    elif amount >= 1000:
        score += 45

    elif amount >= 500:
        score += 35

    elif amount >= 300:
        score += 25

    elif amount >= 100:
        score += 15

    else:
        score += 8


    # --------------------------------------------------------
    # Category-based signal
    # --------------------------------------------------------

    category_lower = normalize_category(category)

    discretionary_categories = {
        "entertainment",
        "fitness",
        "software",
        "shopping",
        "streaming",
        "music",
        "gaming",
        "cloud storage",
        "storage",
    }

    if category_lower in discretionary_categories:
        score += 20


    # --------------------------------------------------------
    # Merchant signal
    # --------------------------------------------------------

    merchant_lower = clean_text(
        merchant
    ).lower()

    known_subscription_merchants = {
        "netflix",
        "spotify",
        "amazon prime",
        "adobe creative cloud",
        "gym membership",
        "cloud storage",
    }

    if merchant_lower in known_subscription_merchants:
        score += 10


    # --------------------------------------------------------
    # Limit score to 100
    # --------------------------------------------------------

    return max(
        0,
        min(
            100,
            int(score),
        ),
    )


def calculate_confidence_score(
    merchant: str,
    amount: float,
    category: str,
    recurring: bool = True,
    email_match: bool = False,
) -> int:
    """
    Calculate confidence score from 0-100.

    This represents how confident the agent is that the
    transaction has been correctly identified and analyzed.
    """

    score = 0

    # --------------------------------------------------------
    # Merchant identified
    # --------------------------------------------------------

    if merchant:
        score += 25


    # --------------------------------------------------------
    # Amount is valid
    # --------------------------------------------------------

    if amount > 0:
        score += 20


    # --------------------------------------------------------
    # Category identified
    # --------------------------------------------------------

    if category:
        score += 20


    # --------------------------------------------------------
    # Recurring signal
    # --------------------------------------------------------

    if recurring:
        score += 20


    # --------------------------------------------------------
    # Email evidence
    # --------------------------------------------------------

    if email_match:
        score += 15


    # --------------------------------------------------------
    # Limit score
    # --------------------------------------------------------

    return max(
        0,
        min(
            100,
            int(score),
        ),
    )


def is_protected_category(
    category: str,
    protected_categories: List[str],
) -> bool:
    """Check whether a subscription belongs to a protected category."""

    category_normalized = normalize_category(
        category
    )

    if not category_normalized:
        return False

    for protected in protected_categories:

        protected_normalized = normalize_category(
            protected
        )

        if not protected_normalized:
            continue

        if (
            category_normalized
            == protected_normalized
        ):
            return True

        # Allow partial matching such as
        # "healthcare" / "health care"

        if (
            protected_normalized in category_normalized
            or category_normalized in protected_normalized
        ):
            return True

    return False


def find_email_match(
    merchant: str,
    emails: List[Dict[str, Any]],
) -> bool:
    """Check whether an email supports the merchant subscription."""

    merchant_lower = clean_text(
        merchant
    ).lower()

    if not merchant_lower:
        return False

    for email in emails:

        if isinstance(email, dict):

            text = " ".join(
                [
                    clean_text(
                        email.get("subject", "")
                    ),
                    clean_text(
                        email.get("body", "")
                    ),
                    clean_text(
                        email.get("sender", "")
                    ),
                    clean_text(
                        email.get("merchant", "")
                    ),
                ]
            ).lower()

        else:

            text = clean_text(
                email
            ).lower()

        if merchant_lower in text:
            return True

    return False


# ============================================================
# NODE 1: DETECT RECURRING
# ============================================================

def detect_recurring(
    state: Dict[str, Any]
) -> Dict[str, Any]:

    charges = state.get(
        "charges",
        []
    )

    emails = state.get(
        "emails",
        []
    )

    trace = state.get(
        "trace",
        []
    )

    recurring_charges = []


    for charge in charges:

        if not isinstance(
            charge,
            dict,
        ):
            continue

        merchant = clean_text(
            charge.get(
                "merchant",
                charge.get(
                    "description",
                    ""
                ),
            )
        )

        amount = safe_float(
            charge.get(
                "amount",
                0,
            )
        )

        category = clean_text(
            charge.get(
                "category",
                "Other",
            )
        )


        # ----------------------------------------------------
        # Email evidence
        # ----------------------------------------------------

        email_match = find_email_match(
            merchant,
            emails,
        )


        recurring_charges.append(
            {
                **charge,

                "merchant":
                    merchant,

                "amount":
                    amount,

                "category":
                    category,

                "recurring":
                    True,

                "email_match":
                    email_match,
            }
        )


    trace.append(
        "Recurring subscription detection completed."
    )

    trace.append(
        f"Detected {len(recurring_charges)} recurring charge(s)."
    )


    return {
        "recurring_charges":
            recurring_charges,

        "trace":
            trace,
    }


# ============================================================
# NODE 2: ANALYZE SUBSCRIPTIONS
# ============================================================

def analyze_subscriptions(
    state: Dict[str, Any]
) -> Dict[str, Any]:

    recurring_charges = state.get(
        "recurring_charges",
        []
    )

    auto_action_limit = safe_float(
        state.get(
            "auto_action_limit",
            500,
        ),
        500,
    )

    protected_categories = state.get(
        "protected_categories",
        [],
    )


    if not isinstance(
        protected_categories,
        list,
    ):
        protected_categories = []


    decisions = []

    total_savings = 0.0


    for charge in recurring_charges:

        merchant = clean_text(
            charge.get(
                "merchant",
                "Unknown merchant",
            )
        )

        amount = safe_float(
            charge.get(
                "amount",
                0,
            )
        )

        category = clean_text(
            charge.get(
                "category",
                "Other",
            )
        )

        recurring = bool(
            charge.get(
                "recurring",
                True,
            )
        )

        email_match = bool(
            charge.get(
                "email_match",
                False,
            )
        )


        # ----------------------------------------------------
        # Calculate scores
        # ----------------------------------------------------

        waste_score = calculate_waste_score(
            amount=amount,
            category=category,
            merchant=merchant,
        )

        confidence_score = calculate_confidence_score(
            merchant=merchant,
            amount=amount,
            category=category,
            recurring=recurring,
            email_match=email_match,
        )


        # ----------------------------------------------------
        # Protected category check
        # ----------------------------------------------------

        protected = is_protected_category(
            category,
            protected_categories,
        )


        # ----------------------------------------------------
        # Default values
        # ----------------------------------------------------

        recommended_action = "KEEP"

        guardrail = "No guardrail triggered."

        reason = (
            f"{merchant} is a recurring subscription "
            f"of ₹{amount:.2f} per billing cycle."
        )

        estimated_savings = 0.0


        # ====================================================
        # PROTECTED CATEGORY
        # ====================================================

        if protected:

            recommended_action = "ESCALATE"

            guardrail = (
                "Protected category requires approval."
            )

            reason = (
                f"{merchant} belongs to the protected "
                f"category '{category}'. The agent will "
                f"not recommend automatic cancellation "
                f"or downgrade."
            )

            estimated_savings = 0.0


        # ====================================================
        # HIGH WASTE
        # ====================================================

        elif waste_score >= 70:

            if amount <= auto_action_limit:

                recommended_action = "CANCEL"

                guardrail = (
                    "Within automatic action limit."
                )

                reason = (
                    f"{merchant} has a high waste score "
                    f"of {waste_score}/100 and costs "
                    f"₹{amount:.2f} per billing cycle."
                )

                estimated_savings = amount

            else:

                recommended_action = "ESCALATE"

                guardrail = (
                    "Amount exceeds automatic action limit."
                )

                reason = (
                    f"{merchant} has a high waste score "
                    f"of {waste_score}/100, but ₹{amount:.2f} "
                    f"exceeds the configured automatic action "
                    f"limit of ₹{auto_action_limit:.2f}."
                )

                estimated_savings = 0.0


        # ====================================================
        # MEDIUM WASTE
        # ====================================================

        elif waste_score >= 45:

            if amount <= auto_action_limit:

                recommended_action = "DOWNGRADE"

                guardrail = (
                    "Within automatic action limit."
                )

                reason = (
                    f"{merchant} has a medium waste score "
                    f"of {waste_score}/100. A downgrade "
                    f"could reduce recurring spending."
                )

                estimated_savings = round(
                    amount * 0.30,
                    2,
                )

            else:

                recommended_action = "ESCALATE"

                guardrail = (
                    "Amount exceeds automatic action limit."
                )

                reason = (
                    f"{merchant} may have avoidable spending, "
                    f"but the amount exceeds the automatic "
                    f"action limit."
                )

                estimated_savings = 0.0


        # ====================================================
        # LOW WASTE
        # ====================================================

        else:

            recommended_action = "KEEP"

            guardrail = (
                "No automatic action recommended."
            )

            reason = (
                f"{merchant} has a relatively low waste "
                f"score of {waste_score}/100."
            )

            estimated_savings = 0.0


        # ----------------------------------------------------
        # Confidence safety guard
        # ----------------------------------------------------

        if confidence_score < 60:

            recommended_action = "ESCALATE"

            guardrail = (
                "Low confidence requires manual review."
            )

            reason += (
                " Confidence in the detected subscription "
                "signals is below the automatic-action threshold."
            )

            estimated_savings = 0.0


        # ----------------------------------------------------
        # Add savings
        # ----------------------------------------------------

        total_savings += estimated_savings


        # ----------------------------------------------------
        # Create decision
        # ----------------------------------------------------

        decision = {
    "merchant": merchant,
    "amount": amount,
    "category": category,

    "waste_score": waste_score,

    "confidence_score": confidence_score,

    "confidence": confidence_score,

    "protected": protected,

    "guardrail": guardrail,

    "reason": reason,

    "recommended_action":
        recommended_action.lower(),

    "action":
        recommended_action.lower(),

    "estimated_monthly_savings":
        round(
            estimated_savings,
            2,
        ),

    "evidence": [],

    "source": [],
}


        decisions.append(
            decision
        )


    trace = state.get(
        "trace",
        []
    )

    trace.append(
        "Subscription risk analysis completed."
    )

    trace.append(
        f"Generated {len(decisions)} agent decision(s)."
    )

    trace.append(
        "Waste scores and confidence scores calculated."
    )


    return {

        "decisions":
            decisions,

        "savings":
            round(
                total_savings,
                2,
            ),

        "trace":
            trace,
    }


# ============================================================
# NODE 3: CREATE SUMMARY
# ============================================================

def create_summary(
    state: Dict[str, Any]
) -> Dict[str, Any]:

    decisions = state.get(
        "decisions",
        []
    )

    savings = safe_float(
        state.get(
            "savings",
            0,
        )
    )


    total_monthly_spend = 0.0

    cancel_count = 0
    downgrade_count = 0
    escalate_count = 0
    keep_count = 0


    for decision in decisions:

        amount = safe_float(
            decision.get(
                "amount",
                0,
            )
        )

        total_monthly_spend += amount


        action = clean_text(
            decision.get(
                "recommended_action",
                "KEEP",
            )
        ).upper()


        if action == "CANCEL":

            cancel_count += 1

        elif action == "DOWNGRADE":

            downgrade_count += 1

        elif action == "ESCALATE":

            escalate_count += 1

        else:

            keep_count += 1


    summary = (
        f"Guardian analyzed {len(decisions)} recurring "
        f"subscription(s). "
        f"Current recurring spend is approximately "
        f"₹{total_monthly_spend:.2f} per billing cycle. "
        f"Potential monthly savings identified: "
        f"₹{savings:.2f}. "
        f"Actions: {cancel_count} cancel, "
        f"{downgrade_count} downgrade, "
        f"{escalate_count} escalate, "
        f"{keep_count} keep."
    )


    trace = state.get(
        "trace",
        []
    )

    trace.append(
        "Agent summary generated."
    )


    return {

        "summary":
            summary,

        "trace":
            trace,
    }


# ============================================================
# NODE 4: ANALYZE EMAILS
# ============================================================

def analyze_emails(
    state: Dict[str, Any]
) -> Dict[str, Any]:

    emails = state.get(
        "emails",
        []
    )

    decisions = state.get(
        "decisions",
        []
    )


    findings = []


    # --------------------------------------------------------
    # Analyze supplied emails
    # --------------------------------------------------------

    for email in emails:

        if not isinstance(
            email,
            dict,
        ):
            continue


        subject = clean_text(
            email.get(
                "subject",
                "",
            )
        )

        sender = clean_text(
            email.get(
                "sender",
                "",
            )
        )

        body = clean_text(
            email.get(
                "body",
                "",
            )
        )


        text_content = (
            f"{subject} {sender} {body}"
        ).lower()


        # ----------------------------------------------------
        # Trial signal
        # ----------------------------------------------------

        if (
            "free trial" in text_content
            or "trial" in text_content
        ):

            findings.append(
                {
                    "type":
                        "FREE_TRIAL",

                    "message":
                        (
                            f"Possible trial detected: "
                            f"{subject or 'Subscription email'}"
                        ),
                }
            )


        # ----------------------------------------------------
        # Price increase signal
        # ----------------------------------------------------

        if (
            "price increase" in text_content
            or "price has increased" in text_content
            or "new price" in text_content
        ):

            findings.append(
                {
                    "type":
                        "PRICE_CHANGE",

                    "message":
                        (
                            f"Possible price change detected: "
                            f"{subject or 'Subscription email'}"
                        ),
                }
            )


        # ----------------------------------------------------
        # Renewal signal
        # ----------------------------------------------------

        if (
            "renewal" in text_content
            or "renewed" in text_content
            or "renewing" in text_content
        ):

            findings.append(
                {
                    "type":
                        "RENEWAL",

                    "message":
                        (
                            f"Recurring renewal signal detected: "
                            f"{subject or 'Subscription email'}"
                        ),
                }
            )


    # --------------------------------------------------------
    # Compare decisions against email evidence
    # --------------------------------------------------------

    for decision in decisions:

        if not isinstance(
            decision,
            dict,
        ):
            continue


        merchant = clean_text(
            decision.get(
                "merchant",
                "",
            )
        )


        if not merchant:
            continue


        for email in emails:

            if not isinstance(
                email,
                dict,
            ):
                continue


            email_text = " ".join(
                [
                    clean_text(
                        email.get(
                            "subject",
                            "",
                        )
                    ),
                    clean_text(
                        email.get(
                            "body",
                            "",
                        )
                    ),
                    clean_text(
                        email.get(
                            "sender",
                            "",
                        )
                    ),
                ]
            ).lower()


            if merchant.lower() in email_text:

                findings.append(
                    {
                        "type":
                            "MERCHANT_MATCH",

                        "merchant":
                            merchant,

                        "message":
                            (
                                f"Email evidence matched "
                                f"the subscription for {merchant}."
                            ),
                    }
                )

                break


    trace = state.get(
        "trace",
        []
    )

    trace.append(
        f"Email analysis completed. "
        f"{len(findings)} signal(s) found."
    )


    return {

        "email_findings":
            findings,

        "trace":
            trace,
    }


# ============================================================
# LANGGRAPH
# ============================================================

workflow = StateGraph(
    dict
)


# ------------------------------------------------------------
# Add nodes
# ------------------------------------------------------------

workflow.add_node(
    "detect_recurring",
    detect_recurring,
)

workflow.add_node(
    "analyze_subscriptions",
    analyze_subscriptions,
)

workflow.add_node(
    "create_summary",
    create_summary,
)

workflow.add_node(
    "analyze_emails",
    analyze_emails,
)


# ------------------------------------------------------------
# Define workflow
# ------------------------------------------------------------

workflow.set_entry_point(
    "detect_recurring"
)


workflow.add_edge(
    "detect_recurring",
    "analyze_subscriptions",
)


workflow.add_edge(
    "analyze_subscriptions",
    "create_summary",
)


workflow.add_edge(
    "create_summary",
    "analyze_emails",
)


workflow.add_edge(
    "analyze_emails",
    END,
)


# ------------------------------------------------------------
# Compile
# ------------------------------------------------------------

graph = workflow.compile()