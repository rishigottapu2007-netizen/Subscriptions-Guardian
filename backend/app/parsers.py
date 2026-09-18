import io
import re
from email import policy
from email.parser import BytesParser
import pandas as pd
from bs4 import BeautifulSoup
from .models import Charge, EmailItem

MERCHANT_COLS = ["merchant", "description", "payee", "name", "vendor"]
AMOUNT_COLS = ["amount", "debit", "charge", "transaction_amount"]
DATE_COLS = ["date", "transaction_date", "posted_date"]
CATEGORY_COLS = ["category", "type"]

def _pick(df, names):
    lower = {str(c).strip().lower(): c for c in df.columns}
    for n in names:
        if n in lower:
            return lower[n]
    return None

def parse_transactions_csv(data: bytes) -> list[Charge]:
    df = pd.read_csv(io.BytesIO(data))
    merchant_col = _pick(df, MERCHANT_COLS)
    amount_col = _pick(df, AMOUNT_COLS)
    date_col = _pick(df, DATE_COLS)
    category_col = _pick(df, CATEGORY_COLS)

    if not merchant_col or not amount_col:
        raise ValueError("CSV needs a merchant/description column and an amount/debit column.")

    df[amount_col] = pd.to_numeric(
        df[amount_col].astype(str).str.replace(r"[$,]", "", regex=True),
        errors="coerce"
    )
    df = df.dropna(subset=[amount_col])

    charges = []
    for merchant, group in df.groupby(merchant_col):
        merchant = str(merchant).strip()
        amounts = group[amount_col].abs()
        if not merchant or len(amounts) == 0:
            continue

        # A lightweight recurring detector: at least 2 charges by same merchant.
        # Cadence is inferred from median day gap when dates exist.
        cadence = "monthly"
        if date_col:
            dates = pd.to_datetime(group[date_col], errors="coerce").dropna().sort_values()
            if len(dates) >= 2:
                gaps = dates.diff().dt.days.dropna()
                med = float(gaps.median()) if len(gaps) else 30
                if med <= 10:
                    cadence = "weekly"
                elif med <= 45:
                    cadence = "monthly"
                elif med <= 100:
                    cadence = "quarterly"
                else:
                    cadence = "irregular"

        category = "unknown"
        if category_col:
            vals = group[category_col].dropna().astype(str)
            if len(vals):
                category = vals.mode().iloc[0].lower().strip()

        charges.append(Charge(
            merchant=merchant,
            amount=float(amounts.iloc[-1]),
            cadence=cadence,
            category=category,
            source="csv",
            current_amount=float(amounts.iloc[-1]),
            last_billed_amount=float(amounts.iloc[-2]) if len(amounts) > 1 else None,
            metadata={
                "transaction_count": int(len(amounts)),
                "average_amount": round(float(amounts.mean()), 2),
                "max_amount": round(float(amounts.max()), 2),
            }
        ))
    return charges

def parse_eml(data: bytes) -> EmailItem:
    msg = BytesParser(policy=policy.default).parsebytes(data)
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body += part.get_content() + "\n"
            elif part.get_content_type() == "text/html":
                body += BeautifulSoup(part.get_content(), "html.parser").get_text(" ")
    else:
        body = msg.get_content()
    return EmailItem(
        sender=str(msg.get("From", "")),
        subject=str(msg.get("Subject", "")),
        date=str(msg.get("Date", "")),
        body=body[:15000]
    )

def parse_email_text(text: str) -> EmailItem:
    return EmailItem(body=text[:15000])
