from uuid import UUID

from app.repositories.profile_repo import ProfileRepository
from app.schemas.profile import ProfileUpdate


class ProfileService:
    def __init__(self, repo: ProfileRepository) -> None:
        self.repo = repo

    def get_profile(self, user_id: UUID) -> dict:
        profile = self.repo.get_by_user_id(user_id)
        if profile:
            return profile
        return self.repo.create_if_missing(user_id)

    def update_profile(self, user_id: UUID, payload: ProfileUpdate) -> dict:
        existing = self.repo.get_by_user_id(user_id)
        if not existing:
            self.repo.create_if_missing(user_id)
        if not payload.model_fields_set:
            return existing or self.repo.get_by_user_id(user_id) or self.repo.create_if_missing(user_id)
        profile = self.repo.update_profile(user_id, payload)
        if profile:
            return profile
        return self.repo.get_by_user_id(user_id) or self.repo.create_if_missing(user_id)
