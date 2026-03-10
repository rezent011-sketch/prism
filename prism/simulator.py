"""エージェント間対話シミュレーションループ"""
from typing import List
from .models import Agent, Interaction
from .llm import call_claude
from .database import save_interaction, get_interactions, update_agent_emotion


def run_simulation(seed_text: str, agents: List[Agent], simulation_id: int, turns: int = 10) -> List[Interaction]:
    """シミュレーションを実行: 各ターンで全エージェントが反応する"""
    turns = max(1, min(20, turns))
    all_interactions = []

    print(f"\n🔄 シミュレーション開始 ({turns}ターン, {len(agents)}人)")

    for turn in range(1, turns + 1):
        print(f"\n--- ターン {turn}/{turns} ---")

        # これまでの直近の発言を収集（コンテキスト用、最大20件）
        recent = all_interactions[-20:] if all_interactions else []
        context = _build_context(seed_text, recent)

        for agent in agents:
            # エージェントの反応を生成
            interaction = _generate_reaction(agent, context, turn, simulation_id)
            all_interactions.append(interaction)

            # 感情状態を更新
            update_agent_emotion(agent.id, interaction.emotional_state)
            agent.emotional_state = interaction.emotional_state

            # コンテキストに追加
            context += f"\n[{agent.name}]: {interaction.content}"

            print(f"  💬 {agent.name}: {interaction.content[:60]}...")

    print(f"\n✅ シミュレーション完了 ({len(all_interactions)}件の相互作用)")
    return all_interactions


def _build_context(seed_text: str, recent_interactions: List[Interaction]) -> str:
    """シミュレーションのコンテキスト文を構築"""
    context = f"【状況】\n{seed_text}\n\n【これまでの発言・行動】\n"
    for i in recent_interactions:
        context += f"[ターン{i.turn}] {i.agent_name} ({i.action_type}): {i.content}\n"
    return context


def _generate_reaction(agent: Agent, context: str, turn: int, simulation_id: int) -> Interaction:
    """エージェントの反応をClaude APIで生成"""
    system_prompt = f"""あなたは社会シミュレーション内のキャラクターです。以下の人物として振る舞ってください。

名前: {agent.name}
年齢: {agent.age}歳
職業: {agent.occupation}
性格: {agent.personality}
立場: {agent.stance}
価値観: {agent.values}
現在の感情: {agent.emotional_state}

必ず以下のJSON形式で回答してください:
{{"action_type": "発言", "content": "あなたの発言や行動の内容", "emotional_state": "現在の感情状態"}}

action_typeは「発言」「行動」「感情変化」のいずれか。
contentは2〜4文で、この人物らしい反応を書いてください。
JSON以外のテキストは含めないでください。"""

    user_message = f"ターン{turn}の状況:\n{context}\n\nあなた（{agent.name}）の反応をJSON形式で返してください。"

    response = call_claude(system_prompt, user_message, max_tokens=512)

    # JSONパース
    import json
    text = response.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # パース失敗時はそのままテキストとして保存
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
