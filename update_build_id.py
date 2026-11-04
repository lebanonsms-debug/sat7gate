import os

BASE = r"C:\Users\elielb\sat7-gate\src"

UPDATES = {
    f"{BASE}/app/(auth)/login/page.tsx": ('build-20261103135239', 'build-20261104084714'),
    f"{BASE}/app/(dashboard)/dashboard/page.tsx": ('build-20261103135239', 'build-20261104084714'),
}

for path, (old, new) in UPDATES.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {path}: {old} -> {new}")
