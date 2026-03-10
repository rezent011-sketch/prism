"""Prism CLI エントリーポイント - 群体知能シミュレーションエンジン"""
import sys
import click
from prism.config import DEFAULT_AGENT_COUNT, DEFAULT_TURN_COUNT
from prism.database import init_db, create_simulation, update_simulation_status, list_simulations
from prism.models import Simulation
from prism.agent_generator import generate_agents
from prism.simulator import run_simulation
from prism.reporter import generate_report


@click.group()
def cli():
    """🔮 Prism - 群体知能シミュレーションエンジン"""
    init_db()


@cli.command()
@click.option("--seed", type=str, default=None, help="シード情報テキスト")
@click.option("--file", "seed_file", type=click.Path(exists=True), default=None, help="シード情報ファイルパス")
@click.option("--agents", default=DEFAULT_AGENT_COUNT, help="エージェント数 (10-20)")
@click.option("--turns", default=DEFAULT_TURN_COUNT, help="ターン数 (1-20)")
def simulate(seed, seed_file, agents, turns):
    """シミュレーションを実行"""
    # シード情報の取得
    if seed_file:
        with open(seed_file, "r", encoding="utf-8") as f:
            seed_text = f.read().strip()
    elif seed:
        seed_text = seed
    else:
        click.echo("❌ --seed または --file でシード情報を指定してください。")
        sys.exit(1)

    click.echo(f"\n🔮 Prism シミュレーション開始")
    click.echo(f"📝 シード: {seed_text[:80]}...")
    click.echo(f"👥 エージェント数: {agents}")
    click.echo(f"🔄 ターン数: {turns}")

    try:
        # シミュレーション作成
        sim = Simulation(seed_text=seed_text, agent_count=agents, turn_count=turns, status="running")
        sim_id = create_simulation(sim)
        click.echo(f"📌 シミュレーション ID: {sim_id}")

        # エージェント生成
        agent_list = generate_agents(seed_text, sim_id, agents)

        # シミュレーション実行
        interactions = run_simulation(seed_text, agent_list, sim_id, turns)

        # ステータス更新
        update_simulation_status(sim_id, "completed")

        # レポート生成
        report = generate_report(sim_id)
        click.echo(f"\n{'='*60}")
        click.echo(report)
        click.echo(f"{'='*60}")
        click.echo(f"\n✅ シミュレーション #{sim_id} 完了")

    except Exception as e:
        click.echo(f"\n❌ エラー: {e}")
        if 'sim_id' in locals():
            update_simulation_status(sim_id, "failed")
        sys.exit(1)


@cli.command()
@click.option("--sim-id", required=True, type=int, help="シミュレーションID")
def report(sim_id):
    """既存シミュレーションのレポートを生成"""
    try:
        result = generate_report(sim_id)
        click.echo(result)
    except Exception as e:
        click.echo(f"❌ エラー: {e}")
        sys.exit(1)


@cli.command("list")
def list_sims():
    """シミュレーション一覧を表示"""
    sims = list_simulations()
    if not sims:
        click.echo("シミュレーションはまだありません。")
        return

    click.echo(f"\n{'ID':>4} | {'ステータス':<10} | {'エージェント':>6} | {'ターン':>4} | {'作成日時':<20} | シード")
    click.echo("-" * 80)
    for s in sims:
        click.echo(f"{s.id:>4} | {s.status:<10} | {s.agent_count:>6} | {s.turn_count:>4} | {s.created_at[:19]:<20} | {s.seed_text[:30]}...")


if __name__ == "__main__":
    cli()
