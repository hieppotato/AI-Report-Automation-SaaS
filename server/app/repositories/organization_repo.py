from typing import Any
from uuid import UUID

from supabase import Client

from app.core.exceptions import RepositoryError
from app.repositories.base import execute_query, first_or_none, response_count
from app.schemas.organization import AddOrganizationMemberRequest, OrganizationCreate


class OrganizationRepository:
    def __init__(self, supabase: Client) -> None:
        self.supabase = supabase

    def get_by_id(self, organization_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organizations")
            .select("*")
            .eq("id", str(organization_id))
            .limit(1)
            .execute(),
            "Failed to fetch organization",
        )
        return first_or_none(response.data)

    def get_by_slug(self, slug: str) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organizations").select("*").eq("slug", slug).limit(1).execute(),
            "Failed to fetch organization by slug",
        )
        return first_or_none(response.data)

    def get_user_orgs(self, user_id: UUID) -> list[dict[str, Any]]:
        response = execute_query(
            lambda: self.supabase.table("organization_members")
            .select("organizations(*)")
            .eq("user_id", str(user_id))
            .execute(),
            "Failed to fetch user organizations",
        )
        return [row["organizations"] for row in response.data or [] if row.get("organizations")]

    def create_org(self, payload: OrganizationCreate, owner_id: UUID) -> dict[str, Any]:
        data = payload.model_dump(mode="json")
        data["owner_id"] = str(owner_id)
        response = execute_query(
            lambda: self.supabase.table("organizations").insert(data).execute(),
            "Failed to create organization",
        )
        return response.data[0]

    def create_owner_membership(self, organization_id: UUID, owner_id: UUID) -> dict[str, Any]:
        data = {
            "organization_id": str(organization_id),
            "user_id": str(owner_id),
            "role": "owner",
        }
        response = execute_query(
            lambda: self.supabase.table("organization_members").upsert(data).execute(),
            "Failed to create owner membership",
        )
        return response.data[0]

    def get_membership(self, organization_id: UUID, user_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organization_members")
            .select("*")
            .eq("organization_id", str(organization_id))
            .eq("user_id", str(user_id))
            .limit(1)
            .execute(),
            "Failed to fetch organization membership",
        )
        return first_or_none(response.data)

    def list_members(self, organization_id: UUID, limit: int | None = None, offset: int = 0) -> list[dict[str, Any]]:
        query = (
            self.supabase.table("organization_members")
            .select("*")
            .eq("organization_id", str(organization_id))
            .order("created_at", desc=False)
        )
        if limit is not None:
            query = query.range(offset, offset + limit - 1)
        response = execute_query(
            lambda: query.execute(),
            "Failed to list organization members",
        )
        return response.data or []

    def list_members_paginated(
        self,
        organization_id: UUID,
        limit: int,
        offset: int,
    ) -> tuple[list[dict[str, Any]], int]:
        response = execute_query(
            lambda: self.supabase.table("organization_members")
            .select("*", count="exact")
            .eq("organization_id", str(organization_id))
            .order("created_at", desc=False)
            .range(offset, offset + limit - 1)
            .execute(),
            "Failed to list organization members",
        )
        return response.data or [], response_count(response)

    def add_member(self, organization_id: UUID, payload: AddOrganizationMemberRequest) -> dict[str, Any]:
        if payload.user_id is None:
            raise RepositoryError("Cannot add organization member without a user id.")
        data = {
            "organization_id": str(organization_id),
            "user_id": str(payload.user_id),
            "role": payload.role,
        }
        response = execute_query(
            lambda: self.supabase.table("organization_members").upsert(data).execute(),
            "Failed to add organization member",
        )
        return response.data[0]

    def get_user_id_by_email(self, email: str) -> UUID | None:
        try:
            users = self.supabase.auth.admin.list_users()
        except Exception as exc:
            raise RepositoryError("Failed to lookup Supabase user by email.") from exc

        for user in users:
            if (user.email or "").lower() == email.lower():
                return UUID(str(user.id))
        return None

    def remove_member(self, organization_id: UUID, user_id: UUID) -> bool:
        response = execute_query(
            lambda: self.supabase.table("organization_members")
            .delete()
            .eq("organization_id", str(organization_id))
            .eq("user_id", str(user_id))
            .execute(),
            "Failed to remove organization member",
        )
        return bool(response.data)

    def get_membership_by_id(self, organization_id: UUID, member_id: UUID) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organization_members")
            .select("*")
            .eq("organization_id", str(organization_id))
            .eq("id", str(member_id))
            .limit(1)
            .execute(),
            "Failed to fetch organization member",
        )
        return first_or_none(response.data)

    def update_member_role(self, organization_id: UUID, member_id: UUID, role: str) -> dict[str, Any] | None:
        response = execute_query(
            lambda: self.supabase.table("organization_members")
            .update({"role": role})
            .eq("organization_id", str(organization_id))
            .eq("id", str(member_id))
            .execute(),
            "Failed to update organization member role",
        )
        return first_or_none(response.data)
