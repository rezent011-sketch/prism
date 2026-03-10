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
シミュレーション結果を分析し、以下の形式でレポートを生成してください。

【重要なルール】
- テーブル（|---|）は一切使わない
- 箇条書き（-）と見出し（##）と太字（**）だけを使う
- 各セクションは簡潔に、1セクション5〜8行以内
- 専門用語を避け、誰でも読みやすい文章で書く

【構成】
## 📋 概要
（2〜3文でシミュレーションの要点をまとめる）

## 👥 意見の分布
（賛成・反対・中立の人数と主な理由を箇条書きで）

## 🔑 議論のポイント
（最も重要な対立点や論点を3つ箇条書きで）

## 🔮 今後の予測
**楽観的シナリオ：** （1〜2文）
**現実的シナリオ：** （1〜2文）
**悲観的シナリオ：** （1〜2文）

## ✅ 推奨アクション
（具体的なアクションを3つ箇条書きで）"""

    user_message = f"""以下のシミュレーション結果を分析してレポートを生成してください。

【参加エージェント】
{agent_summary}

【シミュレーションログ】
{interaction_log}"""

    report = call_claude(system_prompt, user_message, max_tokens=4096)
    print("✅ レポート生成完了")
    return report
