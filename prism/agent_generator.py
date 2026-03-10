"""シード情報からエージェント群を自動生成するモジュール"""
import json
from typing import List
from .models import Agent
from .llm import call_claude
from .database import save_agent


def generate_agents(seed_text: str, simulation_id: int, count: int = 15) -> List[Agent]:
    """シード情報を基にClaude APIでエージェントを生成し、DBに保存する"""
    # エージェント数を10〜20の範囲に制限
    count = max(10, min(20, count))

    system_prompt = """あなたは社会シミュレーションのためのエージェント生成AIです。
与えられたシナリオに対して、多様な視点を持つエージェント（人物）を生成してください。
必ず指定された人数分のエージェントをJSON配列で返してください。

各エージェントは以下のフィールドを持ちます:
- name: 日本語のフルネーム
- age: 年齢（18〜75）
- occupation: 職業
- personality: 性格（2〜3文で記述）
- stance: このシナリオに対する立場
- values: 価値観（何を大切にするか）
- emotional_state: 初期の感情状態

多様性を確保してください: 年齢層、職業、立場（賛成/反対/中立）、性別などを幅広く。
JSON配列のみを返してください。他のテキストは不要です。"""

    user_message = f"""以下のシナリオに対して、{count}人のエージェントを生成してください。

シナリオ:
{seed_text}

{count}人分のJSON配列を返してください。"""

    print(f"  🧬 {count}人のエージェントを生成中...")
    response = call_claude(system_prompt, user_message, max_tokens=4096)

    # JSONパース（コードブロックで囲まれている場合に対応）
    text = response.strip()
    if text.startswith("```"):
        # ```json ... ``` を除去
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        text = text.strip()

    try:
        agents_data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"エージェント生成のJSON解析に失敗: {e}\nレスポンス: {text[:500]}")

    agents = []
    for data in agents_data:
        agent = Agent(
            simulation_id=simulation_id,
            name=data.get("name", "不明"),
            age=data.get("age", 30),
            occupation=data.get("occupation", "不明"),
            personality=data.get("personality", ""),
            stance=data.get("stance", ""),
            values=data.get("values", ""),
            emotional_state=data.get("emotional_state", "中立"),
        )
        agent.id = save_agent(agent)
        agents.append(agent)
        print(f"    👤 {agent.name} ({agent.age}歳, {agent.occupation})")

    print(f"  ✅ {len(agents)}人のエージェント生成完了")
    return agents
