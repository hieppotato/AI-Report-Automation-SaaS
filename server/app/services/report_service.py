from uuid import UUID

from app.core.exceptions import NotFoundError
from app.repositories.report_repo import ReportRepository
from app.schemas.report import ReportCreate, ReportUpdate


class ReportService:
    def __init__(self, repo: ReportRepository) -> None:
        self.repo = repo

    def list_reports(self, organization_id: UUID) -> list[dict]:
        return self.repo.get_reports_by_org(organization_id)

    def get_report(self, organization_id: UUID, report_id: UUID) -> dict:
        report = self.repo.get_report_by_id(organization_id, report_id)
        if not report:
            raise NotFoundError("Report not found.")
        return report

    def create_report(self, organization_id: UUID, payload: ReportCreate) -> dict:
        return self.repo.create_report(organization_id, payload)

    def update_report(self, organization_id: UUID, report_id: UUID, payload: ReportUpdate) -> dict:
        report = self.repo.update_report(organization_id, report_id, payload)
        if not report:
            raise NotFoundError("Report not found.")
        return report

    def delete_report(self, organization_id: UUID, report_id: UUID) -> None:
        deleted = self.repo.delete_report(organization_id, report_id)
        if not deleted:
            raise NotFoundError("Report not found.")
