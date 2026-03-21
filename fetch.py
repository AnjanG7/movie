import os

# Root directory (adjust if needed)
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# Output file
OUTPUT_FILE = os.path.join(ROOT_DIR, "combined_code.txt")

# Folders to scan
TARGET_FOLDERS = [
    os.path.join(ROOT_DIR, "apps", "api"),
    os.path.join(ROOT_DIR, "apps", "web"),
]

# Folders to exclude
EXCLUDE_DIRS = {"node_modules", ".git", ".next", "dist", "build", "__pycache__"}

# File extensions to include (None = include all)
INCLUDE_ALL_FILES = True

def should_exclude(path):
    for part in path.split(os.sep):
        if part in EXCLUDE_DIRS:
            return True
    return False


def read_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"[Error reading file: {e}]"


def collect_files():
    collected_data = []

    for base_folder in TARGET_FOLDERS:
        for root, dirs, files in os.walk(base_folder):
            # Remove excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                filepath = os.path.join(root, file)

                if should_exclude(filepath):
                    continue

                relative_path = os.path.relpath(filepath, ROOT_DIR)

                content = read_file(filepath)

                formatted = f"""
==============================
FILE: {relative_path}
==============================

{content}

"""
                collected_data.append(formatted)

    return collected_data


def main():
    print("📦 Collecting project files...")

    all_data = collect_files()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("\n".join(all_data))

    print(f"✅ Done! Output saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()