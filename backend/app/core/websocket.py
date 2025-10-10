"""
WebSocket Manager - Real-time notifications for repair due dates and system events
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time notifications
    """
    def __init__(self):
        # Store active connections: {user_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and store new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"✅ WebSocket connected for user_id:{user_id} (Total connections: {len(self.active_connections[user_id])})")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # Clean up empty lists
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"❌ WebSocket disconnected for user_id:{user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user_id:{user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up failed connections
            for conn in disconnected:
                self.disconnect(conn, user_id)
    
    async def broadcast_to_role(self, message: dict, role: str, db_session):
        """Send message to all users of a specific role"""
        from app.models.user import User, UserRole
        
        try:
            # Get all users with specified role
            users = db_session.query(User).filter(User.role == role).all()
            
            for user in users:
                await self.send_personal_message(message, user.id)
        
        except Exception as e:
            logger.error(f"Error broadcasting to role {role}: {e}")
    
    async def notify_repair_due(self, repair_id: int, repair_info: dict, manager_id: int, repairer_id: int = None):
        """
        Send repair due notification to Manager and Repairer
        """
        notification = {
            "type": "repair_due",
            "repair_id": repair_id,
            "message": f"Repair #{repair_id} is due soon!",
            "data": repair_info,
            "timestamp": repair_info.get("due_date")
        }
        
        # Notify Manager
        await self.send_personal_message(notification, manager_id)
        
        # Notify Repairer if assigned
        if repairer_id:
            await self.send_personal_message(notification, repairer_id)


# Global connection manager instance
manager = ConnectionManager()

