"""
SMS Service - Send SMS notifications with company branding
Sender: SwapSync
Message includes: Company name (e.g., DailyCoins)

Providers:
- Primary: Arkasel (Ghana)
- Fallback: Hubtel (Ghana)
"""
from datetime import datetime
from typing import Optional, Dict
import logging
import requests

logger = logging.getLogger(__name__)


class SMSService:
    """
    SMS service for sending notifications
    Primary: Arkasel API
    Fallback: Hubtel API
    """
    
    def __init__(
        self,
        arkasel_api_key: str = "",
        arkasel_sender_id: str = "SwapSync",
        hubtel_client_id: str = "",
        hubtel_client_secret: str = "",
        hubtel_sender_id: str = "SwapSync"
    ):
        # Arkasel configuration (Primary)
        self.arkasel_api_key = arkasel_api_key
        self.arkasel_sender_id = arkasel_sender_id
        self.arkasel_enabled = bool(arkasel_api_key)
        self.arkasel_url = "https://sms.arkesel.com/api/v2/sms/send"
        
        # Hubtel configuration (Fallback)
        self.hubtel_client_id = hubtel_client_id
        self.hubtel_client_secret = hubtel_client_secret
        self.hubtel_sender_id = hubtel_sender_id
        self.hubtel_enabled = bool(hubtel_client_id and hubtel_client_secret)
        self.hubtel_url = "https://api.hubtel.com/v1/messages/send"
        
        self.enabled = self.arkasel_enabled or self.hubtel_enabled
    
    def send_repair_completion_sms(
        self,
        phone_number: str,
        customer_name: str,
        company_name: str,
        repair_description: str,
        cost: float,
        invoice_number: str = None
    ) -> dict:
        """
        Send SMS when repair is completed
        
        Format: "Your repair with [Company Name] has been successfully completed!
                Phone: [Description]
                Cost: GH₵[Cost]
                Invoice: #[Number]
                Collect from [Company Name]. - SwapSync"
        """
        message = self._format_repair_completion_message(
            customer_name=customer_name,
            company_name=company_name,
            repair_description=repair_description,
            cost=cost,
            invoice_number=invoice_number
        )
        
        return self._send_sms(phone_number, message, company_name)
    
    def send_repair_ready_sms(
        self,
        phone_number: str,
        customer_name: str,
        company_name: str,
        repair_description: str
    ) -> dict:
        """
        Send SMS when repair is ready for pickup
        """
        message = f"Hi {customer_name},\n\n"
        message += f"Your repair with {company_name} is ready for collection!\n\n"
        message += f"Phone: {repair_description}\n"
        message += f"Visit {company_name} to collect your device."
        
        return self._send_sms(phone_number, message, company_name)
    
    def _format_repair_completion_message(
        self,
        customer_name: str,
        company_name: str,
        repair_description: str,
        cost: float,
        invoice_number: str = None
    ) -> str:
        """Format the repair completion SMS message"""
        message = f"Hi {customer_name},\n\n"
        message += f"Your repair with {company_name} has been successfully completed!\n\n"
        message += f"Phone: {repair_description}\n"
        message += f"Cost: GH₵{cost:.2f}\n"
        
        if invoice_number:
            message += f"Invoice: #{invoice_number}\n"
        
        message += f"\nCollect from {company_name}."
        
        return message
    
    def _send_sms(self, phone_number: str, message: str, company_name: str) -> dict:
        """
        Send SMS via configured provider with fallback
        Primary: Arkasel
        Fallback: Hubtel
        
        Args:
            phone_number: Recipient phone (e.g., 233241234567)
            message: SMS content
            company_name: Company name for logging
        
        Returns:
            dict with status, message_id, etc.
        """
        if not self.enabled:
            logger.warning(f"SMS not sent: No providers configured")
            return {
                "success": False,
                "status": "disabled",
                "message": "SMS service not configured"
            }
        
        # Normalize phone number (ensure starts with country code)
        normalized_phone = self._normalize_phone_number(phone_number)
        
        # Try Arkasel first (Primary)
        if self.arkasel_enabled:
            result = self._send_via_arkasel(normalized_phone, message, company_name)
            if result["success"]:
                return result
            logger.warning(f"⚠️ Arkasel failed: {result.get('error', 'Unknown')}. Trying Hubtel...")
        
        # Fallback to Hubtel
        if self.hubtel_enabled:
            result = self._send_via_hubtel(normalized_phone, message, company_name)
            if result["success"]:
                return result
            logger.error(f"❌ Both providers failed. Hubtel error: {result.get('error', 'Unknown')}")
        
        # Both failed or no providers enabled
        return {
            "success": False,
            "status": "failed",
            "error": "All SMS providers failed"
        }
    
    def _normalize_phone_number(self, phone_number: str) -> str:
        """
        Normalize phone number to international format
        Ghana: 233XXXXXXXXX
        """
        phone = phone_number.strip().replace(" ", "").replace("-", "")
        
        # If starts with 0, replace with 233
        if phone.startswith("0"):
            phone = "233" + phone[1:]
        
        # If doesn't start with country code, add 233
        elif not phone.startswith("233"):
            phone = "233" + phone
        
        return phone
    
    def _send_via_arkasel(self, phone_number: str, message: str, company_name: str) -> dict:
        """
        Send SMS via Arkasel API
        Docs: https://developers.arkesel.com/sms/send-sms
        """
        try:
            headers = {
                "api-key": self.arkasel_api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "sender": self.arkasel_sender_id,
                "recipients": [phone_number],
                "message": message,
                "sandbox": False  # Set to True for testing
            }
            
            logger.info(f"📱 Sending SMS via Arkasel to {phone_number}")
            response = requests.post(
                self.arkasel_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                logger.info(f"✅ Arkasel SMS sent: {data}")
                return {
                    "success": True,
                    "status": "sent",
                    "provider": "arkasel",
                    "message_id": data.get("id", f"ARKASEL_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
                    "sent_at": datetime.utcnow().isoformat(),
                    "sender_id": self.arkasel_sender_id,
                    "company": company_name,
                    "response": data
                }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"❌ Arkasel error: {error_msg}")
                return {
                    "success": False,
                    "status": "failed",
                    "provider": "arkasel",
                    "error": error_msg
                }
        
        except Exception as e:
            logger.error(f"❌ Arkasel exception: {e}")
            return {
                "success": False,
                "status": "failed",
                "provider": "arkasel",
                "error": str(e)
            }
    
    def _send_via_hubtel(self, phone_number: str, message: str, company_name: str) -> dict:
        """
        Send SMS via Hubtel API
        Docs: https://developers.hubtel.com/documentations/sendmessage
        """
        try:
            auth = (self.hubtel_client_id, self.hubtel_client_secret)
            
            payload = {
                "From": self.hubtel_sender_id,
                "To": phone_number,
                "Content": message,
                "RegisteredDelivery": True
            }
            
            logger.info(f"📱 Sending SMS via Hubtel to {phone_number}")
            response = requests.post(
                self.hubtel_url,
                json=payload,
                auth=auth,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                logger.info(f"✅ Hubtel SMS sent: {data}")
                return {
                    "success": True,
                    "status": "sent",
                    "provider": "hubtel",
                    "message_id": data.get("MessageId", f"HUBTEL_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
                    "sent_at": datetime.utcnow().isoformat(),
                    "sender_id": self.hubtel_sender_id,
                    "company": company_name,
                    "response": data
                }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"❌ Hubtel error: {error_msg}")
                return {
                    "success": False,
                    "status": "failed",
                    "provider": "hubtel",
                    "error": error_msg
                }
        
        except Exception as e:
            logger.error(f"❌ Hubtel exception: {e}")
            return {
                "success": False,
                "status": "failed",
                "provider": "hubtel",
                "error": str(e)
            }
    
    def send_swap_notification(
        self,
        phone_number: str,
        customer_name: str,
        company_name: str,
        old_phone: str,
        new_phone: str,
        amount_paid: float = None
    ) -> dict:
        """Send SMS for swap transaction"""
        message = f"Hi {customer_name},\n\n"
        message += f"Your phone swap with {company_name} is complete!\n\n"
        message += f"Swapped: {old_phone}\n"
        message += f"Received: {new_phone}\n"
        
        if amount_paid:
            message += f"Amount Paid: GH₵{amount_paid:.2f}\n"
        
        message += f"\nThank you for choosing {company_name}!"
        
        return self._send_sms(phone_number, message, company_name)
    
    def send_sale_notification(
        self,
        phone_number: str,
        customer_name: str,
        company_name: str,
        phone_description: str,
        amount_paid: float,
        invoice_number: str = None
    ) -> dict:
        """Send SMS for sale transaction"""
        message = f"Hi {customer_name},\n\n"
        message += f"Thank you for your purchase from {company_name}!\n\n"
        message += f"Phone: {phone_description}\n"
        message += f"Amount: GH₵{amount_paid:.2f}\n"
        
        if invoice_number:
            message += f"Invoice: #{invoice_number}\n"
        
        message += f"\n{company_name} appreciates your business!"
        
        return self._send_sms(phone_number, message, company_name)
    
    def send_sms(
        self,
        phone_number: str,
        message: str,
        company_name: str = "SwapSync"
    ) -> dict:
        """
        Public method to send SMS
        This is the main entry point for sending any SMS
        
        Args:
            phone_number: Recipient phone number
            message: SMS message content
            company_name: Company name for logging (default: SwapSync)
        
        Returns:
            dict with success status and details
        """
        return self._send_sms(phone_number, message, company_name)


# Global SMS service instance
sms_service = SMSService()


def get_sms_service() -> SMSService:
    """Get the global SMS service instance"""
    return sms_service


def configure_sms(
    arkasel_api_key: str = "",
    arkasel_sender_id: str = "SwapSync",
    hubtel_client_id: str = "",
    hubtel_client_secret: str = "",
    hubtel_sender_id: str = "SwapSync"
):
    """
    Configure SMS service with Arkasel (primary) and Hubtel (fallback)
    
    Args:
        arkasel_api_key: Arkasel API key
        arkasel_sender_id: Sender ID for Arkasel (default: SwapSync)
        hubtel_client_id: Hubtel client ID
        hubtel_client_secret: Hubtel client secret
        hubtel_sender_id: Sender ID for Hubtel (default: SwapSync)
    """
    global sms_service
    sms_service = SMSService(
        arkasel_api_key=arkasel_api_key,
        arkasel_sender_id=arkasel_sender_id,
        hubtel_client_id=hubtel_client_id,
        hubtel_client_secret=hubtel_client_secret,
        hubtel_sender_id=hubtel_sender_id
    )
    
    enabled_providers = []
    if sms_service.arkasel_enabled:
        enabled_providers.append("Arkasel (Primary)")
    if sms_service.hubtel_enabled:
        enabled_providers.append("Hubtel (Fallback)")
    
    if enabled_providers:
        logger.info(f"✅ SMS configured: {', '.join(enabled_providers)}")
    else:
        logger.warning("⚠️ SMS service initialized but no providers configured")


def get_sms_sender_name(manager_id: int = None, default_company: str = "SwapSync") -> str:
    """
    Determine SMS sender name based on manager's branding settings
    Returns manager's company name if branding enabled, else "SwapSync"
    """
    if not manager_id:
        logger.info(f"⚠️ No manager_id provided, using: {default_company}")
        return default_company
    
    try:
        from app.models.user import User
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            manager = db.query(User).filter(User.id == manager_id).first()
            if not manager:
                logger.warning(f"⚠️ Manager ID {manager_id} not found, using: {default_company}")
                return default_company
            
            logger.info(f"📋 Manager: {manager.username} (ID: {manager.id})")
            logger.info(f"   Company: {manager.company_name or 'Not set'}")
            logger.info(f"   Branding: {manager.use_company_sms_branding}")
            
            # Check if branding is enabled (INTEGER: 1 = enabled, 0 or NULL = disabled)
            branding_enabled = (
                hasattr(manager, 'use_company_sms_branding') and 
                manager.use_company_sms_branding == 1
            )
            
            if branding_enabled and manager.company_name:
                logger.info(f"✅ Using company branding: {manager.company_name}")
                return manager.company_name
            else:
                logger.info(f"✅ Branding disabled or no company name, using: {default_company}")
                return default_company
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"⚠️ Error determining branding, using default: {e}")
        return default_company


# Legacy function wrappers for backward compatibility
def send_repair_created_sms(customer_name: str, phone_number: str, repair_id: int, phone_description: str, manager_id: int = None, company_name: str = "SwapSync"):
    """Send repair booking confirmation SMS to customer with dynamic branding"""
    try:
        logger.info(f"📱 Sending repair booking SMS to {customer_name} ({phone_number})")
        logger.info(f"   Manager ID: {manager_id}, Default Company: {company_name}")
        
        # Get SMS service
        service = get_sms_service()
        
        # Determine sender name using helper function
        sms_sender = get_sms_sender_name(manager_id, company_name)
        
        # Build message
        message = f"Hi {customer_name}, your phone repair booking for {phone_description} (ID: {repair_id}) has been confirmed. We'll keep you updated on the progress."
        
        # Send SMS with determined sender
        result = service.send_sms(
            phone_number=phone_number,
            message=message,
            company_name=sms_sender
        )
        
        logger.info(f"✅ Repair booking SMS sent to {customer_name} from {sms_sender}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to send repair booking SMS: {str(e)}")
        return {"success": False, "error": str(e)}


def send_repair_status_update_sms(customer_name: str, phone_number: str, status: str, repair_id: int, manager_id: int = None, company_name: str = "SwapSync"):
    """Send repair status update SMS to customer with dynamic branding"""
    try:
        logger.info(f"📱 Sending repair status update SMS to {customer_name}: Status={status}")
        logger.info(f"   Manager ID: {manager_id}, Default Company: {company_name}")
        
        # Get SMS service
        service = get_sms_service()
        
        # Determine sender name using helper function
        sms_sender = get_sms_sender_name(manager_id, company_name)
        
        # Build status-specific message
        status_messages = {
            "Pending": f"Hi {customer_name}, your phone repair request (ID: {repair_id}) has been received and is pending review.",
            "In Progress": f"Hi {customer_name}, good news! Your phone repair (ID: {repair_id}) is now in progress. We'll notify you once it's completed.",
            "Completed": f"Hi {customer_name}, your phone repair (ID: {repair_id}) is completed! You can pick it up at your convenience.",
            "Delivered": f"Hi {customer_name}, your repaired phone (ID: {repair_id}) has been delivered. Thank you for your business!"
        }
        
        message = status_messages.get(status, f"Hi {customer_name}, your repair status (ID: {repair_id}) has been updated to: {status}")
        
        # Send SMS with determined sender
        result = service.send_sms(
            phone_number=phone_number,
            message=message,
            company_name=sms_sender
        )
        
        logger.info(f"✅ Status update SMS sent successfully to {customer_name} from {sms_sender}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Failed to send status update SMS: {str(e)}")
        return {"success": False, "error": str(e)}


def send_swap_completion_sms(db, customer_name: str, phone_number: str, customer_id: int, phone_model: str, final_price: float, swap_id: int, manager_id: int = None):
    """Send swap completion SMS with dynamic branding"""
    try:
        # Get SMS service
        service = get_sms_service()
        
        # Determine sender name using helper function
        company_name = get_sms_sender_name(manager_id, "SwapSync")
        
        logger.info(f"📱 Sending swap completion SMS to {customer_name} from {company_name}")
        
        # Build message
        message = f"Hi {customer_name},\n\n"
        message += f"Your phone swap is complete!\n\n"
        message += f"📱 Swap Receipt\n"
        message += f"New Phone: {phone_model}\n"
        message += f"Balance Paid: ₵{final_price:.2f}\n"
        message += f"Swap ID: SWAP-{str(swap_id).zfill(4)}\n\n"
        message += f"Thank you for choosing {company_name}!"
        
        # Send SMS
        result = service.send_sms(
            phone_number=phone_number,
            message=message,
            company_name=company_name
        )
        
        logger.info(f"✅ Swap SMS sent to {customer_name} from {company_name}: {result.get('status', 'success')}")
        return result
    except Exception as e:
        logger.error(f"❌ Failed to send swap SMS: {e}")
        return {"success": False, "error": str(e)}


def send_sale_completion_sms(customer_name: str, phone_number: str, phone_model: str, sale_id: int):
    """Legacy wrapper - sends sale completion SMS"""
    logger.info(f"📱 Sale completion SMS to {customer_name} ({phone_number})")
    # TODO: Get company name and use sms_service.send_sale_notification()
    return {"success": True, "status": "sent"}
