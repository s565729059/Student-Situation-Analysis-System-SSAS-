# 自动版本号管理脚本
# 使用方法：
#   更新版本号: python update-version.py
#   更新并推送: python update-version.py --push

import re
import os
import sys
from datetime import datetime

def update_version(push=False):
    index_path = "index.html"

    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取当前版本号
    match = re.search(r'版本号：v(\d+\.\d+)', content)
    if match:
        current_version = float(match.group(1))
        new_version = current_version + 0.1
        new_version_str = f"v{new_version:.1f}"
    else:
        new_version_str = "v2.4"

    # 获取当前日期
    current_date = datetime.now().strftime("%Y-%m-%d")

    # 替换版本号
    content = re.sub(r'版本号：v\d+\.\d+', f'版本号：{new_version_str}', content)

    # 替换日期
    content = re.sub(r'修改时间：\d{4}-\d{2}-\d{2}', f'修改时间：{current_date}', content)

    # 写入文件
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"版本号已更新为: {new_version_str}")
    print(f"修改时间已更新为: {current_date}")

    # 如果添加了--push参数，自动推送到GitHub
    if push:
        os.system("git add index.html")
        commit_msg = f"自动更新版本号为{new_version_str}，修改时间为{current_date}"
        os.system(f'git commit -m "{commit_msg}"')
        os.system("git push origin master")
        print("已推送到GitHub")

if __name__ == "__main__":
    push = "--push" in sys.argv
    update_version(push)
