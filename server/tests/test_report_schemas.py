"""Tests for report schema validation and repository column filtering."""

import pytest
from pydantic import ValidationError

from app.repositories.report_repo import ALLOWED_REPORT_COLUMNS, _filter_payload
from app.schemas.report import ReportCreate, ReportUpdate


class TestReportCreate:
    def test_valid_title_only(self):
        report = ReportCreate(title="Sales Report")
        assert report.title == "Sales Report"
        assert report.description is None

    def test_valid_title_and_description(self):
        report = ReportCreate(title="Sales Report", description="May analysis")
        assert report.title == "Sales Report"
        assert report.description == "May analysis"

    def test_rejects_project_id(self):
        with pytest.raises(ValidationError):
            ReportCreate(
                title="Sales Report",
                project_id="550e8400-e29b-41d4-a716-446655440000",
            )

    def test_rejects_unknown_fields(self):
        with pytest.raises(ValidationError) as exc_info:
            ReportCreate(**{"title": "Sales Report", "summary": "bad field"})
        assert "extra_forbidden" in str(exc_info.value)

    def test_rejects_pipeline_fields(self):
        with pytest.raises(ValidationError):
            ReportCreate(**{"title": "Sales Report", "report_json": {"foo": "bar"}})

    def test_rejects_metrics_fields(self):
        with pytest.raises(ValidationError):
            ReportCreate(**{"title": "Sales Report", "total_revenue": 100})

    def test_rejects_status_field(self):
        with pytest.raises(ValidationError):
            ReportCreate(**{"title": "Sales Report", "status": "completed"})

    def test_rejects_empty_title(self):
        with pytest.raises(ValidationError):
            ReportCreate(title="")

    def test_rejects_missing_title(self):
        with pytest.raises(ValidationError):
            ReportCreate(**{"description": "No title provided"})

    def test_model_dump_excludes_unset(self):
        report = ReportCreate(title="Test")
        data = report.model_dump(mode="json", exclude_unset=True)
        assert data == {"title": "Test"}
        assert "description" not in data

    def test_model_dump_includes_set_fields(self):
        report = ReportCreate(title="Test", description="Desc")
        data = report.model_dump(mode="json", exclude_unset=True)
        assert data == {"title": "Test", "description": "Desc"}


class TestReportUpdate:
    def test_valid_title_only(self):
        update = ReportUpdate(title="New Title")
        assert update.title == "New Title"

    def test_valid_description_only(self):
        update = ReportUpdate(description="New desc")
        assert update.description == "New desc"

    def test_rejects_project_id(self):
        with pytest.raises(ValidationError):
            ReportUpdate(project_id="550e8400-e29b-41d4-a716-446655440000")

    def test_rejects_unknown_fields(self):
        with pytest.raises(ValidationError) as exc_info:
            ReportUpdate(**{"title": "New", "metrics": {}})
        assert "extra_forbidden" in str(exc_info.value)

    def test_rejects_pipeline_fields(self):
        with pytest.raises(ValidationError):
            ReportUpdate(**{"status": "completed"})

    def test_empty_update_has_no_fields_set(self):
        update = ReportUpdate()
        assert not update.model_fields_set


class TestColumnFiltering:
    def test_allowed_columns_match_reports_table(self):
        expected = {
            "id",
            "organization_id",
            "upload_id",
            "title",
            "description",
            "status",
            "progress",
            "current_step",
            "file_url",
            "file_name",
            "file_type",
            "report_json",
            "error_message",
            "total_revenue",
            "total_orders",
            "aov",
            "repeat_rate",
            "insights",
            "anomalies",
            "charts",
            "created_at",
            "updated_at",
        }
        assert ALLOWED_REPORT_COLUMNS == expected

    def test_filter_strips_unknown_keys(self):
        data = {"title": "Test", "summary": "bad", "metrics": {}}
        filtered = _filter_payload(data)
        assert filtered == {"title": "Test"}

    def test_filter_keeps_valid_keys(self):
        data = {
            "title": "Test",
            "description": "Desc",
            "status": "draft",
            "progress": 0,
            "organization_id": "uuid-here",
        }
        filtered = _filter_payload(data)
        assert filtered == data

    def test_filter_empty_input(self):
        assert _filter_payload({}) == {}

    def test_filter_all_invalid(self):
        data = {"foo": 1, "bar": 2, "baz": 3}
        filtered = _filter_payload(data)
        assert filtered == {}


class TestLifecycleDefaults:
    def test_create_payload_defaults(self):
        report = ReportCreate(title="Test Report")
        data = report.model_dump(mode="json", exclude_unset=True)
        assert "status" not in data
        assert "progress" not in data
