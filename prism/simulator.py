"""エージェント間対話シミュレーションループ（v0.2: 長期記憶 + GraphRAG対応）"""
import json
from typing import List, Optional
from .models import Agent, Interaction
from .llm import call_claude
from .database import (
    save_interaction, get_interactions, update_agent_emotion,
    save_agent_memory, get_agent_memories, update_relation, get_agent_relations,
    get_connection
)
from .memory_engine import MemoryStore
from .graph_rag import KnowledgeGraph


def run_simulation(seed_text: str, agents: List[Agent], simulation_id: int, turns: int = 10,
                   enable_memory: bool = True, enable_graph: bool = True) -> List[Interaction]:
    """シミュレーションを実行: 各ターンで全エージェントが反応する
    
    enable_memory / enable_graph を False にすると従来動作（後方互換）
    """
    turns = max(1, min(20, turns))
    all_interactions = []

    # v0.2: メモリストアとナレッジグラフを初期化
    memory_store = MemoryStore() if enable_memory else None
    knowledge_graph = None

    if enable_graph:
        print("  📊 GraphRAG: シードからナレッジグラフを構築中...")
        knowledge_graph = KnowledgeGraph()
        try:
            knowledge_graph.build_from_seed(seed_text)
            print(f"  📊 GraphRAG: {len(knowledge_graph.nodes)}ノード, {len(knowledge_graph.edges)}エッジ構築完了")
        except Exception as e:
            print(f"  ⚠️ GraphRAG構築失敗（続行します）: {e}")
            knowledge_graph = None

    print(f"\n🔄 シミュレーション開始 ({turns}ターン, {len(agents)}人)")

    for turn in range(1, turns + 1):
        print(f"\n--- ターン {turn}/{turns} ---")

        # これまでの直近の発言を収集（コンテキスト用、最大20件）
        recent = all_interactions[-20:] if all_interactions else []
        context = _build_context(seed_text, recent)

        for agent in agents:
            # v0.2: メモリサマリーとGraphRAGコンテキストを取得
            memory_summary = ""
            graph_context = ""

            if memory_store:
                mem = memory_store.get_or_create(agent.id, agent.name)
                memory_summary = mem.get_memory_summary()

            if knowledge_graph:
                graph_context = knowledge_graph.get_relevant_context(context[-500:])

            # エージェントの反応を生成
            interaction = _generate_reaction(
                agent, context, turn, simulation_id,
                memory_summary=memory_summary,
                graph_context=graph_context,
            )
            all_interactions.append(interaction)

            # 感情状態を更新
            update_agent_emotion(agent.id, interaction.emotional_state)
            agent.emotional_state = interaction.emotional_state

            # v0.2: メモリと感情曲線を更新
            if memory_store:
                mem = memory_store.get_or_create(agent.id, agent.name)
                mem.add_memory(turn, interaction.content, interaction.emotional_state, 0.5)
                mem.add_emotion(turn, interaction.emotional_state, 0.5)

            # v0.2: GraphRAGにインタラクションを追加
            if knowledge_graph:
                knowledge_graph.add_interaction_node(agent.name, interaction.content, turn)

            # 関係性分析と記憶の記録
            _analyze_and_record(agent, interaction, agents, simulation_id, turn, memory_store)

            # コンテキストに追加
            context += f"\n[{agent.name}]: {interaction.content}"

            print(f"  💬 {agent.name}: {interaction.content[:60]}...")

    # v0.2: メモリとグラフをDBに永続化
    if memory_store or knowledge_graph:
        try:
            conn = get_connection()
            if memory_store:
                memory_store.save_to_db(conn, simulation_id)
            if knowledge_graph:
                knowledge_graph.save_to_db(conn, simulation_id)
            conn.close()
            print("  💾 メモリ・グラフをDBに保存完了")
        except Exception as e:
            print(f"  ⚠️ DB保存エラー: {e}")

    print(f"\n✅ シミュレーション完了 ({len(all_interactions)}件の相互作用)")
    return all_interactions


def _build_context(seed_text: str, recent_interactions: List[Interaction]) -> str:
    """シミュレーションのコンテキスト文を構築"""
    context = f"【状況】\n{seed_text}\n\n【これまでの発言・行動】\n"
    for i in recent_interactions:
        context += f"[ターン{i.turn}] {i.agent_name} ({i.action_type}): {i.content}\n"
    return context


def _generate_reaction(agent: Agent, context: str, turn: int, simulation_id: int,
                       memory_summary: str = "", graph_context: str = "") -> Interaction:
    """エージェントの反応をClaude APIで生成"""
    # 既存の記憶・関係性取得（後方互換）
    memories = get_agent_memories(agent.id, limit=3)
    relations = get_agent_relations(agent.id, simulation_id)

    memory_section = ""
    if memories:
        memory_lines = [f"- ターン{m['turn']}: {m['memory_text']}" for m in memories]
        memory_section = f"\n\n【過去の記憶】\n" + "\n".join(memory_lines)

    relation_section = ""
    if relations:
        top = relations[:2]
        bottom = relations[-2:] if len(relations) > 2 else []
        lines = []
        for r in top:
            lines.append(f"- {r['name']}: 信頼度 {r['trust_score']:+.2f}")
        for r in bottom:
            if r not in top:
                lines.append(f"- {r['name']}: 信頼度 {r['trust_score']:+.2f}")
        if lines:
            relation_section = f"\n\n【主要な関係性】\n" + "\n".join(lines)

    # v0.2: 長期記憶サマリーとGraphRAGコンテキストを追加
    v2_section = ""
    if memory_summary:
        v2_section += f"\n\n{memory_summary}"
    if graph_context:
        v2_section += f"\n\n{graph_context}"

    system_prompt = f"""あなたは社会シミュレーション内のキャラクターです。以下の人物として振る舞ってください。

名前: {agent.name}
年齢: {agent.age}歳
職業: {agent.occupation}
性格: {agent.personality}
立場: {agent.stance}
価値観: {agent.values}
現在の感情: {agent.emotional_state}{memory_section}{relation_section}{v2_section}

必ず以下のJSON形式で回答してください:
{{"action_type": "発言", "content": "あなたの発言や行動の内容", "emotional_state": "現在の感情状態"}}

action_typeは「発言」「行動」「感情変化」のいずれか。
contentは2〜4文で、この人物らしい反応を書いてください。
JSON以外のテキストは含めないでください。"""

    user_message = f"ターン{turn}の状況:\n{context}\n\nあなた（{agent.name}）の反応をJSON形式で返してください。"

    response = call_claude(system_prompt, user_message, max_tokens=512)

    # JSONパース
    text = response.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {"action_type": "発言", "content": text[:300], "emotional_state": agent.emotional_state}

    interaction = Interaction(
        simulation_id=simulation_id,
        turn=turn,
        agent_id=agent.id,
        agent_name=agent.name,
        action_type=data.get("action_type", "発言"),
        content=data.get("content", ""),
        emotional_state=data.get("emotional_state", agent.emotional_state),
    )
    interaction.id = save_interaction(interaction)
    return interaction


def _analyze_and_record(agent: Agent, interaction: Interaction, all_agents: List[Agent],
                        sim_id: int, turn: int, memory_store: Optional[MemoryStore] = None):
    """発言を分析し、関係性と記憶を更新"""
    other_names = [a.name for a in all_agents if a.id != agent.id]
    if not other_names:
        return

    names_list = ", ".join(other_names)
    prompt = f"""発言者: {agent.name}
発言: {interaction.content}
他の参加者: {names_list}

この発言で誰に賛同/反論しているか、JSON配列で返せ。該当なしなら空配列。
形式: [{{"target":"名前","type":"agree"}}] か [{{"target":"名前","type":"disagree"}}]
JSON配列のみ返せ。"""

    try:
        result = call_claude("短く分析せよ。JSON配列のみ返せ。", prompt, max_tokens=100)
        text = result.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            text = text.strip()
        analyses = json.loads(text)
    except (json.JSONDecodeError, Exception):
        return

    if not isinstance(analyses, list):
        return

    agent_map = {a.name: a for a in all_agents}
    for item in analyses:
        target_name = item.get("target", "")
        rel_type = item.get("type", "")
        target_agent = agent_map.get(target_name)
        if not target_agent:
            continue

        if rel_type == "agree":
            delta = 0.1
            memory = f"{target_name}に賛同し、好意的な関係を築いた"
        elif rel_type == "disagree":
            delta = -0.15
            memory = f"{target_name}と意見が対立し、緊張を感じた"
        else:
            continue

        # 関係性更新（双方向: 発言者→対象）
        update_relation(sim_id, agent.id, target_agent.id, delta)
        # 対象側の記憶も記録
        save_agent_memory(target_agent.id, sim_id, turn,
                          f"ターン{turn}で{agent.name}から{'反論' if rel_type == 'disagree' else '賛同'}を受けた")
        # 発言者の記憶
        save_agent_memory(agent.id, sim_id, turn, f"ターン{turn}: {memory}")

        # v0.2: MemoryStoreの関係性も更新
        if memory_store:
            mem = memory_store.get_or_create(agent.id, agent.name)
            mem.update_relation(target_name, delta, f"ターン{turn}: {memory}")
            # 対象側も更新
            target_mem = memory_store.get_or_create(target_agent.id, target_agent.name)
            reason = f"ターン{turn}で{agent.name}から{'反論' if rel_type == 'disagree' else '賛同'}を受けた"
            target_mem.update_relation(agent.name, delta * 0.5, reason)
