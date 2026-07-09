#!/usr/bin/env python3
"""Rename brand 'cook by Receipt' -> 'Receipt 2 meal' across tracked source files.
Excludes build output (dist/), deps (node_modules/), and git internals."""
import subprocess, os, re

ROOT = "/Users/alex/code/vibe pal/fridgechef"
EXCLUDE = ("dist/", "node_modules/", ".git/", ".workbuddy/")

files = subprocess.check_output(["git", "-C", ROOT, "ls-files"]).decode().splitlines()
changed = 0
for f in files:
    if any(f.startswith(p) or f"/" + p in "/" + f for p in EXCLUDE):
        continue
    if not f.endswith((".ts", ".tsx", ".js", ".json", ".html", ".css", ".md", ".example")):
        continue
    p = os.path.join(ROOT, f)
    try:
        with open(p, "r", encoding="utf-8") as fh:
            src = fh.read()
    except (UnicodeDecodeError, PermissionError):
        continue
    new = src.replace("cook by Receipt", "Receipt 2 meal").replace("Cook by Receipt", "Receipt 2 meal")
    if new != src:
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(new)
        changed += 1
        print("updated:", f)
print(f"\nTotal files updated: {changed}")
