"""
Invoice API Routes - View and manage invoices
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.invoice_generator import get_invoice_by_number, format_invoice_data, get_invoices_by_customer
from app.core.pdf_generator import generate_invoice_pdf
from app.models.user import User
from app.models.invoice import Invoice

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("/{invoice_number}")
def get_invoice(
    invoice_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice by invoice number"""
    invoice = get_invoice_by_number(db, invoice_number)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return format_invoice_data(invoice)


@router.get("/customer/{customer_id}")
def get_customer_invoices(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all invoices for a specific customer"""
    invoices = get_invoices_by_customer(db, customer_id)
    
    return {
        "customer_id": customer_id,
        "total_invoices": len(invoices),
        "invoices": [format_invoice_data(inv) for inv in invoices]
    }


@router.get("/transaction/{transaction_type}/{transaction_id}")
def get_transaction_invoice(
    transaction_type: str,
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice for a specific swap or sale transaction"""
    invoice = db.query(Invoice).filter(
        Invoice.transaction_type == transaction_type,
        Invoice.transaction_id == transaction_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice not found for {transaction_type} #{transaction_id}"
        )
    
    return format_invoice_data(invoice)


@router.get("/")
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all invoices with pagination"""
    from sqlalchemy import func
    
    invoices = (
        db.query(Invoice)
        .order_by(Invoice.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return {
        "total": db.query(func.count(Invoice.id)).scalar(),
        "invoices": [format_invoice_data(inv) for inv in invoices]
    }


@router.get("/{invoice_number}/pdf")
def download_invoice_pdf(
    invoice_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download invoice as PDF"""
    invoice = get_invoice_by_number(db, invoice_number)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Format invoice data
    invoice_data = format_invoice_data(invoice)
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice_data)
    
    # Return as streaming response
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{invoice_number}.pdf"
        }
    )

