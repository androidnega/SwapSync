"""
Training Manual Routes
Provides downloadable PDF training guides for each role
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.models.user import User, UserRole
from app.core.auth import get_current_user
from app.core.training_manuals import (
    generate_shopkeeper_manual,
    generate_manager_manual,
    generate_repairer_manual
)

router = APIRouter(prefix="/training", tags=["Training"])


@router.get("/shopkeeper-manual")
def download_shopkeeper_manual(
    current_user: User = Depends(get_current_user)
):
    """Download Shop Keeper training manual (PDF)"""
    # Allow shop keepers and managers to download this
    allowed_roles = [UserRole.SHOP_KEEPER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Access denied. This manual is for Shop Keepers."
        )
    
    try:
        pdf_buffer = generate_shopkeeper_manual()
        
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={
                'Content-Disposition': 'attachment; filename=SwapSync_ShopKeeper_Training_Manual.pdf'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate manual: {str(e)}"
        )


@router.get("/manager-manual")
def download_manager_manual(
    current_user: User = Depends(get_current_user)
):
    """Download Manager training manual (PDF)"""
    # Allow managers/CEOs and admins to download this
    allowed_roles = [UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Access denied. This manual is for Managers."
        )
    
    try:
        pdf_buffer = generate_manager_manual()
        
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={
                'Content-Disposition': 'attachment; filename=SwapSync_Manager_Training_Manual.pdf'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate manual: {str(e)}"
        )


@router.get("/repairer-manual")
def download_repairer_manual(
    current_user: User = Depends(get_current_user)
):
    """Download Repairer training manual (PDF)"""
    # Allow repairers and managers to download this
    allowed_roles = [UserRole.REPAIRER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Access denied. This manual is for Repairers."
        )
    
    try:
        pdf_buffer = generate_repairer_manual()
        
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={
                'Content-Disposition': 'attachment; filename=SwapSync_Repairer_Training_Manual.pdf'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate manual: {str(e)}"
        )


@router.get("/all-manuals")
def list_available_manuals(
    current_user: User = Depends(get_current_user)
):
    """List all training manuals available to current user"""
    manuals = []
    
    if current_user.role in [UserRole.SHOP_KEEPER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        manuals.append({
            'title': 'Shop Keeper Training Manual',
            'description': 'Complete guide for POS operations and customer service',
            'role': 'Shop Keeper',
            'url': '/api/training/shopkeeper-manual',
            'filename': 'SwapSync_ShopKeeper_Training_Manual.pdf'
        })
    
    if current_user.role in [UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        manuals.append({
            'title': 'Manager Training Manual',
            'description': 'Business management, staff oversight, and analytics',
            'role': 'Manager/CEO',
            'url': '/api/training/manager-manual',
            'filename': 'SwapSync_Manager_Training_Manual.pdf'
        })
    
    if current_user.role in [UserRole.REPAIRER, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        manuals.append({
            'title': 'Repairer Training Manual',
            'description': 'Phone repair management and customer communication',
            'role': 'Repairer/Technician',
            'url': '/api/training/repairer-manual',
            'filename': 'SwapSync_Repairer_Training_Manual.pdf'
        })
    
    return {
        'success': True,
        'user_role': current_user.role.value,
        'available_manuals': manuals,
        'count': len(manuals)
    }

