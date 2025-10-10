"""
WebSocket Routes - Real-time notifications
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, Query
from app.core.websocket import manager
from app.core.auth import verify_token
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token for authentication")
):
    """
    WebSocket endpoint for real-time notifications
    Clients subscribe with JWT token
    """
    try:
        # Verify token
        from fastapi import HTTPException
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
        
        token_data = verify_token(token, credentials_exception)
        
        # Get user from database
        db: Session = next(get_db())
        user = db.query(User).filter(User.username == token_data.username).first()
        
        if not user:
            await websocket.close(code=1008)  # Policy violation
            return
        
        # Connect WebSocket
        await manager.connect(websocket, user.id)
        
        try:
            # Keep connection alive and handle messages
            while True:
                # Receive messages from client (heartbeat, acknowledgments, etc.)
                data = await websocket.receive_text()
                
                # Echo back (for debugging/heartbeat)
                await websocket.send_json({
                    "type": "pong",
                    "message": "Connection alive",
                    "user_id": user.id
                })
        
        except WebSocketDisconnect:
            manager.disconnect(websocket, user.id)
            logger.info(f"WebSocket disconnected for user:{user.username}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011)  # Internal error
        except:
            pass

