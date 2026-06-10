import io
from typing import Any, Dict
import pdfplumber
from core.database import DatabaseRepository
from core.ai_client import AIClient

class CvService:
    def __init__(self, db_repo: DatabaseRepository, ai_client: AIClient):
        self.db_repo = db_repo
        self.ai_client = ai_client

    def extract_cv_text(self, file_bytes: bytes) -> str:
        """Extract plain text from PDF bytes."""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)

    async def parse_cv_for_user(self, user_id: str) -> Dict[str, Any]:
        """Download user's CV PDF, extract text, call AI parser, and update profile."""
        path = f"{user_id}/cv.pdf"
        try:
            file_bytes = await self.db_repo.download_storage_file("cvs", path)
        except Exception:
            raise FileNotFoundError("CV bulunamadı — önce yükleyin")

        if len(file_bytes) > 10 * 1024 * 1024:
            raise ValueError("CV dosyası 10 MB sınırını aşıyor")
        if not file_bytes.startswith(b"%PDF"):
            raise ValueError("Geçersiz dosya formatı — yalnızca PDF kabul edilir")

        text = self.extract_cv_text(file_bytes)
        if not text.strip():
            raise ValueError("PDF'den metin çıkarılamadı")

        parsed = await self.ai_client.parse_cv(text)

        await self.db_repo.upsert_profile(user_id, {
            "cv_url": path,
            "cv_parsed": parsed,
        })

        return parsed
