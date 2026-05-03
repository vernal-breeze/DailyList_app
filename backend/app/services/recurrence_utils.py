"""recurrence 解析的共享工具函数。

从 task_service 和 migration_service 中提取的公共逻辑，
用于解析 recurrence 嵌套对象和日期字符串。
"""

from datetime import datetime, date
from typing import Any, Dict, Optional, Union


def parse_date(date_str: Optional[str]) -> Optional[date]:
    """统一的日期解析函数。

    将 ISO 格式的日期字符串解析为 date 对象。
    支持 "2025-01-15" 和 "2025-01-15T00:00:00" 两种格式。

    Args:
        date_str: ISO 格式的日期字符串，为 None 或空字符串时返回 None。

    Returns:
        解析后的 date 对象，解析失败时返回 None。
    """
    if not date_str:
        return None
    try:
        # 处理带时间的 ISO 格式字符串，如 "2025-01-15T00:00:00"
        if "T" in date_str:
            return datetime.fromisoformat(date_str).date()
        return date.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def parse_recurrence_data(
    recurrence: Optional[Union[Dict[str, Any], Any]],
) -> Dict[str, Any]:
    """从嵌套的 recurrence 对象中提取数据库字段。

    同时支持 Pydantic 模型（属性访问）和字典（键访问）两种输入格式，
    以兼容 task_service（Pydantic schema）和 migration_service（原始字典）。

    Args:
        recurrence: recurrence 嵌套对象，可以是 Pydantic 模型或字典。
            为 None 时返回全部为空的默认值。

    Returns:
        包含以下键的字典：
        - recurrence_type: 重复类型（如 "daily"、"weekly"），未启用时为 None
        - recurrence_interval: 重复间隔，未启用时为 None
        - recurrence_end_date: 重复结束日期（date 对象），无结束日期时为 None
        - recurrence_days: 重复的星期几列表
        - recurrence_exceptions: 重复例外日期列表
    """
    # 默认返回值
    result = {
        "recurrence_type": None,
        "recurrence_interval": None,
        "recurrence_end_date": None,
        "recurrence_days": [],
        "recurrence_exceptions": [],
    }

    if not recurrence:
        return result

    # 统一获取属性值：优先属性访问（Pydantic），回退到字典访问
    def _get(obj: Any, key: str) -> Any:
        if hasattr(obj, key):
            return getattr(obj, key)
        if isinstance(obj, dict):
            return obj.get(key)
        return None

    enabled = _get(recurrence, "enabled")
    if not enabled:
        return result

    result["recurrence_type"] = _get(recurrence, "type")
    result["recurrence_interval"] = _get(recurrence, "interval")
    result["recurrence_days"] = _get(recurrence, "days") or []
    result["recurrence_exceptions"] = _get(recurrence, "exceptions") or []

    # 解析结束日期
    end = _get(recurrence, "end")
    if end:
        end_type = _get(end, "type")
        end_date_str = _get(end, "date")
        if end_type == "on" and end_date_str:
            result["recurrence_end_date"] = parse_date(end_date_str)

    return result
