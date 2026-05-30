from types import SimpleNamespace

from app.services.ai_pipeline import AIPipelineService


class DummyReportRepo:
    def create_report_job(self, *args, **kwargs):
        return {"id": "job-1"}

    def get_report_by_id(self, *args, **kwargs):
        return None

    def update_report_fields(self, *args, **kwargs):
        return None

    def update_report_job(self, *args, **kwargs):
        return None


class DummyStorageService:
    def download_file(self, *args, **kwargs):
        return b""


class DummyResponse:
    text = "Executive summary"


def test_summarize_content_uses_gemini_config(monkeypatch):
    captured = {}

    def fake_configure(api_key):
        captured["api_key"] = api_key

    def fake_model(model_name):
        captured["model_name"] = model_name
        return SimpleNamespace(generate_content=lambda prompt: DummyResponse())

    monkeypatch.setattr("app.services.ai_pipeline.settings.google_gemini_api_key", "test-gemini-key", raising=False)
    monkeypatch.setattr("app.services.ai_pipeline.settings.google_gemini_model", "gemini-test-model", raising=False)
    monkeypatch.setattr("google.generativeai.configure", fake_configure, raising=False)
    monkeypatch.setattr("google.generativeai.GenerativeModel", fake_model, raising=False)

    service = AIPipelineService(DummyReportRepo(), DummyStorageService())

    summary = service.summarize_content("sample text")

    assert summary == "Executive summary"
    assert captured["api_key"] == "test-gemini-key"
    assert captured["model_name"] == "gemini-test-model"
