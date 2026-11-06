#!/usr/bin/env bash
# Limpia del historial de Code-RESET/My-portafolio los PDFs borrados y las
# versiones viejas (sin tapar) de assets/docs-view y assets/thumbs.
# Conserva el CV actual. Deja main igual a claude/new-session-j4tzz8
# y borra las ramas viejas. NO SE PUEDE DESHACER (se guarda un respaldo).
#
# Requisitos: Git (Git Bash en Windows) y Python 3.
# Uso:        bash limpiar-historial.sh
set -euo pipefail

URL="https://github.com/Code-RESET/My-portafolio.git"
RAMA="claude/new-session-j4tzz8"
DIR="My-portafolio-limpieza"

# 1) Buscar un Python que funcione de verdad (en Windows "python3" puede
#    ser un acceso directo a la Microsoft Store que no hace nada).
PY=()
for cand in "py -3" "python" "python3"; do
  if $cand -c "import sys; assert sys.version_info >= (3, 6)" >/dev/null 2>&1; then
    read -r -a PY <<< "$cand"; break
  fi
done
if [ ${#PY[@]} -eq 0 ]; then
  echo "ERROR: no encontré Python 3. Instálalo desde python.org marcando 'Add python.exe to PATH',"
  echo "cierra Git Bash, ábrelo de nuevo y vuelve a correr este script."
  exit 1
fi
echo "Usando Python: ${PY[*]}"

# 2) Instalar git-filter-repo si falta (se usa como módulo de Python).
if ! "${PY[@]}" -m git_filter_repo --version >/dev/null 2>&1; then
  echo "Instalando git-filter-repo..."
  "${PY[@]}" -m pip install --user --quiet git-filter-repo
fi
"${PY[@]}" -m git_filter_repo --version >/dev/null

# 3) Copia completa del repo y respaldo.
rm -rf "$DIR"
git clone --mirror "$URL" "$DIR"
cd "$DIR"
git bundle create ../respaldo-My-portafolio-antes-de-limpiar.bundle --all

# 4) Archivos a quitar: toda versión de documentos/miniaturas que no sea la actual.
"${PY[@]}" - "$RAMA" > ../ids-a-quitar.txt <<'EOF'
import subprocess, sys
rama = sys.argv[1]
actuales = {l.split()[2] for l in subprocess.check_output(
    ["git", "ls-tree", "-r", rama, "assets"], text=True).splitlines()}
ids = set()
for line in subprocess.check_output(["git", "rev-list", "--all", "--objects"], text=True).splitlines():
    sha, _, path = line.partition(" ")
    if path.startswith(("assets/docs-view/", "assets/thumbs/", "assets/documents/")) \
            and path != "assets/documents/luis-diaz-bernal-cv.pdf" and sha not in actuales:
        ids.add(sha)
sys.stdout.write("\n".join(sorted(ids)) + "\n")
EOF
echo "Archivos viejos a quitar: $(grep -c . ../ids-a-quitar.txt)"

# 5) Reescribir el historial y publicar.
"${PY[@]}" -m git_filter_repo --strip-blobs-with-ids ../ids-a-quitar.txt --force
git update-ref refs/heads/main "refs/heads/$RAMA"
git remote add origin "$URL" 2>/dev/null || git remote set-url origin "$URL"
git push --force origin \
  refs/heads/main:refs/heads/main \
  "refs/heads/$RAMA:refs/heads/$RAMA" \
  :refs/heads/claude/apple-style-portfolio-zw3vz0 \
  :refs/heads/claude/new-session-0wbprl
echo
echo "LISTO. Respaldo guardado en: $(cd .. && pwd)/respaldo-My-portafolio-antes-de-limpiar.bundle"
