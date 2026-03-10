"""Prism Web API - FastAPIサーバー"""
import sys
import os

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from prism.database import (
    init_db, create_simulation, update_simulation_status,
    list_simulations, get_agents, get_interactions
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
def _run_simulation_bg(sim_id: int, seed_text: str, agent_count: int, turn_count: int):
    """バックグラウンドタスク: シミュレーション実行"""
    try:
        update_simulation_status(sim_id, "running")
        agents = generate_agents(seed_text, sim_id, agent_count)
        run_simulation(seed_text, agents, sim_id, turn_count)
        update_simulation_status(sim_id, "completed")
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"❌ シミュレーション #{sim_id} 失敗: {e}\n{err}")
        update_simulation_status(sim_id, "failed")


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
def simulate(req: SimulateRequest, background_tasks: BackgroundTasks):
    """シミュレーションを開始（バックグラウンド実行）"""
    sim = Simulation(
        seed_text=req.seed,
        agent_count=max(10, min(20, req.agent_count)),
        turn_count=max(3, min(20, req.turn_count)),
        status="created",
    )
    sim_id = create_simulation(sim)
    background_tasks.add_task(_run_simulation_bg, sim_id, req.seed, sim.agent_count, sim.turn_count)
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


@app.get("/api/simulations/{sim_id}/report")
def get_report(sim_id: int):
    """保存済みレポートを取得"""
    text = _get_report(sim_id)
    if not text:
        raise HTTPException(status_code=404, detail="レポートが未生成です")
    return {"report_text": text}


@app.post("/api/simulations/{sim_id}/report")
def create_report(sim_id: int):
    """レポートを生成してDBに保存"""
    sims = list_simulations()
    sim = next((s for s in sims if s.id == sim_id), None)
    if not sim:
        raise HTTPException(status_code=404, detail="シミュレーションが見つかりません")
    if sim.status != "completed":
        raise HTTPException(status_code=400, detail="シミュレーションが完了していません")

    text = generate_report(sim_id)
    _save_report(sim_id, text)
    return {"report_text": text}
