import re
from .models import EmailItem

TRIAL = re.compile(r"\b(free trial|trial ends|trial is ending|trial has ended|starts? charging|will be charged)\b", re.I)
PRICE = re.compile(r"\b(price|pricing|subscription fee|monthly fee|plan).*?\b(increase|increased|higher|changed)\b", re.I)
CANCEL = re.compile(r"\b(subscription|membership).{0,50}\b(cancel|renew|renewal)\b", re.I)
MONEY = re.compile(r"[$€£]\s?\d+(?:[.,]\d{2})?")

def scan_emails(emails: list[EmailItem]):
    findings = []
    for e in emails:
        text = f"{e.subject}\n{e.body}"
        flags = []
        if TRIAL.search(text):
            flags.append("free_trial_to_paid")
        if PRICE.search(text):
            flags.append("price_hike")
        if CANCEL.search(text):
            flags.append("renewal_or_cancellation")
        amounts = MONEY.findall(text)

        if flags:
            findings.append({
                "subject": e.subject,
                "sender": e.sender,
                "flags": flags,
                "amounts": amounts[:5],
                "snippet": re.sub(r"\s+", " ", e.body)[:300],
            })
    return findings
