"""
Authentication routes - Login, Register, User Management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import (
    create_access_token,
    get_current_user,
    get_current_active_admin
)
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token
)
from app.schemas.session import SessionResponse, SessionStats

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new user with hierarchy enforcement
    - Super Admin can create CEOs
    - CEO can create Shop Keepers and Repairers
    - Others cannot create users
    """
    # Check role permission
    target_role = UserRole(user_data.role)
    
    if not current_user.can_create_role(target_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to create {target_role.value} users"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with parent_user_id
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        phone_number=user_data.phone_number,
        full_name=user_data.full_name,
        company_name=user_data.company_name,  # Store company name for CEOs
        hashed_password=User.hash_password(user_data.password),
        role=target_role,
        parent_user_id=current_user.id,  # Track who created this user
        is_active=1,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.flush()
    
    # Generate unique ID based on role
    new_user.generate_unique_id(db)
    db.commit()
    db.refresh(new_user)
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"created user {new_user.username}",
        module="users",
        target_id=new_user.id,
        details=f"Created {target_role.value} account"
    )
    
    # Send welcome SMS with credentials - Using database SMS config!
    try:
        from app.core.sms import get_sms_service, get_sms_sender_name
        
        if new_user.phone_number:
            # Determine sender based on current user (creator)
            manager_id = None
            if current_user.is_manager:
                manager_id = current_user.id
            elif current_user.parent_user_id:
                # If current user is staff, use their manager
                manager_id = current_user.parent_user_id
            
            # Get dynamic sender name
            company_name = get_sms_sender_name(manager_id, "SwapSync")
            sms_service = get_sms_service()
            
            print(f"\n{'='*60}")
            print(f"[WELCOME_SMS] 📱 Sending welcome SMS")
            print(f"{'='*60}")
            print(f"New User: {new_user.username}")
            print(f"Role: {new_user.role.value}")
            print(f"Phone: {new_user.phone_number}")
            print(f"Company: {company_name}")
            print(f"SMS Service Enabled: {sms_service.enabled if sms_service else False}")
            
            if sms_service and sms_service.enabled:
                # Create welcome message
                role_name = new_user.role.value.replace('_', ' ').upper()
                message = f"Welcome to {company_name}!\n\n"
                message += f"{role_name} ACCOUNT CREATED\n"
                message += f"Username: {new_user.username}\n"
                message += f"Password: {user_data.password}\n\n"
                message += f"Login: https://swapsync.digitstec.store\n\n"
                
                # Role-specific instructions
                if new_user.role.value in ['manager', 'ceo']:
                    message += "As a Manager, you can create staff and manage operations."
                elif new_user.role.value == 'shop_keeper':
                    message += "As a Shop Keeper, you can process swaps, sales, and repairs."
                elif new_user.role.value == 'repairer':
                    message += "As a Repairer, you can manage repair jobs and track progress."
                
                result = sms_service.send_sms(
                    phone_number=new_user.phone_number,
                    message=message,
                    company_name=company_name
                )
                
                print(f"\n📊 SMS Result:")
                print(f"   Success: {result.get('success')}")
                print(f"   Provider: {result.get('provider', 'N/A')}")
                if result.get('error'):
                    print(f"   Error: {result.get('error')}")
                print(f"{'='*60}\n")
                
                if result.get('success'):
                    print(f"[WELCOME_SMS] ✅ SMS sent successfully!")
                else:
                    print(f"[WELCOME_SMS] ❌ SMS failed: {result.get('error')}")
            else:
                print(f"[WELCOME_SMS] ⚠️ SMS service not configured")
                print(f"{'='*60}\n")
        else:
            print(f"[WELCOME_SMS] ⚠️ No phone number provided, skipping SMS")
            
    except Exception as e:
        print(f"[WELCOME_SMS] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        # Don't fail user creation if SMS fails
    
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None, db: Session = Depends(get_db)):
    """
    Login with username and password
    Returns JWT access token
    """
    # Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    
    # Create new session
    new_session = UserSession(
        user_id=user.id,
        login_time=datetime.utcnow(),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Update user's current session
    user.current_session_id = new_session.id
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "session_id": new_session.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login-json", response_model=Token)
def login_json(credentials: UserLogin, request: Request = None, db: Session = Depends(get_db)):
    """
    Login with JSON body (for frontend compatibility)
    """
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    
    # Create new session
    new_session = UserSession(
        user_id=user.id,
        login_time=datetime.utcnow(),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Update user's current session
    user.current_session_id = new_session.id
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value, "session_id": new_session.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current logged-in user information
    Includes manager's company name if user is a shopkeeper/repairer
    """
    # If user is a shopkeeper/repairer with a parent (manager), get manager's company name
    if current_user.parent_user_id and not current_user.company_name:
        parent_user = db.query(User).filter(User.id == current_user.parent_user_id).first()
        if parent_user and parent_user.company_name:
            # Temporarily set company name for response
            current_user.company_name = parent_user.company_name
    
    return current_user


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    List all users (Admin only)
    """
    users = db.query(User).all()
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Update user information (Admin only)
    Admins can update: username, email, full_name, phone_number, role, company_name, is_active
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    changes = []
    
    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Check username uniqueness if updating
    if "username" in update_data and update_data["username"] != user.username:
        existing = db.query(User).filter(
            User.username == update_data["username"],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        changes.append(f"username: {user.username} → {update_data['username']}")
        user.username = update_data["username"]
    
    # Check email uniqueness if updating
    if "email" in update_data and update_data["email"] != user.email:
        existing = db.query(User).filter(
            User.email == update_data["email"],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        changes.append(f"email: {user.email} → {update_data['email']}")
        user.email = update_data["email"]
    
    # Update other fields
    if "full_name" in update_data and update_data["full_name"] != user.full_name:
        changes.append(f"name: {user.full_name} → {update_data['full_name']}")
        user.full_name = update_data["full_name"]
    
    if "phone_number" in update_data and update_data["phone_number"] != user.phone_number:
        changes.append(f"phone: {user.phone_number} → {update_data['phone_number']}")
        user.phone_number = update_data["phone_number"]
    
    if "company_name" in update_data and update_data["company_name"] != user.company_name:
        changes.append(f"company: {user.company_name} → {update_data['company_name']}")
        user.company_name = update_data["company_name"]
    
    if "role" in update_data:
        old_role = user.role.value
        user.role = UserRole(update_data["role"])
        if old_role != user.role.value:
            changes.append(f"role: {old_role} → {user.role.value}")
    
    if "is_active" in update_data:
        new_active = 1 if update_data["is_active"] else 0
        if new_active != user.is_active:
            changes.append(f"status: {'active' if user.is_active else 'inactive'} → {'active' if new_active else 'inactive'}")
            user.is_active = new_active
    
    db.commit()
    db.refresh(user)
    
    # Log activity
    from app.core.activity_logger import log_activity
    if changes:
        log_activity(
            db=db,
            user=current_user,
            action=f"updated user {user.username}",
            module="users",
            target_id=user.id,
            details=", ".join(changes)
        )
    
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Delete user (Admin only)
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return None


@router.post("/change-password")
def change_password(
    new_password: str,
    confirm_password: str = None,
    current_password: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password
    Supports:
    - Regular password change (requires current_password)
    - First-login password change (must_change_password=1, no current_password needed)
    """
    # Check if this is a first-login password change
    is_first_login = hasattr(current_user, 'must_change_password') and current_user.must_change_password == 1
    
    # Verify current password (unless first login)
    if not is_first_login and current_password:
        if not current_user.verify_password(current_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
    
    # Validate new password
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    # Validate password confirmation
    if confirm_password and new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Update password
    current_user.hashed_password = User.hash_password(new_password)
    
    # Clear must_change_password flag
    if hasattr(current_user, 'must_change_password'):
        current_user.must_change_password = 0
    
    db.commit()
    
    return {"message": "Password changed successfully", "first_login_complete": is_first_login}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Logout current user and close session
    """
    if current_user.current_session_id:
        session = db.query(UserSession).filter(UserSession.id == current_user.current_session_id).first()
        if session:
            session.logout_time = datetime.utcnow()
            session.calculate_duration()
            current_user.current_session_id = None
            db.commit()
    
    return {"message": "Logged out successfully"}


@router.get("/sessions/{user_id}", response_model=List[SessionResponse])
def get_user_sessions(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all sessions for a user
    - Admin can see all users' sessions
    - Manager can see their staff's sessions
    - Users can only see their own sessions
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    if not (current_user.is_admin or 
            current_user.id == user_id or 
            (current_user.is_manager and target_user.parent_user_id == current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's sessions"
        )
    
    sessions = db.query(UserSession).filter(UserSession.user_id == user_id).order_by(UserSession.login_time.desc()).all()
    return sessions


@router.get("/sessions/{user_id}/stats", response_model=SessionStats)
def get_user_session_stats(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get session statistics for a user
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    if not (current_user.is_admin or 
            current_user.id == user_id or 
            (current_user.is_manager and target_user.parent_user_id == current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's session stats"
        )
    
    sessions = db.query(UserSession).filter(UserSession.user_id == user_id).all()
    total_sessions = len(sessions)
    total_duration = sum(s.session_duration or 0 for s in sessions)
    average_duration = total_duration // total_sessions if total_sessions > 0 else 0
    is_active = target_user.current_session_id is not None
    
    return {
        "total_sessions": total_sessions,
        "total_duration": total_duration,
        "average_duration": average_duration,
        "last_login": target_user.last_login,
        "is_currently_active": is_active
    }


# Password reset endpoints removed - dependencies not available


@router.post("/admin/change-user-password")
def admin_change_user_password(
    user_id: int,
    new_password: str,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    """
    Admin changes any user's password directly
    """
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Change the password
    target_user.hashed_password = User.hash_password(new_password)
    db.commit()
    
    # Log the activity
    from app.core.activity_logger import log_activity
    log_activity(
        db=db,
        user=current_user,
        action=f"changed password for user {target_user.username}",
        module="users",
        target_id=target_user.id,
        details=f"Admin {current_user.username} changed password for {target_user.username}"
    )
    
    return {
        "message": f"Password changed successfully for user {target_user.username}",
        "username": target_user.username
    }

