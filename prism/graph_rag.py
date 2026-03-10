"""
GraphRAG: シミュレーションシード・会話から知識グラフを構築し、
エージェントが返答時に関連知識ノードを参照できるようにする
"""
import json
import re
from typing import Dict, List, Optional


class KnowledgeNode:
    """知識グラフのノード"""
    def __init__(self, node_id: int, label: str, content: str, node_type: str = "entity"):
        self.id = node_id
        self.label = label
        self.content = content
        self.node_type = node_type  # entity / concept / event


class KnowledgeEdge:
    """知識グラフのエッジ"""
    def __init__(self, source_id: int, target_id: int, relation_type: str, weight: float = 1.0):
        self.source_id = source_id
        self.target_id = target_id
        self.relation_type = relation_type
        self.weight = weight


class KnowledgeGraph:
    """シンプルな知識グラフ（外部ライブラリ不要）"""

    def __init__(self):
        self.nodes: Dict[int, KnowledgeNode] = {}
        self.edges: List[KnowledgeEdge] = []
        self._next_id = 1

    def _add_node(self, label: str, content: str, node_type: str = "entity") -> int:
        node_id = self._next_id
        self._next_id += 1
        self.nodes[node_id] = KnowledgeNode(node_id, label, content, node_type)
        return node_id

    def _add_edge(self, source_id: int, target_id: int, relation_type: str, weight: float = 1.0):
        if source_id in self.nodes and target_id in self.nodes:
            self.edges.append(KnowledgeEdge(source_id, target_id, relation_type, weight))

    def build_from_seed(self, seed_text: str):
        """シードテキストからClaude APIで重要エンティティを抽出してグラフ構築"""
        from .llm import call_claude

        prompt = f"""以下のテキストから重要なエンティティ（人物・組織・概念・場所）と関係性を抽出してください。

テキスト:
{seed_text}

以下のJSON形式で返してください:
{{"nodes": [{{"label": "名前", "content": "説明", "type": "entity"}}], "edges": [{{"from": "名前1", "to": "名前2", "relation": "関係"}}]}}

JSON以外のテキストは含めないでください。"""

        try:
            result = call_claude("知識グラフ構築用。JSON形式のみ返せ。", prompt, max_tokens=1024)
            text = result.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
                text = text.strip()

            data = json.loads(text)
            label_to_id = {}

            for node in data.get("nodes", []):
                nid = self._add_node(
                    node.get("label", "unknown"),
                    node.get("content", ""),
                    node.get("type", "entity"),
                )
                label_to_id[node.get("label", "")] = nid

            for edge in data.get("edges", []):
                src = label_to_id.get(edge.get("from", ""))
                tgt = label_to_id.get(edge.get("to", ""))
                if src and tgt:
                    self._add_edge(src, tgt, edge.get("relation", "関連"))

        except Exception as e:
            print(f"  ⚠️ GraphRAG構築エラー（続行します）: {e}")
            # シードテキスト自体をノードとして追加
            self._add_node("シード", seed_text[:200], "concept")

    def add_interaction_node(self, agent_name: str, content: str, turn: int):
        """ターンごとの発言をノードとして追加"""
        label = f"{agent_name}_t{turn}"
        node_id = self._add_node(label, content[:200], "event")

        # 既存ノードとキーワードで自動リンク
        content_words = set(re.findall(r'\w{2,}', content))
        for nid, node in self.nodes.items():
            if nid == node_id:
                continue
            node_words = set(re.findall(r'\w{2,}', node.content))
            overlap = len(content_words & node_words)
            if overlap >= 2:
                self._add_edge(node_id, nid, "関連", min(overlap / 5, 1.0))

    def get_relevant_context(self, query: str, limit: int = 3) -> str:
        """クエリに関連するノードと周辺知識を返す"""
        if not self.nodes:
            return ""

        query_words = set(re.findall(r'\w{2,}', query))
        scored = []
        for nid, node in self.nodes.items():
            node_words = set(re.findall(r'\w{2,}', node.content + " " + node.label))
            overlap = len(query_words & node_words)
            scored.append((overlap, node))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = [n for _, n in scored[:limit] if _ > 0]

        if not top:
            # フォールバック: 最新のノードを返す
            top = list(self.nodes.values())[-limit:]

        lines = [f"- [{n.node_type}] {n.label}: {n.content[:100]}" for n in top]
        return "【関連知識】（GraphRAGで取得した関連情報）\n" + "\n".join(lines) if lines else ""

    def save_to_db(self, db_conn, sim_id: int):
        """知識グラフをDBに保存"""
        for nid, node in self.nodes.items():
            db_conn.execute(
                "INSERT INTO knowledge_nodes (simulation_id, label, content, node_type) VALUES (?,?,?,?)",
                (sim_id, node.label, node.content, node.node_type)
            )
        db_conn.commit()

    def to_dict(self) -> dict:
        """API用にdict化"""
        return {
            "nodes": [
                {"id": n.id, "label": n.label, "content": n.content, "type": n.node_type}
                for n in self.nodes.values()
            ],
            "edges": [
                {"source": e.source_id, "target": e.target_id, "relation": e.relation_type, "weight": e.weight}
                for e in self.edges
            ],
        }
