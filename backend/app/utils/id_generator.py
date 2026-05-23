import random
import string
from datetime import datetime, timezone


def _random_alphanumeric(length: int = 4) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def generate_purchase_id() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = _random_alphanumeric(4)
    return f"FP-{date_str}-{suffix}"


def generate_filling_id() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = _random_alphanumeric(4)
    return f"AF-{date_str}-{suffix}"
