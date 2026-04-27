# HTML-JS 同步验证

- 删/改HTML元素ID前，必须grep JS确认无`getElementById`/`querySelector`引用
- `addEventListener`前必须做空值检查：`if (el) el.addEventListener()` 或 `el?.addEventListener()`
- 推送前验证：grep所有`getElementById`的ID，确认HTML中存在
