CURRENT_DIR=$(pwd)

PARENT_DIR=$(dirname "$CURRENT_DIR")

echo "BIM Search Web 배포 시작"

cd "$PARENT_DIR/bim-search-old"

git pull

echo "[1/5] 프로젝트 소스 동기화 완료"

npm install

echo "[2/5] 라이브러리 설치 완료"

npm run build:prod

echo "[3/5] 프로젝트 빌드 완료"

cd "$PARENT_DIR"

mv "bim-search" "bim-search-blue"

mv "bim-search-old" "bim-search"

mv "bim-search-blue" "bim-search-old"

echo "[4/5] Blue - Green 교체 완료"

cd "bim-search"

pm2 reload "bim-search"

echo "[5/5] pm2 reload 완료"

echo "BIM Search Web 배포 완료"
