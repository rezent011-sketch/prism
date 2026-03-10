"""
Zep Cloud相当の長期記憶エンジン
- AgentMemory: エピソード記憶 + 感情曲線 + 関係性グラフ
- MemoryStore: 記憶の保存・取得・重要度スコアリング
"""
import re
from typing import Dict, List, Optional


class AgentMemory:
    """エージェント固有の長期記憶"""

    def __init__(self, agent_id: int, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.episodic_memories: List[dict] = []
        # [{turn, content, emotional_impact, importance_score}]
        self.emotion_trajectory: List[dict] = []
        # [{turn, emotion, intensity}]
        self.relationship_graph: Dict[str, dict] = {}
        # {agent_name: {trust, sentiment_history: List[str], interaction_count}}

    def add_memory(self, turn: int, content: str, emotion: str = "", impact: float = 0.5):
        """記憶追加。重要度スコアを自動計算"""
        importance = self._calc_importance(content, impact)
        self.episodic_memories.append({
            "turn": turn,
            "content": content,
            "emotional_impact": impact,
            "importance_score": importance,
        })

    def _calc_importance(self, content: str, impact: float) -> float:
        """重要度スコア（0-1）を計算"""
        score = impact * 0.6
        # 長い発言は重要度が高い傾向
        length_factor = min(len(content) / 200, 1.0) * 0.2
        # 感情的なキーワード
        emotional_words = ["怒", "悲", "喜", "驚", "恐", "嫌", "愛", "憎", "感動", "衝撃",
                           "反対", "賛成", "同意", "反論", "批判", "支持", "対立", "共感"]
        keyword_factor = min(sum(1 for w in emotional_words if w in content) / 3, 1.0) * 0.2
        return min(1.0, score + length_factor + keyword_factor)

    def get_relevant_memories(self, context: str, limit: int = 5) -> List[dict]:
        """コンテキストに関連する記憶を返す（キーワードマッチ + 重要度）"""
        if not self.episodic_memories:
            return []

        context_words = set(re.findall(r'\w{2,}', context))
        scored = []
        for mem in self.episodic_memories:
            mem_words = set(re.findall(r'\w{2,}', mem["content"]))
            overlap = len(context_words & mem_words)
            relevance = overlap * 0.3 + mem["importance_score"] * 0.7
            scored.append((relevance, mem))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in scored[:limit]]

    def update_relation(self, other_name: str, sentiment_delta: float, reason: str = ""):
        """関係性更新"""
        if other_name not in self.relationship_graph:
            self.relationship_graph[other_name] = {
                "trust": 0.0,
                "sentiment_history": [],
                "interaction_count": 0,
            }
        rel = self.relationship_graph[other_name]
        rel["trust"] = max(-1.0, min(1.0, rel["trust"] + sentiment_delta))
        rel["interaction_count"] += 1
        if reason:
            rel["sentiment_history"].append(reason)
            # 直近10件のみ保持
            rel["sentiment_history"] = rel["sentiment_history"][-10:]

    def add_emotion(self, turn: int, emotion: str, intensity: float = 0.5):
        """感情曲線に追加"""
        self.emotion_trajectory.append({
            "turn": turn,
            "emotion": emotion,
            "intensity": max(0.0, min(1.0, intensity)),
        })

    def get_memory_summary(self) -> str:
        """直近の重要記憶をサマリーとして返す"""
        if not self.episodic_memories:
            return ""

        # 重要度でソートして上位5件
        sorted_mems = sorted(self.episodic_memories, key=lambda m: m["importance_score"], reverse=True)[:5]
        lines = [f"- ターン{m['turn']}: {m['content'][:80]}" for m in sorted_mems]

        result = "【長期記憶サマリー】（過去の重要な出来事）\n" + "\n".join(lines)

        # 関係性
        if self.relationship_graph:
            rel_lines = []
            for name, rel in self.relationship_graph.items():
                trust_label = "高" if rel["trust"] > 0.3 else ("低" if rel["trust"] < -0.3 else "中立")
                rel_lines.append(f"- {name}: 信頼度{rel['trust']:+.2f}（{trust_label}）")
            result += "\n\n【関係性グラフ】（主要な関係者との信頼度・感情）\n" + "\n".join(rel_lines[:5])

        return result


class MemoryStore:
    """シミュレーション全体のメモリ管理"""

    def __init__(self):
        self.memories: Dict[int, AgentMemory] = {}

    def get_or_create(self, agent_id: int, agent_name: str) -> AgentMemory:
        if agent_id not in self.memories:
            self.memories[agent_id] = AgentMemory(agent_id, agent_name)
        return self.memories[agent_id]

    def save_to_db(self, db_conn, sim_id: int):
        """SQLite永続化"""
        for agent_id, mem in self.memories.items():
            # 感情曲線
            for et in mem.emotion_trajectory:
                db_conn.execute(
                    "INSERT INTO emotion_trajectory (agent_id, simulation_id, turn, emotion, intensity) VALUES (?,?,?,?,?)",
                    (agent_id, sim_id, et["turn"], et["emotion"], et["intensity"])
                )
            # 関係性
            for target_name, rel in mem.relationship_graph.items():
                for i, sentiment in enumerate(rel["sentiment_history"]):
                    db_conn.execute(
                        "INSERT INTO relationship_history (simulation_id, agent_id, target_name, turn, trust_delta, sentiment, reason) VALUES (?,?,?,?,?,?,?)",
                        (sim_id, agent_id, target_name, i, rel["trust"], sentiment, "")
                    )
        db_conn.commit()

    def load_from_db(self, db_conn, sim_id: int):
        """DBから読み込み（将来用）"""
        rows = db_conn.execute(
            "SELECT * FROM emotion_trajectory WHERE simulation_id=? ORDER BY turn", (sim_id,)
        ).fetchall()
        for r in rows:
            agent_id = r["agent_id"]
            if agent_id not in self.memories:
                self.memories[agent_id] = AgentMemory(agent_id, f"agent_{agent_id}")
            self.memories[agent_id].emotion_trajectory.append({
                "turn": r["turn"], "emotion": r["emotion"], "intensity": r["intensity"]
            })
