# =========================================
# FILE: agents/agent2_ledger.py
# =========================================
#
# SMART RECONCILIATION LOGIC (works for any future invoice):
#
#  Step 1 — Vendor check
#    • Known vendor  →  proceed normally
#    • New vendor    →  AUTO-REGISTER with risk_score=50 ("unknown / first seen")
#                       and continue (don't hard-fail; new legitimate vendors
#                       should not be blocked just because they're new to the DB)
#
#  Step 2 — Ledger check
#    • Invoice found, amounts match    →  proceed (clean reconciliation)
#    • Invoice found, amounts DIFFER   →  FLAGGED as "Price Alteration"
#      (this is actual fraud evidence — a known invoice was tampered)
#    • Invoice NOT found (brand new)   →  AUTO-SAVE to purchase_ledgers and
#                                         proceed (new invoice ≠ fraud)
#
#  Step 3 — Bank payment check
#    • Payment found matching amount  →  fully validated, "APPROVED" path
#    • No payment found               →  is_valid = True but with a
#                                         "Pending Payment" warning so the
#                                         pipeline still reaches Agent 3.
#                                         The final status note flags it for
#                                         follow-up rather than hard-blocking.
#
# Only REAL fraud signals hard-fail (is_valid=False):
#   - Price alteration on a known invoice
#   - Invoice number missing entirely

from schemas import ExtractedInvoice
from database import get_db_connection, log_ai_action

AGENT_NAME = "Agent2_Ledger"
AMOUNT_TOLERANCE = 1.0   # ±₹1 margin absorbs AI-extraction rounding noise


async def verify_ledger_data(extracted_data: ExtractedInvoice, invoice_id: str) -> dict:
    """
    Smart ledger reconciliation that works for any invoice — known or new.

    Returns:
        dict with keys:
          is_valid (bool)       – False only when real fraud is detected
          error_message (str)   – human-readable result / warning
          payment_status (str)  – 'CLEARED', 'PENDING', or 'N/A'
    """
    conn = None
    cursor = None

    # ── STEP 0: Sanitize AI-extracted strings ──────────────────────────────
    ai_invoice_num = (extracted_data.invoice_number or "").strip().upper()
    ai_gstin       = (extracted_data.vendor_gstin   or "").strip().upper()
    ai_vendor_name = (extracted_data.vendor_name    or "Unknown Vendor").strip()
    extracted_total = float(extracted_data.total_amount)

    if not ai_invoice_num:
        log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                      action_taken="FLAGGED",
                      reason="Invoice number missing or empty after sanitization.")
        return {"is_valid": False,
                "error_message": "Invoice number is missing",
                "payment_status": "N/A"}

    # Reject obviously invalid GSTINs (must be 15 alphanumeric chars)
    if len(ai_gstin) != 15 or not ai_gstin.isalnum():
        log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                      action_taken="FLAGGED",
                      reason=f"Invalid GSTIN format: '{ai_gstin}' (must be 15 alphanumeric chars).")
        return {"is_valid": False,
                "error_message": f"Invalid GSTIN format: {ai_gstin}",
                "payment_status": "N/A"}

    print(f"\n[AGENT 2] Invoice: '{ai_invoice_num}' | GSTIN: '{ai_gstin}' | Total: {extracted_total}")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ── STEP 1: Vendor check — auto-register if not known ─────────────
        cursor.execute(
            "SELECT vendor_gstin, vendor_name FROM vendors WHERE UPPER(TRIM(vendor_gstin)) = %s;",
            (ai_gstin,)
        )
        vendor_row = cursor.fetchone()
        is_new_vendor = vendor_row is None

        if is_new_vendor:
            state_code = ai_gstin[:2]   # first 2 digits = state code per GST spec
            cursor.execute(
                """
                INSERT INTO vendors (vendor_gstin, vendor_name, state_code, risk_score)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (vendor_gstin) DO NOTHING;
                """,
                (ai_gstin, ai_vendor_name, state_code, 50)
            )
            print(f"[AGENT 2] New vendor auto-registered: {ai_gstin} ({ai_vendor_name})")
            log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                          action_taken="INFO",
                          reason=f"New vendor auto-registered: GSTIN={ai_gstin}, "
                                 f"Name='{ai_vendor_name}', risk_score=50 (first-seen default).")
            vendor_note = "New vendor (auto-registered)"
        else:
            vendor_note = "Known vendor"
            print(f"[AGENT 2] Vendor found in DB: {vendor_row['vendor_gstin']}")

        # ── STEP 2: Ledger check ────────────────────────────────────────────
        cursor.execute(
            """
            SELECT total_amount FROM purchase_ledgers
            WHERE UPPER(TRIM(invoice_id)) = %s AND UPPER(TRIM(vendor_gstin)) = %s
            LIMIT 1;
            """,
            (ai_invoice_num, ai_gstin)
        )
        ledger_row = cursor.fetchone()
        is_new_invoice = ledger_row is None

        if is_new_invoice:
            # Brand-new invoice → save it and continue (not fraud, just new)
            cursor.execute(
                """
                INSERT INTO purchase_ledgers
                    (invoice_id, vendor_gstin, base_amount, tax_amount, total_amount, status)
                VALUES (%s, %s, %s, %s, %s, 'PENDING')
                ON CONFLICT (invoice_id) DO NOTHING;
                """,
                (
                    ai_invoice_num,
                    ai_gstin,
                    float(extracted_data.base_amount),
                    float(extracted_data.tax_amount),
                    extracted_total,
                )
            )
            print(f"[AGENT 2] New invoice auto-saved to purchase_ledgers: {ai_invoice_num}")
            log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                          action_taken="INFO",
                          reason=f"New invoice auto-saved: {ai_invoice_num} | "
                                 f"total={extracted_total} | vendor={ai_gstin}.")
            ledger_note = "New invoice (auto-saved to ledger)"

        else:
            ledger_total = float(ledger_row["total_amount"])
            if abs(ledger_total - extracted_total) > AMOUNT_TOLERANCE:
                # Known invoice with DIFFERENT amount → real fraud signal
                log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                              action_taken="FLAGGED",
                              reason=f"Price alteration: ledger total={ledger_total}, "
                                     f"extracted total={extracted_total}.")
                conn.commit()
                return {
                    "is_valid": False,
                    "error_message": (
                        f"Price Alteration Detected: Invoice total on file is "
                        f"Rs.{ledger_total:,.2f} but document shows Rs.{extracted_total:,.2f}"
                    ),
                    "payment_status": "N/A",
                }
            ledger_note = "Ledger amount matched"
            print(f"[AGENT 2] Ledger amount matched: {ledger_total}")

        # Commit vendor + ledger inserts before the bank check
        conn.commit()

        # ── STEP 3: Bank payment check ──────────────────────────────────────
        cursor.execute(
            """
            SELECT amount_paid FROM bank_transactions
            WHERE UPPER(TRIM(vendor_gstin)) = %s
              AND ABS(amount_paid - %s) <= %s
            LIMIT 1;
            """,
            (ai_gstin, extracted_total, AMOUNT_TOLERANCE)
        )
        bank_row = cursor.fetchone()

        if bank_row is not None:
            payment_status = "CLEARED"
            summary = (
                f"Ledger & bank verified. {vendor_note}. {ledger_note}. "
                f"Bank payment cleared for Rs.{extracted_total:,.2f}."
            )
            log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                          action_taken="VALIDATED", reason=summary)
            print(f"[AGENT 2] Bank payment found and cleared.")
        else:
            # Missing bank payment → flag for follow-up but don't hard-block
            payment_status = "PENDING"
            summary = (
                f"{vendor_note}. {ledger_note}. "
                f"No bank payment found yet for Rs.{extracted_total:,.2f} "
                f"— marked as Pending Payment."
            )
            log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                          action_taken="INFO",
                          reason=f"No bank_transactions record for GSTIN={ai_gstin} "
                                 f"amount={extracted_total}. Payment may be outstanding.")
            print(f"[AGENT 2] No bank payment found — continuing as Pending Payment.")

        return {
            "is_valid": True,
            "error_message": summary,
            "payment_status": payment_status,
        }

    except Exception as e:
        error_msg = f"Ledger verification failed due to internal error: {str(e)}"
        log_ai_action(invoice_id=invoice_id, agent_name=AGENT_NAME,
                      action_taken="ERROR", reason=error_msg)
        return {"is_valid": False, "error_message": error_msg, "payment_status": "N/A"}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()