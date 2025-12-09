#!/usr/bin/env python3
import os
import json
import time
from datetime import datetime

def is_binary_string(bytes_data):
    # Heuristic: NUL byte or a high ratio of non-text bytes -> binary
    if not bytes_data:
        return False
    if b'\x00' in bytes_data:
        return True
    text_chars = bytearray({7,8,9,10,12,13,27} | set(range(0x20, 0x100)))
    nontext = sum(1 for b in bytes_data if b not in text_chars)
    return (nontext / len(bytes_data)) > 0.30

def read_file_try_encodings(file_path, encodings=('utf-8', 'latin-1')):
    last_exc = None
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                return f.read(), enc
        except Exception as e:
            last_exc = e
    raise last_exc

def collect_files(folder_path, extensions):
    files_data = []
    # walk top-down so we can mutate dirs to skip
    for root, dirs, files in os.walk(folder_path, topdown=True):
        # skip unwanted directories
        for skip in ('node_modules', '.git', '__pycache__'):
            if skip in dirs:
                dirs.remove(skip)
        for file in files:
            if extensions and not any(file.lower().endswith(ext) for ext in extensions):
                continue
            file_path = os.path.join(root, file)
            try:
                stat = os.stat(file_path)
                size = stat.st_size
                mtime = datetime.fromtimestamp(stat.st_mtime).isoformat()
                # read small chunk to detect binary
                with open(file_path, 'rb') as fb:
                    sample = fb.read(4096)
                if is_binary_string(sample):
                    files_data.append({
                        'file_path': file_path,
                        'is_binary': True,
                        'size': size,
                        'mtime': mtime,
                        'warning': 'binary file skipped'
                    })
                    continue
                # try reading full file with fallback encodings
                content, used_encoding = read_file_try_encodings(file_path)
                files_data.append({
                    'file_path': file_path,
                    'content': content,
                    'encoding': used_encoding,
                    'is_binary': False,
                    'size': size,
                    'mtime': mtime
                })
            except Exception as e:
                files_data.append({
                    'file_path': file_path,
                    'error': str(e)
                })
    return files_data

def save_outputs(all_files, out_text_path):
    # Plain text concatenated dump
    with open(out_text_path, 'w', encoding='utf-8') as out:
        header = f"Dump generated: {datetime.now().isoformat()}\n"
        out.write(header)
        out.write("=" * 80 + "\n\n")
        for f in all_files:
            out.write(f"File: {f.get('file_path')}\n")
            out.write(f"Size: {f.get('size', 'N/A')}   MTime: {f.get('mtime', 'N/A')}\n")
            if f.get('is_binary'):
                out.write("[binary file skipped]\n")
            elif f.get('error'):
                out.write(f"⚠️ Error reading file: {f['error']}\n")
            else:
                out.write("-" * 60 + "\n")
                out.write(f.get('content', '')[:100000])  # cap single file dump to 100k chars
                if len(f.get('content', '')) > 100000:
                    out.write("\n\n[...content truncated...]\n")
            out.write("\n" + "=" * 80 + "\n\n")

    # Structured JSON for programmatic consumption
    # Remove raw content from large files if needed (here we keep it but could remove)
    with open(out_json_path, 'w', encoding='utf-8') as jf:
        json.dump({
            'generated_at': datetime.now().isoformat(),
            'file_count': len(all_files),
            'files': all_files
        }, jf, ensure_ascii=False, indent=2)

def main():
    # folders to scan
    folders_to_scan = [
        '/home/parrot/Desktop/Film-Finance-App/apps/api/src',   # API src only
        '/home/parrot/Desktop/Film-Finance-App/apps/web/app'    # Web app only
    ]

    # Default extensions (add or remove as you like)
    extensions = [
        '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss',
        '.env', '.md'
    ]

    all_files = []
    for folder in folders_to_scan:
        if not os.path.exists(folder):
            print(f"⚠️ Folder does not exist: {folder}")
            continue
        print(f"Scanning: {folder}")
        all_files.extend(collect_files(folder, extensions))

    out_base = '/home/parrot/Desktop/film_finance_files'
    os.makedirs(os.path.dirname(out_base), exist_ok=True)
    out_text = out_base + '.txt'

    save_outputs(all_files, out_text)

    print("✅ File extraction completed.")
    print(f"📄 Plain text saved to: {out_text}")
    print(f"Total files processed: {len(all_files)}")

if __name__ == "__main__":
    main()
