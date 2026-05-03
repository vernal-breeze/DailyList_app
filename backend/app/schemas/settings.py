from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


ThemeType = Literal["light", "dark"]
SortByType = Literal["priority", "dueDate", "createdAt", "title"]


class SettingsUpdate(BaseModel):
    theme: Optional[ThemeType] = None
    sort_by: Optional[SortByType] = None
    show_completed: Optional[bool] = None

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class SettingsResponse(BaseModel):
    id: int
    theme: str
    sort_by: str
    show_completed: bool
    updated_at: str

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )
