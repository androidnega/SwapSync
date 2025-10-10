"""
SMS Log Model - Track all SMS notifications sent
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class SMSLog(Base):
    """
    SMS notification log for audit trail
    """
    __tablename__ = "sms_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Recipient info
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    phone_number = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    
    # Message details
    message_type = Column(String, nullable=False)  # 'swap', 'sale', 'repair_created', 'repair_update'
    message_body = Column(Text, nullable=False)
    
    # Transaction reference
    transaction_type = Column(String, nullable=True)  # 'swap', 'sale', 'repair'
    transaction_id = Column(Integer, nullable=True)
    
    # Status
    status = Column(String, default="sent")  # 'sent', 'failed', 'pending'
    error_message = Column(String, nullable=True)
    
    # Timestamp
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", backref="sms_logs")

    def __repr__(self):
        return f"<SMSLog(id={self.id}, type={self.message_type}, to={self.phone_number}, status={self.status})>"

