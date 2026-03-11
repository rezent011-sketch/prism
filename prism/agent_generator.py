"""シード情報からエージェント群を自動生成するモジュール（大規模対応版）"""
import json
import random
from typing import List
from .models import Agent
from .llm import call_claude
from .database import save_agent

# 職業リスト（多様性確保）
OCCUPATIONS = [
    "会社員", "自営業者", "学生", "教師", "医師", "看護師", "エンジニア", "デザイナー",
    "主婦", "農家", "公務員", "弁護士", "記者", "芸術家", "研究者", "販売員",
    "建設作業員", "運転手", "シェフ", "経営者", "フリーランサー", "retired"
]
STANCES = ["強く賛成", "賛成", "中立", "反対", "強く反対"]
EMOTIONS = ["楽観的", "不安", "怒り", "期待", "悲しみ", "驚き", "満足", "緊張"]

BATCH_SIZE = 20  # 1回のAPIコールで生成するエージェント数


def generate_agents(seed_text: str, simulation_id: int, count: int = 15) -> List[Agent]:
    """大規模エージェント生成：最初の20体はAPIで詳細生成、残りはテンプレートから自動展開"""
    count = max(5, min(1000, count))

    # フェーズ1: 最初のBATCH_SIZEまたはcount（少ない方）体を詳細生成
    detail_count = min(count, BATCH_SIZE)
    print(f"  Phase1: {detail_count}体の詳細エージェントをAPI生成中...")

    system_prompt = """あなたは社会シミュレーション用エージェント生成AIです。
指定数のエージェントをJSONで生成してください。
各エージェント: name(日本語フルネーム), age(18-75), occupation(職業), personality(性格2文),
stance(シナリオへの立場), values(価値観), emotional_state(初期感情)
多様性を確保: 年齢・職業・立場・性別を幅広く。JSON配列のみ返す。"""

    user_msg = f"シナリオ:\n{seed_text}\n\n{detail_count}人分のJSON配列を返してください。"

    response = call_claude(system_prompt, user_msg, max_tokens=8000)

    text = response.strip()
    if "```" in text:
        parts = text.split("```")
        for p in parts:
            if "[" in p and "]" in p:
                text = p.strip()
                if text.startswith("json"):
                    text = text[4:].strip()
                break

    try:
        agents_data = json.loads(text)
    except json.JSONDecodeError:
        # JSONがパースできない場合は最小限のエージェントで続行
        print("  警告: JSON解析失敗、デフォルトエージェントで続行")
        agents_data = _create_fallback_agents(detail_count, seed_text)

    saved_agents = []
    for data in agents_data[:detail_count]:
        agent = _save_agent_from_data(data, simulation_id)
        if agent:
            saved_agents.append(agent)

    # フェーズ2: count > BATCH_SIZE なら残りをテンプレートから自動展開
    if count > BATCH_SIZE:
        remaining = count - len(saved_agents)
        print(f"  Phase2: {remaining}体をテンプレートから自動展開中...")

        first_names_male = ["田中", "鈴木", "佐藤", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤"]
        first_names_female = ["さくら", "みさき", "はなこ", "ゆうこ", "あきこ", "けいこ", "まりこ", "るみ", "かおり", "ようこ"]
        last_names = ["一郎", "二郎", "三郎", "健", "明", "誠", "亮", "翔", "勇", "哲"]

        for i in range(remaining):
            is_female = (i % 3 == 0)
            if is_female:
                name = f"{random.choice(first_names_male)}{random.choice(first_names_female)}"
            else:
                name = f"{random.choice(first_names_male)}{random.choice(last_names)}"
            name = f"{name}_{i+BATCH_SIZE+1}"  # 重複防止

            template = saved_agents[i % len(saved_agents)] if saved_agents else None
            age = random.randint(18, 75)
            occ = random.choice(OCCUPATIONS)
            stance = random.choice(STANCES)
            emotion = random.choice(EMOTIONS)

            agent_data = {
                "name": name,
                "age": age,
                "occupation": occ,
                "personality": template.personality if template else "合理的で現実的な判断を好む。",
                "stance": stance,
                "values": template.values if template else "公正さと効率を重視する。",
                "emotional_state": emotion,
            }
            agent = _save_agent_from_data(agent_data, simulation_id)
            if agent:
                saved_agents.append(agent)

        print(f"  合計 {len(saved_agents)}体 生成完了")

    return saved_agents


def _save_agent_from_data(data: dict, simulation_id: int) -> Agent:
    """dataからAgentオブジェクトを作成してDBに保存"""
    def to_str(v):
        if isinstance(v, list):
            return "、".join(str(x) for x in v)
        return str(v) if v else ""

    try:
        agent = Agent(
            simulation_id=simulation_id,
            name=to_str(data.get("name", "匿名")),
            age=int(data.get("age", 30)),
            occupation=to_str(data.get("occupation", "会社員")),
            personality=to_str(data.get("personality", "")),
            stance=to_str(data.get("stance", "中立")),
            values=to_str(data.get("values", "")),
            emotional_state=to_str(data.get("emotional_state", "普通")),
        )
        agent.id = save_agent(agent)
        return agent
    except Exception as e:
        print(f"  エージェント保存エラー: {e}")
        return None


def _create_fallback_agents(count: int, seed_text: str) -> list:
    """API失敗時のフォールバックエージェント"""
    occupations = ["会社員", "教師", "学生", "自営業者", "公務員"]
    stances = ["賛成", "反対", "中立"]
    return [
        {
            "name": f"エージェント{i+1:03d}",
            "age": 20 + (i % 50),
            "occupation": occupations[i % len(occupations)],
            "personality": "合理的に物事を考える。",
            "stance": stances[i % len(stances)],
            "values": "公正さを重視する。",
            "emotional_state": "普通",
        }
        for i in range(count)
    ]
