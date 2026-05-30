from io import BytesIO
from pathlib import Path

from app.core.exceptions import AppError


class FileParserService:
    max_text_chars = 120_000

    def parse(self, content: bytes, file_name: str, mime_type: str | None = None) -> str:
        suffix = Path(file_name).suffix.lower()
        if suffix == ".csv" or mime_type in {"text/csv", "application/csv"}:
            return self._parse_csv(content)
        if suffix in {".xlsx", ".xls"}:
            return self._parse_excel(content)
        if suffix == ".pdf" or mime_type == "application/pdf":
            return self._parse_pdf(content)
        raise AppError("Unsupported file type.", status_code=415, code="unsupported_file_type")

    def normalize_text(self, text: str) -> str:
        normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        if not normalized:
            raise AppError("Uploaded file does not contain readable content.", status_code=422, code="empty_file")
        return normalized[: self.max_text_chars]

    def _parse_csv(self, content: bytes) -> str:
        import pandas as pd

        dataframe = pd.read_csv(BytesIO(content))
        if dataframe.empty:
            raise AppError("CSV file is empty.", status_code=422, code="empty_file")
        preview = dataframe.head(200).to_csv(index=False)
        summary = dataframe.describe(include="all").fillna("").to_string()
        return self.normalize_text(f"CSV preview:\n{preview}\n\nDataset summary:\n{summary}")

    def _parse_excel(self, content: bytes) -> str:
        import pandas as pd

        sheets = pd.read_excel(BytesIO(content), sheet_name=None)
        if not sheets:
            raise AppError("Spreadsheet file is empty.", status_code=422, code="empty_file")

        parts = []
        for sheet_name, dataframe in sheets.items():
            if dataframe.empty:
                continue
            preview = dataframe.head(120).to_csv(index=False)
            summary = dataframe.describe(include="all").fillna("").to_string()
            parts.append(f"Sheet: {sheet_name}\nPreview:\n{preview}\nSummary:\n{summary}")

        return self.normalize_text("\n\n".join(parts))

    def _parse_pdf(self, content: bytes) -> str:
        import pdfplumber

        parts = []
        with pdfplumber.open(BytesIO(content)) as pdf:
            for index, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    parts.append(f"Page {index}:\n{page_text}")
        return self.normalize_text("\n\n".join(parts))
