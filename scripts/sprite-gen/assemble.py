#!/usr/bin/env python3
"""Comprueba el avance de las poses y ensambla las hojas de sprites desde el manifiesto.

Uso:
  assemble.py --check          # solo informa que poses faltan (no escribe nada)
  assemble.py                  # paleta compartida -> cuadros -> hojas validadas en art-src/kratos-2d/out/

Entrada: art-src/kratos-2d/raw/<id>.jpg|png  (imagenes generadas 1024x1024, fondo magenta #ff00ff)
Salida:  art-src/kratos-2d/frames/<id>.png y art-src/kratos-2d/out/<hoja>.png
No toca public/assets/: la integracion al juego es un paso separado, con auditoria.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(ROOT, "art-src", "kratos-2d", "raw")
FRAMES = os.path.join(ROOT, "art-src", "kratos-2d", "frames")
OUT = os.path.join(ROOT, "art-src", "kratos-2d", "out")


def find_raw(pid):
    for ext in ("jpg", "jpeg", "png"):
        p = os.path.join(RAW, f"{pid}.{ext}")
        if os.path.exists(p):
            return p
    return None


def run(args):
    r = subprocess.run([sys.executable] + args, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout + r.stderr)
        sys.exit(r.returncode)
    return r.stdout


def main():
    check = "--check" in sys.argv
    m = json.load(open(os.path.join(HERE, "poses.json")))
    total = have = 0
    complete = []
    for sh in m["sheets"]:
        ids = [f["id"] for f in sh["frames"]]
        present = [i for i in ids if find_raw(i)]
        total += len(ids)
        have += len(present)
        missing = [i for i in ids if i not in present]
        state = "COMPLETA" if not missing else f"faltan {', '.join(missing)}"
        print(f"{sh['file']:<18} {len(present)}/{len(ids)}  {state}")
        if not missing:
            complete.append(sh)
    print(f"TOTAL {have}/{total} cuadros")
    if check:
        return
    if have == 0:
        print("Nada que ensamblar.")
        return
    os.makedirs(FRAMES, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    raws = [find_raw(f["id"]) for sh in m["sheets"] for f in sh["frames"] if find_raw(f["id"])]
    pal = os.path.join(FRAMES, "_palette.png")
    args = [os.path.join(HERE, "build_shared_palette.py"), pal] + raws + [
        "--colors", str(m["maxColors"]), "--scale", str(m["scale"])]
    for a in m["accents"]:
        args += ["--accent", a]
    print(run(args).splitlines()[0])
    for sh in m["sheets"]:
        for f in sh["frames"]:
            raw = find_raw(f["id"])
            if raw:
                run([os.path.join(HERE, "process_generated_sprite.py"), raw,
                     os.path.join(FRAMES, f["id"] + ".png"), "--palette", pal,
                     "--scale", str(m["scale"])])
    for sh in complete:
        frames = [os.path.join(FRAMES, f["id"] + ".png") for f in sh["frames"]]
        print(run([os.path.join(HERE, "build_spritesheet.py"), os.path.join(OUT, sh["file"])] + frames
                  + ["--max-colors", str(m["maxColors"])]).strip())
    print("Hojas incompletas no se escriben; integrar al juego es un paso aparte.")


if __name__ == "__main__":
    main()
