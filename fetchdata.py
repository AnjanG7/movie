import os

def read_code_files_in_folder(folder_path, extensions=None):
    """
    Walk through folder_path and collect all files with specified extensions (including subfolders)
    Returns a list of dictionaries with 'file_path' and 'content'.
    """
    if extensions is None:
        extensions = ['.js', '.ts', '.tsx']  # default extensions

    files_data = []

    for root, dirs, files in os.walk(folder_path):
        # Skip node_modules
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        files_data.append({
                            'file_path': file_path,
                            'content': content
                        })
                except Exception as e:
                    print(f"⚠️ Could not read file: {file_path} ({e})")
    
    return files_data


def main():
    # Scan ONLY these two folders:
    folders_to_scan = [
        '/home/parrot/Desktop/Film-Finance-App/apps/api/src',   # API src only
        '/home/parrot/Desktop/Film-Finance-App/apps/web/app'    # Web app only
    ]

    all_files = []

    for folder in folders_to_scan:
        if not os.path.exists(folder):
            print(f"⚠️ Folder does not exist: {folder}")
            continue
        all_files.extend(read_code_files_in_folder(folder))

    # Save output in project root
    output_file = '/home/parrot/Desktop/movie/allfiles.txt'

    with open(output_file, 'w', encoding='utf-8') as out:
        for f in all_files:
            out.write(f"File: {f['file_path']}\n")
            out.write("=" * 60 + "\n")
            out.write(f['content'])
            out.write("\n" + "=" * 60 + "\n\n")

    print(f"✅ File extraction completed.")
    print(f"📄 Saved to: {output_file}")


if __name__ == "__main__":    
    main()