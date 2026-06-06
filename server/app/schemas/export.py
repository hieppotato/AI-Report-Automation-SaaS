from typing import Literal

from pydantic import BaseModel


ExportFormat = Literal["pdf", "docx"]


class ReportExportResponse(BaseModel):
    format: ExportFormat
    file_path: str
    signed_url: str
    expires_in: int
