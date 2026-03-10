"""データモデル定義 - Agent, Simulation, Interaction"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Agent:
    """シミュレーション内のエージェント"""
    id: Optional[int] = None
    simulation_id: Optional[int] = None
    name: str = ""
    age: int = 30
    occupation: str = ""        # 職業
    personality: str = ""       # 性格
    stance: str = ""            # 立場
    values: str = ""            # 価値観
    emotional_state: str = ""   # 感情状態
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class Simulation:
    """シミュレーションセッション"""
    id: Optional[int] = None
    seed_text: str = ""
    agent_count: int = 15
    turn_count: int = 10
    status: str = "created"  # created, running, completed, failed
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None


@dataclass
class Interaction:
    """エージェント間の相互作用記録"""
    id: Optional[int] = None
    simulation_id: Optional[int] = None
    turn: int = 0
    agent_id: Optional[int] = None
    agent_name: str = ""
    action_type: str = ""   # 発言, 行動, 感情変化
    content: str = ""
    emotional_state: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
