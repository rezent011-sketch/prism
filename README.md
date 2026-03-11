# Prism - 群体知能シミュレーションエンジン

**AIが社会をシミュレートして未来を予測するOSSエンジン**

ブラウザで今すぐ試す → **https://rezent011-sketch.github.io/prism/**

---

## 日本語

### できること
- シナリオを入力すると、AIが自動でエージェント（人格）を生成
- 年齢・職業・価値観・立場がバラバラな人々がデジタル空間で議論
- 社会の反応・炎上リスク・市場反応を事前に予測
- 完全OSS・自分のAPIキーで動かせる（データが外部に漏れない）

### 試し方（ブラウザ）
1. https://rezent011-sketch.github.io/prism/ にアクセス
2. シナリオを入力（例：「政府が副業を全面禁止する法律を提案した」）
3. エージェント数を設定（推奨：10〜20体）
4. 「シミュレーション開始」をクリック
5. Anthropic APIキーが必要です（https://console.anthropic.com）

### ローカルでの使い方
```bash
git clone https://github.com/rezent011-sketch/prism.git
cd prism
pip install -r requirements.txt
cp .env.example .env
# .env に ANTHROPIC_API_KEY=sk-ant-... を設定
uvicorn api.server:app --reload
```

その後 http://localhost:8000 にアクセス

### 技術スタック
Python 3.11+ / FastAPI / Claude API / SQLite / React + Vite / D3.js

---

## English

### What it does
- Input a scenario → AI auto-generates agents (personas)
- Agents with different ages, jobs, values debate in a digital society
- Predicts social reactions, viral risks, market responses
- Fully OSS, runs with your own API key (data stays private)

### Try it (Browser)
1. Visit https://rezent011-sketch.github.io/prism/
2. Enter a scenario (e.g. "The government proposed a bill to ban all side jobs")
3. Set agent count (recommended: 10-20)
4. Click "Start Simulation"
5. You need an Anthropic API key: https://console.anthropic.com

### Local Setup
```bash
git clone https://github.com/rezent011-sketch/prism.git
cd prism
pip install -r requirements.txt
cp .env.example .env
# Set ANTHROPIC_API_KEY=sk-ant-... in .env
uvicorn api.server:app --reload
```

Then open http://localhost:8000

---

## 한국어

### 기능
- 시나리오 입력 → AI가 자동으로 에이전트(페르소나) 생성
- 나이, 직업, 가치관이 다른 인물들이 디지털 공간에서 토론
- 사회 반응, 바이럴 리스크, 시장 반응을 사전 예측
- 완전 오픈소스, 본인 API 키로 구동 (데이터 외부 유출 없음)

### 브라우저로 바로 체험
1. https://rezent011-sketch.github.io/prism/ 접속
2. 시나리오 입력
3. 에이전트 수 설정 (권장: 10~20명)
4. "시뮬레이션 시작" 클릭
5. Anthropic API 키 필요: https://console.anthropic.com

---

## Status / 現在の状況

| Feature | Status |
|---------|--------|
| Web UI (browser) | Stable |
| 10-20 agents | Stable |
| 100+ agents | Beta |
| Report generation | Beta |
| File upload | Beta |
| Variable injection | Beta |

v0.1 - Under active development. Feedback welcome!

## License
MIT
