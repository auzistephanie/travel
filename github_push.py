#!/usr/bin/env python3
"""
github_push.py — 直接經 GitHub API commit + push 整個 working tree 的改動。

點解唔用 git CLI：
  Cowork sandbox 跑 `git add/commit/push` 會留低 stale `.git/index.lock` /
  `HEAD.lock`，之後所有 commit 都被擋。呢個 script 完全繞過 git CLI，
  用 GitHub Git Data API（blobs / trees / commits / refs）直接寫上 GitHub。
  偵測改動只用唯讀嘅 `git status`（唔會整 lock）。

用法：
  python3 github_push.py "你的 commit message"

Token 來源（順序）：
  1. remote URL 內嵌：https://<user>:<TOKEN>@github.com/owner/repo.git
  2. 環境變數 GITHUB_TOKEN / GH_TOKEN
  3. 檔案 .gh-token（同層，已 gitignore）
Token 只喺本機讀取，唔會 print 出嚟。
"""
import base64
import json
import os
import re
import subprocess
import sys
import urllib.request
import urllib.error

API = "https://api.github.com"


def run(args):
    return subprocess.run(args, cwd=REPO, capture_output=True, text=True)


REPO = os.path.dirname(os.path.abspath(__file__))


def get_remote_url():
    r = run(["git", "config", "--get", "remote.origin.url"])
    return r.stdout.strip()


def parse_remote(url):
    # https://[user[:token]@]github.com/OWNER/REPO(.git)
    m = re.match(r"https://(?:([^@/]+)@)?github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", url)
    if not m:
        return None, None, None
    creds, owner, repo = m.group(1), m.group(2), m.group(3)
    token = None
    if creds and ":" in creds:
        token = creds.split(":", 1)[1]
    elif creds:
        token = creds
    return token, owner, repo


def get_token(remote_token):
    if remote_token:
        return remote_token
    for env in ("GITHUB_TOKEN", "GH_TOKEN"):
        if os.environ.get(env):
            return os.environ[env]
    tokfile = os.path.join(REPO, ".gh-token")
    if os.path.isfile(tokfile):
        with open(tokfile) as f:
            return f.read().strip()
    return None


def api(method, path, token, body=None):
    url = path if path.startswith("http") else API + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "travel-app-push")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        raise SystemExit(f"❌ GitHub API {method} {path} -> {e.code}\n{msg}")


def changed_files():
    # 唯讀偵測；porcelain 已自動排除 .gitignore（node_modules/dist 等）
    r = run(["git", "status", "--porcelain=v1", "--untracked-files=all"])
    updates, deletes = [], []
    for line in r.stdout.splitlines():
        if not line.strip():
            continue
        status, path = line[:2], line[3:]
        if "->" in path:  # rename
            old, new = [p.strip().strip('"') for p in path.split("->")]
            deletes.append(old)
            updates.append(new)
            continue
        path = path.strip().strip('"')
        if "D" in status:
            deletes.append(path)
        else:
            updates.append(path)
    return sorted(set(updates)), sorted(set(deletes))


def main():
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        raise SystemExit("用法：python3 github_push.py \"commit message\"")
    message = sys.argv[1]

    remote_token, owner, repo = parse_remote(get_remote_url())
    if not owner:
        raise SystemExit("❌ 讀唔到 remote.origin.url（應為 github.com/owner/repo）")
    token = get_token(remote_token)
    if not token:
        raise SystemExit(
            "❌ 揾唔到 GitHub token。請喺 remote URL 內嵌，或設 GITHUB_TOKEN，或建 .gh-token 檔。"
        )

    updates, deletes = changed_files()
    if not updates and not deletes:
        print("Nothing to commit — 已同步。")
        return

    base = f"/repos/{owner}/{repo}/git"
    ref = api("GET", f"{base}/ref/heads/main", token)
    base_sha = ref["object"]["sha"]
    base_commit = api("GET", f"{base}/commits/{base_sha}", token)
    base_tree = base_commit["tree"]["sha"]

    tree = []
    for path in updates:
        full = os.path.join(REPO, path)
        if not os.path.isfile(full):
            continue
        with open(full, "rb") as f:
            content = f.read()
        blob = api("POST", f"{base}/blobs", token, {
            "content": base64.b64encode(content).decode(),
            "encoding": "base64",
        })
        tree.append({"path": path, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    for path in deletes:
        tree.append({"path": path, "mode": "100644", "type": "blob", "sha": None})

    new_tree = api("POST", f"{base}/trees", token, {"base_tree": base_tree, "tree": tree})
    commit = api("POST", f"{base}/commits", token, {
        "message": message,
        "tree": new_tree["sha"],
        "parents": [base_sha],
    })
    api("PATCH", f"{base}/refs/heads/main", token, {"sha": commit["sha"]})

    print(f"✅ Pushed to GitHub — {message}")
    print(f"   {len(updates)} 更新 / {len(deletes)} 刪除 · commit {commit['sha'][:7]}")


if __name__ == "__main__":
    main()
