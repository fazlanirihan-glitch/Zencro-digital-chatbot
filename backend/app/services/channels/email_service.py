import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

logger = logging.getLogger("app.services.channels.email")

class EmailProvider(ABC):
    """
    Abstract Interface for Transactional Emails.
    Allows swapping between SendGrid, AWS SES, or SMTP.
    """

    @abstractmethod
    async def send_email(self, to_address: str, subject: str, html_body: str) -> bool:
        pass

class NotificationEngine:
    def __init__(self, provider: EmailProvider):
        self.provider = provider

    async def send_lead_alert(self, admin_email: str, lead_data: Dict[str, Any]):
        """Triggered when the chatbot qualifies a high-intent lead."""
        subject = f"🚨 New High-Intent Lead: {lead_data.get('name', 'Anonymous')}"
        body = f"""
        <h3>New Lead Captured by AI Chatbot</h3>
        <p><strong>Name:</strong> {lead_data.get('name')}</p>
        <p><strong>Phone:</strong> {lead_data.get('phone')}</p>
        <p><strong>Requirements:</strong> {lead_data.get('requirements')}</p>
        <p><strong>Intent Score:</strong> {lead_data.get('score')}</p>
        <br/>
        <a href="https://yourdomain.com/admin/dashboard/leads">View in CRM</a>
        """
        await self.provider.send_email(admin_email, subject, body)
        logger.info(f"Lead Alert Sent to {admin_email}")
