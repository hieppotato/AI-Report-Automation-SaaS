import json
import logging
from typing import Any
from uuid import UUID

from app.core.config import settings
from app.repositories.report_repo import ReportRepository
from app.services.file_parser import FileParserService
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)


class AIPipelineService:
    def __init__(
        self,
        report_repo: ReportRepository,
        storage_service: StorageService,
        parser: FileParserService | None = None,
    ) -> None:
        self.report_repo = report_repo
        self.storage_service = storage_service
        self.parser = parser or FileParserService()

    def run_report_pipeline(self, organization_id: UUID, report_id: UUID) -> None:
        logger.info("Pipeline started - org=%s report=%s", organization_id, report_id)
        try:
            report = self.report_repo.get_report_by_id(organization_id, report_id)
            if not report:
                raise ValueError("Report not found.")
            if not report.get("file_url"):
                raise ValueError("Report has no uploaded file.")

            self._set_progress(organization_id, report_id, "processing", 30, "Parsing data")
            logger.info("Pipeline parsing file - report=%s file_url=%s", report_id, report.get("file_url"))
            content = self.storage_service.download_file(report["file_url"])
            text = self.parser.parse(content, report.get("file_name") or "upload", report.get("file_type"))
            logger.info("Pipeline parsed file - report=%s text_length=%d", report_id, len(text))

            self._set_progress(organization_id, report_id, "processing", 50, "Generating summary")
            summary = self.summarize_content(text)
            logger.info("Pipeline generated summary - report=%s", report_id)

            self._set_progress(organization_id, report_id, "processing", 70, "Detecting anomalies")
            insights = self.generate_insights(text)
            logger.info("Pipeline generated insights - report=%s", report_id)

            self._set_progress(organization_id, report_id, "processing", 90, "Building charts")
            report_json = self.generate_report_json(text, summary, insights)
            metrics = self._extract_metrics(report_json)
            logger.info("Pipeline built report JSON - report=%s", report_id)

            self.report_repo.update_report_fields(
                organization_id,
                report_id,
                {
                    "status": "completed",
                    "progress": 100,
                    "current_step": "Completed",
                    "report_json": report_json,
                    "insights": report_json.get("insights", insights),
                    "anomalies": report_json.get("insights", {}).get("anomalies", insights.get("anomalies", [])),
                    "charts": report_json.get("charts", []),
                    "total_revenue": metrics.get("total_revenue"),
                    "total_orders": metrics.get("total_orders"),
                    "aov": metrics.get("aov"),
                    "repeat_rate": metrics.get("repeat_rate"),
                    "error_message": None,
                },
            )
            logger.info("Pipeline completed - report=%s", report_id)
        except Exception as exc:
            message = str(exc) or "Report pipeline failed."
            logger.error("Pipeline failed - report=%s error=%s", report_id, message, exc_info=True)
            self.report_repo.update_report_fields(
                organization_id,
                report_id,
                {"status": "failed", "current_step": "Failed", "error_message": message},
            )

    def summarize_content(self, text: str) -> str:
        content = self._call_gemini(
            "Summarize this business file in concise executive language. Include key numbers when present.",
            text,
        )
        return content.strip()

    def generate_insights(self, text: str) -> dict[str, list[str]]:
        raw = self._call_gemini(
            (
                "Return JSON only with keys trends, anomalies, risks, recommendations. "
                "Each value must be an array of concise strings."
            ),
            text,
        )
        parsed = self._parse_json(raw)
        return {
            "trends": self._as_string_list(parsed.get("trends")),
            "anomalies": self._as_string_list(parsed.get("anomalies")),
            "risks": self._as_string_list(parsed.get("risks")),
            "recommendations": self._as_string_list(parsed.get("recommendations")),
        }

    def generate_report_json(self, text: str, summary: str, insights: dict[str, list[str]]) -> dict[str, Any]:
        raw = self._call_gemini(
            (
                "Return JSON only with keys summary, insights, metrics, charts. "
                "summary must be a string. insights must contain trends, anomalies, risks, recommendations arrays. "
                "metrics must be an array of objects with key and numeric value for total_revenue, total_orders, aov, repeat_rate when available. "
                "charts must be an array of simple chart specs with title, type, labels, values."
            ),
            json.dumps({"summary": summary, "insights": insights, "source": text[:60_000]}),
        )
        parsed = self._parse_json(raw)
        if not parsed:
            parsed = {}
        parsed.setdefault("summary", summary)
        parsed.setdefault("insights", insights)
        parsed.setdefault("metrics", [])
        parsed.setdefault("charts", [])
        return parsed

    def _call_gemini(self, system_prompt: str, text: str) -> str:
        if not settings.google_gemini_api_key:
            raise RuntimeError("GOOGLE_GEMINI_API_KEY is not configured.")

        from google import generativeai

        generativeai.configure(api_key=settings.google_gemini_api_key)
        model = generativeai.GenerativeModel(model_name=settings.google_gemini_model)
        response = model.generate_content([system_prompt, text[:120_000]])
        return response.text or ""

    def _set_progress(self, organization_id: UUID, report_id: UUID, status: str, progress: int, step: str) -> None:
        logger.info("Pipeline progress - report=%s status=%s progress=%s step=%s", report_id, status, progress, step)
        self.report_repo.update_report_fields(
            organization_id,
            report_id,
            {"status": status, "progress": progress, "current_step": step, "error_message": None},
        )

    def _parse_json(self, text: str) -> dict[str, Any]:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            cleaned = cleaned.removeprefix("json").strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {}

    def _as_string_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    def _extract_metrics(self, report_json: dict[str, Any]) -> dict[str, float | int | None]:
        raw_metrics = report_json.get("metrics") or []
        if isinstance(raw_metrics, dict):
            raw_metrics = [{"key": key, "value": value} for key, value in raw_metrics.items()]
        if not isinstance(raw_metrics, list):
            return {}

        mapped: dict[str, float | int | None] = {}
        for metric in raw_metrics:
            if not isinstance(metric, dict):
                continue
            key = str(metric.get("key") or metric.get("name") or "").lower()
            value = metric.get("value")
            if value is None:
                continue
            if key in {"total_revenue", "revenue"}:
                mapped["total_revenue"] = float(value)
            elif key in {"total_orders", "orders"}:
                mapped["total_orders"] = int(float(value))
            elif key in {"aov", "avg_order_value"}:
                mapped["aov"] = float(value)
            elif key in {"repeat_rate", "repeat_customer_rate"}:
                mapped["repeat_rate"] = float(value)
        return mapped
