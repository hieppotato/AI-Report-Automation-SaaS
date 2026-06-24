import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


@dataclass
class EmailResult:
    success: bool
    message: str


class EmailService:
    def __init__(self) -> None:
        self.api_key = settings.resend_api_key
        self.from_email = settings.invite_from_email

    def send_invitation_email(
        self,
        recipient_email: str,
        organization_name: str,
        role: str,
        accept_url: str,
        is_new_user: bool = False,
    ) -> EmailResult:
        if not self.api_key or not self.from_email:
            logger.warning("Resend not configured. Skipping email to %s", recipient_email)
            return EmailResult(success=False, message="Email service not configured.")

        if is_new_user:
            subject = f"Create your account and join {organization_name}"
            html = self._build_new_user_html(organization_name, role, accept_url)
        else:
            subject = f"You've been invited to join {organization_name}"
            html = self._build_existing_user_html(organization_name, role, accept_url)

        try:
            response = httpx.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": self.from_email,
                    "to": [recipient_email],
                    "subject": subject,
                    "html": html,
                },
                timeout=15,
            )
            if response.is_success:
                logger.info("Invitation email sent to %s for org %s", recipient_email, organization_name)
                return EmailResult(success=True, message="Email sent.")
            else:
                logger.error("Resend API error: status=%s body=%s", response.status_code, response.text)
                return EmailResult(success=False, message=f"Resend API error: {response.status_code}")
        except httpx.RequestError as exc:
            logger.error("Resend request failed: %s", exc)
            return EmailResult(success=False, message=str(exc))

    def _build_existing_user_html(self, org_name: str, role: str, accept_url: str) -> str:
        return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:32px;background:#f5f5f5;">
<div style="max-width:480px;margin:auto;background:white;border-radius:8px;padding:32px;">
<h2 style="margin-top:0;">You're invited!</h2>
<p><strong>{org_name}</strong> has invited you to join their workspace.</p>
<p>Role: <strong>{role}</strong></p>
<a href="{accept_url}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;font-weight:600;">Accept Invitation</a>
<p style="margin-top:24px;font-size:12px;color:#888;">This invitation expires in 7 days.</p>
</div>
</body>
</html>"""

    def _build_new_user_html(self, org_name: str, role: str, accept_url: str) -> str:
        return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:32px;background:#f5f5f5;">
<div style="max-width:480px;margin:auto;background:white;border-radius:8px;padding:32px;">
<h2 style="margin-top:0;">Create your account</h2>
<p><strong>{org_name}</strong> has invited you to join their workspace.</p>
<p>Role: <strong>{role}</strong></p>
<p>To accept, create your account first.</p>
<a href="{accept_url}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;font-weight:600;">Create Account &amp; Join</a>
<p style="margin-top:24px;font-size:12px;color:#888;">This invitation expires in 7 days.</p>
</div>
</body>
</html>"""
