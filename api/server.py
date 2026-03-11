"""Prism Web API - FastAPIサーバー"""
import sys
import os

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, BackgroundTasks, UploadFile, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import asyncio
import json

from prism.database import (
    init_db, create_simulation, update_simulation_status,
    list_simulations, get_agents, get_interactions, get_relations,
    get_emotion_trajectory, get_relationship_history, get_knowledge_nodes,
    get_simulation
)
from prism.models import Simulation
from prism.agent_generator import generate_agents
from prism.simulator import run_simulation
from prism.reporter import generate_report

# DB初期化
init_db()

app = FastAPI(title="Prism API", description="群体知能シミュレーションエンジン API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://rezent011-sketch.github.io", "https://prism-n5z8.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# リクエスト/レスポンスモデル
class SimulateRequest(BaseModel):
    seed: str
    agent_count: int = 15
    turn_count: int = 10


class SimulateResponse(BaseModel):
    simulation_id: int


# バックグラウンドでシミュレーションを実行
def _run_simulation_bg(sim_id: int, seed_text: str, agent_count: int, turn_count: int, api_key: str = ""):
    """バックグラウンドタスク: シミュレーション実行"""
    original_key = ""
    try:
        if api_key:
            original_key = os.environ.get("ANTHROPIC_API_KEY", "")
            os.environ["ANTHROPIC_API_KEY"] = api_key
        print(f"[sim_{sim_id}] 開始: agent_count={agent_count}, turn_count={turn_count}")
        update_simulation_status(sim_id, "running")
        agents = generate_agents(seed_text, sim_id, agent_count)
        print(f"[sim_{sim_id}] エージェント生成完了: {len(agents)}体")
        run_simulation(seed_text, agents, sim_id, turn_count, enable_memory=False, enable_graph=False)
        update_simulation_status(sim_id, "completed")
        print(f"[sim_{sim_id}] 完了")
        if api_key:
            os.environ["ANTHROPIC_API_KEY"] = original_key
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"[sim_{sim_id}] エラー: {e}\n{err}")
        update_simulation_status(sim_id, "failed")
        if api_key:
            os.environ["ANTHROPIC_API_KEY"] = original_key


@app.get("/api/health")
def health():
    """ヘルスチェック"""
    return {"status": "ok"}



@app.get("/api/debug/test")
def debug_test():
    """APIキーと依存関係のデバッグ"""
    import os
    key = os.getenv("ANTHROPIC_API_KEY", "")
    return {
        "api_key_set": bool(key),
        "api_key_prefix": key[:15] + "..." if key else "NOT SET"
    }

@app.post("/api/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest, background_tasks: BackgroundTasks, x_api_key: Optional[str] = Header(None)):
    """シミュレーションを開始（バックグラウンド実行）"""
    sim = Simulation(
        seed_text=req.seed,
        agent_count=max(5, min(1000, req.agent_count)),
        turn_count=max(3, min(50, req.turn_count)),
        status="created",
    )
    sim_id = create_simulation(sim)
    api_key_to_use = x_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    background_tasks.add_task(_run_simulation_bg, sim_id, req.seed, sim.agent_count, sim.turn_count, api_key_to_use)
    return {"simulation_id": sim_id}


@app.get("/api/simulations")
def get_simulations():
    """シミュレーション一覧を取得"""
    sims = list_simulations()
    return [
        {
            "id": s.id,
            "status": s.status,
            "agent_count": s.agent_count,
            "turn_count": s.turn_count,
            "created_at": s.created_at,
            "seed": s.seed_text[:100],
        }
        for s in sims
    ]


@app.get("/api/simulations/{sim_id}")
def get_simulation_detail(sim_id: int):
    """シミュレーション詳細を取得"""
    sims = list_simulations()
    sim = next((s for s in sims if s.id == sim_id), None)
    if not sim:
        raise HTTPException(status_code=404, detail="シミュレーションが見つかりません")

    agents = get_agents(sim_id)
    interactions = get_interactions(sim_id)

    return {
        "simulation": {
            "id": sim.id,
            "seed": sim.seed_text,
            "status": sim.status,
            "agent_count": sim.agent_count,
            "turn_count": sim.turn_count,
            "created_at": sim.created_at,
            "completed_at": sim.completed_at,
        },
        "agents": [
            {
                "id": a.id,
                "name": a.name,
                "age": a.age,
                "occupation": a.occupation,
                "personality": a.personality,
                "stance": a.stance,
                "values": a.values,
                "emotional_state": a.emotional_state,
            }
            for a in agents
        ],
        "interactions": [
            {
                "id": i.id,
                "turn": i.turn,
                "agent_id": i.agent_id,
                "agent_name": i.agent_name,
                "action_type": i.action_type,
                "content": i.content,
                "emotional_state": i.emotional_state,
            }
            for i in interactions
        ],
    }


@app.get("/api/simulations/{sim_id}/stream")
async def stream_simulation(sim_id: int):
    """シミュレーションの発言をSSEでリアルタイムストリーミング"""
    async def event_generator():
        sent_ids = set()
        for _ in range(300):  # 最大300回（5分）ポーリング
            interactions = get_interactions(sim_id)
            for i in interactions:
                if i.id not in sent_ids:
                    sent_ids.add(i.id)
                    data = json.dumps({
                        "id": i.id,
                        "turn": i.turn,
                        "agent_name": i.agent_name,
                        "content": i.content,
                        "emotional_state": i.emotional_state,
                        "action_type": i.action_type,
                    }, ensure_ascii=False)
                    yield f"data: {data}\n\n"

            # シミュレーション完了チェック
            sim = get_simulation(sim_id)
            if sim and sim.status in ("completed", "failed"):
                yield "event: done\ndata: {}\n\n"
                break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# レポートをDBに保存するための簡易テーブル（reports）
def _init_reports_table():
    """レポートテーブルを初期化"""
    from prism.database import get_connection
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            simulation_id INTEGER UNIQUE NOT NULL,
            report_text TEXT NOT NULL,
            created_at TEXT,
            FOREIGN KEY (simulation_id) REFERENCES simulations(id)
        )
    """)
    conn.commit()
    conn.close()

_init_reports_table()


def _get_report(sim_id: int) -> Optional[str]:
    """DBからレポートを取得"""
    from prism.database import get_connection
    conn = get_connection()
    row = conn.execute("SELECT report_text FROM reports WHERE simulation_id=?", (sim_id,)).fetchone()
    conn.close()
    return row["report_text"] if row else None


def _save_report(sim_id: int, text: str):
    """レポートをDBに保存"""
    from prism.database import get_connection
    from datetime import datetime
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO reports (simulation_id, report_text, created_at) VALUES (?,?,?)",
        (sim_id, text, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()


@app.get("/api/simulations/{sim_id}/graph")
def get_simulation_graph(sim_id: int):
    """知識グラフのノードを返す"""
    nodes = get_knowledge_nodes(sim_id)
    return {"nodes": nodes}


@app.get("/api/simulations/{sim_id}/emotions")
def get_simulation_emotions(sim_id: int):
    """全エージェントの感情曲線データを返す"""
    emotions = get_emotion_trajectory(sim_id)
    return {"emotions": emotions}


@app.get("/api/simulations/{sim_id}/relationships")
def get_simulation_relationships(sim_id: int):
    """関係性履歴を返す"""
    history = get_relationship_history(sim_id)
    relations = get_relations(sim_id)
    return {"history": history, "relations": relations}


@app.get("/api/simulations/{sim_id}/relations")
def get_simulation_relations(sim_id: int):
    """エージェント間の関係性データを取得"""
    relations = get_relations(sim_id)
    return {"relations": relations}


@app.get("/api/simulations/{sim_id}/report")
def get_report(sim_id: int):
    """保存済みレポートを取得"""
    text = _get_report(sim_id)
    if not text:
        raise HTTPException(status_code=404, detail="レポートが未生成です")
    return {"report_text": text}


@app.post("/api/simulations/{sim_id}/interview")
async def interview_agent(sim_id: int, req: dict):
    """特定エージェントに質問する"""
    agent_name = req.get("agent_name")
    question = req.get("question")
    if not agent_name or not question:
        raise HTTPException(status_code=400, detail="agent_name と question が必要です")

    agents = get_agents(sim_id)
    agent = next((a for a in agents if a.name == agent_name), None)
    if not agent:
        raise HTTPException(status_code=404, detail="エージェントが見つかりません")

    interactions_all = get_interactions(sim_id)
    agent_interactions = [i for i in interactions_all if i.agent_name == agent_name]
    history = "\n".join(f"- {i.content}" for i in agent_interactions[-10:])

    from prism.llm import call_claude
    response = call_claude(
        f"あなたは{agent.name}です。職業:{agent.occupation}, 立場:{agent.stance}, 感情:{agent.emotional_state}。"
        f"これまでの発言履歴:\n{history}\nキャラクターを維持して質問に答えてください。",
        question,
        1024
    )
    return {"agent": agent_name, "response": response}


@app.post("/api/simulations/{sim_id}/survey")
async def global_survey(sim_id: int, req: dict):
    """全エージェントにアンケートを送る"""
    question = req.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="question が必要です")
    max_agents = req.get("max_agents", 10)

    agents = get_agents(sim_id)[:max_agents]
    if not agents:
        raise HTTPException(status_code=404, detail="エージェントが見つかりません")

    from prism.llm import call_claude
    results = []
    for agent in agents:
        resp = call_claude(
            f"あなたは{agent.name}（{agent.occupation}）です。立場:{agent.stance}。1〜2文で答えてください。",
            question,
            512
        )
        results.append({"agent": agent.name, "response": resp})

    return {"question": question, "results": results}


@app.post("/api/simulations/{sim_id}/report_chat")
async def report_chat(sim_id: int, req: dict):
    """レポートの内容についてAIと対話"""
    question = req.get("question", "")
    history = req.get("history", [])  # [{role, content}]

    report_content = _get_report(sim_id)
    if not report_content:
        report_content = "レポートがまだ生成されていません"

    from prism.llm import call_claude
    system = f"""あなたはシミュレーション分析の専門家です。
以下のレポートについて質問に答えてください。

【レポート】
{report_content[:2000]}

簡潔かつ具体的に答えてください。"""

    response = call_claude(system, question, 512)
    return {"response": response}


@app.post("/api/simulations/{sim_id}/report")
def create_report(sim_id: int):
    """レポートを生成してDBに保存"""
    sim = get_simulation(sim_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"シミュレーションが見つかりません (id={sim_id})")
    if sim.status != "completed":
        raise HTTPException(status_code=400, detail=f"シミュレーションが完了していません (status={sim.status})")

    text = generate_report(sim_id)
    _save_report(sim_id, text)
    return {"report_text": text}

@app.post("/api/upload")
async def upload_file(file: UploadFile):
    """テキストファイルをアップロードしてシナリオとして使用"""
    content_bytes = await file.read()
    filename = file.filename.lower() if file.filename else ""
    text = content_bytes.decode('utf-8', errors='ignore')
    text = text[:3000] if len(text) > 3000 else text
    return {"text": text, "filename": file.filename, "chars": len(text)}

@app.post("/api/simulations/{sim_id}/inject")
async def inject_variable(sim_id: int, req: dict):
    """シミュレーションに外部イベントを注入する"""
    event = req.get("event", "")
    if not event:
        return {"status": "error", "message": "イベントが空です"}
    import sqlite3 as _sq3, datetime
    db_path = os.environ.get("DB_PATH", "prism.db")
    conn = _sq3.connect(db_path)
    conn.execute(
        "INSERT INTO interactions (simulation_id, turn, agent_id, agent_name, action_type, content, emotional_state, created_at) VALUES (?,?,?,?,?,?,?,?)",
        (sim_id, 0, -1, "システム", "環境変化", event, "中立", datetime.datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return {"status": "injected", "event": event}

@app.get("/api/version")
async def version():
    """デプロイバージョン確認用"""
    return {"version": "v2.1-batch-fix", "max_active": 15, "memory": False, "graph": False}
