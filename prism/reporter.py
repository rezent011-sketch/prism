"""シミュレーション結果からレポートを生成するモジュール"""
from typing import List
from .models import Interaction
from .database import get_interactions, get_agents
from .llm import call_claude


def generate_report(simulation_id: int) -> str:
    """シミュレーション結果を分析し、予測レポートを生成"""
    print(f"\n📊 シミュレーション #{simulation_id} のレポート生成中...")

    # データ取得
    interactions = get_interactions(simulation_id)
    agents = get_agents(simulation_id)

    if not interactions:
        return "❌ シミュレーションデータが見つかりません。"

    # エージェント情報のサマリー
    agent_summary = "\n".join(
        f"- {a.name} ({a.age}歳, {a.occupation}): 立場={a.stance}, 最終感情={a.emotional_state}"
        for a in agents
    )

    # 相互作用ログ
    interaction_log = "\n".join(
        f"[ターン{i.turn}] {i.agent_name} ({i.action_type}): {i.content} [感情: {i.emotional_state}]"
        for i in interactions
    )

    system_prompt = """あなたは社会シミュレーションの分析専門家です。
シミュレーション結果を分析し、以下の構成で予測レポートを生成してください:

1. 📋 概要 - シミュレーションの概要
2. 📈 主要な流れ - 時系列での展開
3. 📊 意見分布 - エージェントの立場・意見の分布
4. 🔮 予測シナリオ（3つ）
   - 楽観シナリオ
   - 基本シナリオ
   - 悲観シナリオ
5. ✅ 推奨アクション - 取るべき行動の提案

マークダウン形式で読みやすく書いてください。"""

    user_message = f"""以下のシミュレーション結果を分析してレポートを生成してください。

【参加エージェント】
{agent_summary}

【シミュレーションログ】
{interaction_log}"""

    report = call_claude(system_prompt, user_message, max_tokens=4096)
    print("✅ レポート生成完了")
    return report
