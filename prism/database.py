"""SQLiteデータベース接続・CRUD操作"""
import sqlite3
from typing import List, Optional
from .config import DB_PATH
from .models import Agent, Simulation, Interaction


def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """データベース接続を取得"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH):
    """テーブルを初期化"""
    conn = get_connection(db_path)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS simulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seed_text TEXT NOT NULL,
            agent_count INTEGER DEFAULT 15,
            turn_count INTEGER DEFAULT 10,
            status TEXT DEFAULT 'created',
            created_at TEXT,
            completed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            simulation_id INTEGER NOT NULL,
            name TEXT,
            age INTEGER,
            occupation TEXT,
            personality TEXT,
            stance TEXT,
            values_text TEXT,
            emotional_state TEXT,
            created_at TEXT,
            FOREIGN KEY (simulation_id) REFERENCES simulations(id)
        );
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            simulation_id INTEGER NOT NULL,
            turn INTEGER,
            agent_id INTEGER,
            agent_name TEXT,
            action_type TEXT,
            content TEXT,
            emotional_state TEXT,
            created_at TEXT,
            FOREIGN KEY (simulation_id) REFERENCES simulations(id),
            FOREIGN KEY (agent_id) REFERENCES agents(id)
        );
    """)
    conn.commit()
    conn.close()


def create_simulation(sim: Simulation, db_path: str = DB_PATH) -> int:
    """シミュレーションを作成し、IDを返す"""
    conn = get_connection(db_path)
    cur = conn.execute(
        "INSERT INTO simulations (seed_text, agent_count, turn_count, status, created_at) VALUES (?,?,?,?,?)",
        (sim.seed_text, sim.agent_count, sim.turn_count, sim.status, sim.created_at)
    )
    sim_id = cur.lastrowid
    conn.commit()
    conn.close()
    return sim_id


def update_simulation_status(sim_id: int, status: str, db_path: str = DB_PATH):
    """シミュレーションのステータスを更新"""
    from datetime import datetime
    conn = get_connection(db_path)
    completed = datetime.now().isoformat() if status in ("completed", "failed") else None
    conn.execute(
        "UPDATE simulations SET status=?, completed_at=? WHERE id=?",
        (status, completed, sim_id)
    )
    conn.commit()
    conn.close()


def save_agent(agent: Agent, db_path: str = DB_PATH) -> int:
    """エージェントを保存"""
    conn = get_connection(db_path)
    cur = conn.execute(
        "INSERT INTO agents (simulation_id, name, age, occupation, personality, stance, values_text, emotional_state, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        (agent.simulation_id, agent.name, agent.age, agent.occupation,
         agent.personality, agent.stance, agent.values, agent.emotional_state, agent.created_at)
    )
    agent_id = cur.lastrowid
    conn.commit()
    conn.close()
    return agent_id


def save_interaction(interaction: Interaction, db_path: str = DB_PATH) -> int:
    """相互作用を保存"""
    conn = get_connection(db_path)
    cur = conn.execute(
        "INSERT INTO interactions (simulation_id, turn, agent_id, agent_name, action_type, content, emotional_state, created_at) VALUES (?,?,?,?,?,?,?,?)",
        (interaction.simulation_id, interaction.turn, interaction.agent_id,
         interaction.agent_name, interaction.action_type, interaction.content,
         interaction.emotional_state, interaction.created_at)
    )
    iid = cur.lastrowid
    conn.commit()
    conn.close()
    return iid


def get_agents(sim_id: int, db_path: str = DB_PATH) -> List[Agent]:
    """シミュレーションのエージェント一覧を取得"""
    conn = get_connection(db_path)
    rows = conn.execute("SELECT * FROM agents WHERE simulation_id=?", (sim_id,)).fetchall()
    conn.close()
    agents = []
    for r in rows:
        agents.append(Agent(
            id=r["id"], simulation_id=r["simulation_id"], name=r["name"],
            age=r["age"], occupation=r["occupation"], personality=r["personality"],
            stance=r["stance"], values=r["values_text"], emotional_state=r["emotional_state"],
            created_at=r["created_at"]
        ))
    return agents


def get_interactions(sim_id: int, db_path: str = DB_PATH) -> List[Interaction]:
    """シミュレーションの全相互作用を取得"""
    conn = get_connection(db_path)
    rows = conn.execute(
        "SELECT * FROM interactions WHERE simulation_id=? ORDER BY turn, id", (sim_id,)
    ).fetchall()
    conn.close()
    return [Interaction(
        id=r["id"], simulation_id=r["simulation_id"], turn=r["turn"],
        agent_id=r["agent_id"], agent_name=r["agent_name"],
        action_type=r["action_type"], content=r["content"],
        emotional_state=r["emotional_state"], created_at=r["created_at"]
    ) for r in rows]


def list_simulations(db_path: str = DB_PATH) -> List[Simulation]:
    """全シミュレーション一覧を取得"""
    conn = get_connection(db_path)
    rows = conn.execute("SELECT * FROM simulations ORDER BY id DESC").fetchall()
    conn.close()
    return [Simulation(
        id=r["id"], seed_text=r["seed_text"], agent_count=r["agent_count"],
        turn_count=r["turn_count"], status=r["status"],
        created_at=r["created_at"], completed_at=r["completed_at"]
    ) for r in rows]


def update_agent_emotion(agent_id: int, emotional_state: str, db_path: str = DB_PATH):
    """エージェントの感情状態を更新"""
    conn = get_connection(db_path)
    conn.execute("UPDATE agents SET emotional_state=? WHERE id=?", (emotional_state, agent_id))
    conn.commit()
    conn.close()
