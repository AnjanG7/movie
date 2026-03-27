import os
import subprocess


def is_gitignored(file_path, repo_root):
    """
    Check if a file is ignored by git.
    """
    try:
        result = subprocess.run(
            ['git', 'check-ignore', file_path],
            cwd=repo_root,
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except subprocess.CalledProcessError:
        return False


def get_code_files(folders, repo_root, code_extensions):
    """
    Get all code files from the specified folders, excluding gitignored files.
    """
    code_files = []
    for folder in folders:
        folder_path = os.path.join(repo_root, folder)
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                if not is_gitignored(file_path, repo_root):
                    if any(file.endswith(ext) for ext in code_extensions):
                        code_files.append(file_path)
    return code_files


if __name__ == "__main__":
    repo_root = "/home/rootroot/Documents/movie/apps"
    folders = ["api", "web"]
    code_extensions = [
        ".py", ".js", ".ts", ".tsx", ".jsx",
        ".json", ".prisma", ".md", ".css", ".scss", ".html"
    ]

    code_files = get_code_files(folders, repo_root, code_extensions)

    with open("export.txt", "w", encoding="utf-8") as f:
        f.write("Fetched code files with contents:\n\n")

        for file_path in sorted(code_files):
            f.write("=" * 80 + "\n")
            f.write(f"FILE: {file_path}\n")
            f.write("=" * 80 + "\n\n")

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as code_file:
                    content = code_file.read()
                    f.write(content)
            except Exception as e:
                f.write(f"[Error reading file: {e}]")

            f.write("\n\n")