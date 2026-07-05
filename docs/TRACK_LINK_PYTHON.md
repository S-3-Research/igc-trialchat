# `build_tracked_url` — Python 使用说明

将外部链接包装成可追踪的中转 URL。源文件：`lib/track_link.py`，零依赖。

---

## 函数

```python
from __future__ import annotations

import json
import re
from urllib.parse import quote_plus, urlencode

_EXTERNAL_RE = re.compile(r"^(https?|tel|mailto):", re.IGNORECASE)


def build_tracked_url(
    raw_url: str,
    base_domain: str = "",
    meta: dict | None = None,
) -> str:
    """
    把任意外部链接包装成 /r 追踪跳转 URL。

    Args:
        raw_url:     原始目标 URL，支持 http / https / tel / mailto。
        base_domain: 域名前缀，如 "https://trialchat.example.com"。
                     留空则输出根相对路径 /r?...。
        meta:        可选附加信息字典。

    Returns:
        追踪 URL；若 raw_url 无外部协议头则原样返回。
    """
    if not _EXTERNAL_RE.match(raw_url):
        return raw_url

    params: dict[str, str] = {"to": raw_url}
    if meta:
        params["meta"] = json.dumps(meta, separators=(",", ":"), ensure_ascii=False)

    return f"{base_domain}/r?{urlencode(params, quote_via=quote_plus)}"
```

---

## 示例

```python
from track_link import build_tracked_url

# 普通网页链接
build_tracked_url("https://clinicaltrials.gov/study/NCT123")
# → /r?to=https%3A%2F%2Fclinicaltrials.gov%2Fstudy%2FNCT123

# 邮件链接
build_tracked_url("mailto:support@example.com")
# → /r?to=mailto%3Asupport%40example.com

# 电话链接
build_tracked_url("tel:+18005551234")
# → /r?to=tel%3A%2B18005551234
```
