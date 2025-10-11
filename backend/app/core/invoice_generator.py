"""
Invoice Generation Utilities
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.swap import Swap
from app.models.sale import Sale
from app.models.customer import Customer
from app.models.phone import Phone
from app.models.user import User
import json


def generate_invoice_number() -> str:
    """Generate a unique invoice number based on timestamp"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"INV-{timestamp}"


def create_swap_invoice(
    db: Session,
    swap: Swap,
    customer: Customer,
    phone: Phone,
    staff: User
) -> Invoice:
    """
    Create an invoice for a swap transaction
    """
    invoice_number = generate_invoice_number()
    
    # Build items description
    items = {
        "trade_in": {
            "description": swap.given_phone_description,
            "value": swap.given_phone_value
        },
        "new_phone": {
            "brand": phone.brand,
            "model": phone.model,
            "value": phone.value
        }
    }
    
    invoice = Invoice(
        invoice_number=invoice_number,
        transaction_type="swap",
        transaction_id=swap.id,
        customer_id=customer.id,
        customer_name=customer.full_name,
        customer_phone=customer.phone_number,
        staff_id=staff.id,
        staff_name=staff.full_name,
        original_price=phone.value,
        discount_amount=swap.discount_amount,
        cash_added=swap.balance_paid,
        final_amount=swap.final_price,
        items_description=json.dumps(items),
        created_at=datetime.utcnow()
    )
    
    db.add(invoice)
    
    # Update swap with invoice number
    swap.invoice_number = invoice_number
    
    db.commit()
    db.refresh(invoice)
    
    return invoice


def create_sale_invoice(
    db: Session,
    sale: Sale,
    customer: Customer,
    phone: Phone,
    staff: User
) -> Invoice:
    """
    Create an invoice for a direct sale transaction
    """
    invoice_number = generate_invoice_number()
    
    # Build items description
    items = {
        "phone": {
            "brand": phone.brand,
            "model": phone.model,
            "condition": phone.condition,
            "original_price": sale.original_price,
            "discount": sale.discount_amount,
            "final_price": sale.amount_paid
        }
    }
    
    invoice = Invoice(
        invoice_number=invoice_number,
        transaction_type="sale",
        transaction_id=sale.id,
        customer_id=customer.id,
        customer_name=customer.full_name,
        customer_phone=customer.phone_number,
        staff_id=staff.id,
        staff_name=staff.full_name,
        original_price=sale.original_price,
        discount_amount=sale.discount_amount,
        cash_added=0.0,
        final_amount=sale.amount_paid,
        items_description=json.dumps(items),
        created_at=datetime.utcnow()
    )
    
    db.add(invoice)
    
    # Update sale with invoice number
    sale.invoice_number = invoice_number
    
    db.commit()
    db.refresh(invoice)
    
    return invoice


def get_invoice_by_number(db: Session, invoice_number: str) -> Optional[Invoice]:
    """Get invoice by invoice number"""
    return db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first()


def get_invoices_by_customer(db: Session, customer_id: int) -> List[Invoice]:
    """Get all invoices for a customer"""
    return (
        db.query(Invoice)
        .filter(Invoice.customer_id == customer_id)
        .order_by(Invoice.created_at.desc())
        .all()
    )


def format_invoice_data(invoice: Invoice) -> dict:
    """Format invoice for display/printing"""
    items = json.loads(invoice.items_description) if invoice.items_description else {}
    
    return {
        "invoice_number": invoice.formatted_invoice_number,
        "date": invoice.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "customer": {
            "id": invoice.customer_id,
            "name": invoice.customer_name,
            "phone": invoice.customer_phone
        },
        "staff": {
            "id": invoice.staff_id,
            "name": invoice.staff_name
        },
        "transaction": {
            "type": invoice.transaction_type.upper(),
            "id": invoice.transaction_id
        },
        "pricing": {
            "original_price": invoice.original_price,
            "discount": invoice.discount_amount,
            "cash_added": invoice.cash_added,
            "final_amount": invoice.final_amount
        },
        "items": items
    }

