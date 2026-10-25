"""Extract the single checked candidate payload; never follow archive links."""
import pathlib
import shutil
import sys
import tarfile
import zipfile

LIMIT = 2 * 1024 * 1024 * 1024


def extract(archive, destination):
    root = pathlib.Path(destination)
    root.mkdir(mode=0o700)
    with zipfile.ZipFile(archive) as zipped:
        entries = zipped.infolist()
        if len(entries) != 1 or entries[0].filename != "candidate-evidence.tar.gz":
            raise ValueError("Expected one candidate payload")
        if entries[0].file_size > LIMIT:
            raise ValueError("Candidate payload is too large")
        with zipped.open(entries[0]) as payload, tarfile.open(fileobj=payload, mode="r|gz") as tar:
            names = set()
            total = 0
            for item in tar:
                raw = item.name
                name = pathlib.PurePosixPath(raw)
                if (name.is_absolute() or ".." in name.parts or "\\" in raw
                        or any(ord(char) < 32 or ord(char) == 127 for char in raw)
                        or not (item.isfile() or item.isdir())):
                    raise ValueError("Unsafe candidate member")
                normalized = str(name)
                if normalized == "." and item.isdir():
                    continue
                if normalized in names or len(names) >= 100000:
                    raise ValueError("Duplicate or excessive candidate members")
                names.add(normalized)
                total += item.size
                if total > LIMIT:
                    raise ValueError("Extracted candidate is too large")
                target = root.joinpath(*name.parts)
                if item.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with tar.extractfile(item) as source, target.open("xb") as output:
                        shutil.copyfileobj(source, output, length=1024 * 1024)
                    target.chmod(0o700 if item.mode & 0o111 else 0o600)


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("Expected archive and new destination")
        extract(sys.argv[1], sys.argv[2])
    except Exception:
        print("Candidate extraction refused; inspect the selected artifact.", file=sys.stderr)
        sys.exit(1)
