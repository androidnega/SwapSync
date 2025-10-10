"""
User Session Model - Track user login/logout and activity
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class UserSession(Base):
    """
    Track user sessions - login, logout, duration
    """
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    login_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    logout_time = Column(DateTime, nullable=True)
    session_duration = Column(Integer, nullable=True)  # in seconds
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", backref="sessions")

    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, login={self.login_time})>"
    
    def calculate_duration(self):
        """Calculate session duration in seconds"""
        if self.logout_time and self.login_time:
            delta = self.logout_time - self.login_time
            self.session_duration = int(delta.total_seconds())
            return self.session_duration
        return None
    
    def get_duration_formatted(self):
        """Get session duration in human-readable format"""
        if not self.session_duration:
            return "Active"
        
        hours = self.session_duration // 3600
        minutes = (self.session_duration % 3600) // 60
        seconds = self.session_duration % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"


