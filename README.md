# 🔮 Prism - 群体知能シミュレーションエンジン

---

## 🇯🇵 日本語

### 概要
Prismは、シード情報（テキスト）を入力すると、AIエージェント群が社会をシミュレートして未来を予測するOSSエンジンです。

### インストール
```bash
git clone https://github.com/yourname/prism.git
cd prism
pip install -r requirements.txt
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定
```

### 使い方
```bash
# シミュレーション実行（ファイルからシード情報を読み込み）
python main.py simulate --file examples/pr_crisis_seed.txt

# シミュレーション実行（直接テキスト指定）
python main.py simulate --seed "ここにシナリオを入力" --agents 15 --turns 10

# 既存シミュレーションのレポート再生成
python main.py report --sim-id 1

# シミュレーション一覧
python main.py list
```

### 技術スタック
- Python 3.11+ / FastAPI / Claude API (claude-haiku-4-5-20251001) / SQLite / Click

---

## 🇺🇸 English

### Overview
Prism is an OSS engine that simulates society using AI agent swarms to predict the future from seed information (text input).

### Installation
```bash
git clone https://github.com/yourname/prism.git
cd prism
pip install -r requirements.txt
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
```

### Usage
```bash
# Run simulation from seed file
python main.py simulate --file examples/pr_crisis_seed.txt

# Run simulation with direct text
python main.py simulate --seed "Enter your scenario here" --agents 15 --turns 10

# Regenerate report for existing simulation
python main.py report --sim-id 1

# List all simulations
python main.py list
```

### Tech Stack
- Python 3.11+ / FastAPI / Claude API (claude-haiku-4-5-20251001) / SQLite / Click

---

## 🇰🇷 한국어

### 개요
Prism은 시드 정보(텍스트)를 입력하면 AI 에이전트 군이 사회를 시뮬레이션하여 미래를 예측하는 OSS 엔진입니다.

### 설치
```bash
git clone https://github.com/yourname/prism.git
cd prism
pip install -r requirements.txt
cp .env.example .env
# .env에 ANTHROPIC_API_KEY를 설정
```

### 사용법
```bash
# 시드 파일로 시뮬레이션 실행
python main.py simulate --file examples/pr_crisis_seed.txt

# 직접 텍스트로 시뮬레이션 실행
python main.py simulate --seed "여기에 시나리오를 입력" --agents 15 --turns 10

# 기존 시뮬레이션 리포트 재생성
python main.py report --sim-id 1

# 시뮬레이션 목록
python main.py list
```

### 기술 스택
- Python 3.11+ / FastAPI / Claude API (claude-haiku-4-5-20251001) / SQLite / Click

---

## License
MIT
