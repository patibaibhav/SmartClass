"""Private object storage used only by the FastAPI application layer."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from pathlib import PurePath

import httpx

from config import (
    MAX_UPLOAD_BYTES,
    STORAGE_BACKEND,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET,
    SUPABASE_URL,
)


class StorageError(RuntimeError):
    """Raised when the configured object storage cannot safely complete an operation."""


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
}
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"}


@dataclass(frozen=True)
class StoredObject:
    key: str
    content: bytes
    content_type: str


def validate_upload(filename: str, content_type: str, content: bytes) -> tuple[str, str]:
    safe_name = PurePath(filename or "").name.strip()
    extension = PurePath(safe_name).suffix.lower()
    if not safe_name or safe_name in {".", ".."} or "\x00" in safe_name:
        raise StorageError("A valid file name is required")
    if extension not in ALLOWED_EXTENSIONS:
        raise StorageError("Unsupported file type")
    if not content:
        raise StorageError("Empty files cannot be uploaded")
    if len(content) > MAX_UPLOAD_BYTES:
        raise StorageError(f"Files must be {MAX_UPLOAD_BYTES // (1024 * 1024)} MB or smaller")
    normalized_type = (content_type or "application/octet-stream").split(";", 1)[0].lower()
    if normalized_type not in ALLOWED_CONTENT_TYPES:
        raise StorageError("Unsupported content type")
    return safe_name, normalized_type


class SupabaseStorage:
    """Minimal server-side client for a private Supabase Storage bucket."""

    def __init__(self, *, url: str = SUPABASE_URL, key: str = SUPABASE_SERVICE_ROLE_KEY,
                 bucket: str = SUPABASE_STORAGE_BUCKET) -> None:
        self.url, self.key, self.bucket = url, key, bucket

    @property
    def headers(self) -> dict[str, str]:
        return {"apikey": self.key, "Authorization": f"Bearer {self.key}"}

    def create_key(self, *, course_id: str, filename: str) -> str:
        extension = PurePath(filename).suffix.lower()
        course = re.sub(r"[^A-Za-z0-9_-]", "", course_id) or "course"
        return f"materials/{course}/{uuid.uuid4().hex}{extension}"

    def upload(self, *, key: str, content: bytes, content_type: str) -> None:
        response = httpx.post(
            f"{self.url}/storage/v1/object/{self.bucket}/{key}",
            headers={**self.headers, "Content-Type": content_type, "x-upsert": "false"},
            content=content,
            timeout=30,
        )
        if response.status_code not in {200, 201}:
            raise StorageError("Storage upload failed; please try again")

    def download(self, key: str) -> StoredObject:
        response = httpx.get(
            f"{self.url}/storage/v1/object/{self.bucket}/{key}",
            headers=self.headers,
            timeout=30,
        )
        if response.status_code == 404:
            raise StorageError("The stored file is no longer available")
        if response.status_code != 200:
            raise StorageError("Storage download failed; please try again")
        return StoredObject(key=key, content=response.content,
                            content_type=response.headers.get("content-type", "application/octet-stream"))

    def delete(self, key: str) -> None:
        response = httpx.delete(
            f"{self.url}/storage/v1/object/{self.bucket}",
            headers={**self.headers, "Content-Type": "application/json"},
            json={"prefixes": [key]},
            timeout=30,
        )
        if response.status_code not in {200, 204}:
            raise StorageError("Storage deletion failed")


def get_storage() -> SupabaseStorage:
    if STORAGE_BACKEND != "supabase":
        raise StorageError("Persistent object storage is not configured")
    return SupabaseStorage()
