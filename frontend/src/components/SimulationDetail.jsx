import AgentList from './AgentList'
import SimulationLog from './SimulationLog'
import EmotionChart from './EmotionChart'
import RelationMap from './RelationMap'
import ReportView from './ReportView'

/**
 * シミュレーション詳細ビュー
 */
export default function SimulationDetail({ detail, api }) {
  const { simulation, agents, interactions } = detail

  // ステータスバッジ
  const statusConfig = {
    created: { bg: 'bg-[#94a3b8]/20', text: 'text-[#94a3b8]', label: '作成済み' },
    running: { bg: 'bg-[#0ea5e9]/20', text: 'text-[#0ea5e9]', label: '実行中' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '完了' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: '失敗' },
  }
  const sc = statusConfig[simulation.status] || statusConfig.created

  return (
    <div className="space-y-6">
      {/* シナリオ概要カード */}
      <div className="bg-[#112240] border border-[#112240] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold gradient-text">
            シミュレーション #{simulation.id}
          </h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
            {sc.label}
          </span>
        </div>
        <p className="text-[#e2e8f0] text-sm leading-relaxed">{simulation.seed}</p>
        <div className="flex gap-4 mt-3 text-xs text-[#94a3b8]">
          <span> {simulation.agent_count}人</span>
          <span> {simulation.turn_count}ターン</span>
          <span> {simulation.created_at?.slice(0, 19).replace('T', ' ')}</span>
        </div>
      </div>

      {/* 2カラム: エージェント + 対話ログ */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左: エージェント一覧 (35%) */}
        <div className="lg:w-[35%]">
          <AgentList agents={agents} />
        </div>
        {/* 右: 対話ログ (65%) */}
        <div className="lg:w-[65%]">
          <SimulationLog interactions={interactions} totalTurns={simulation.turn_count} />
        </div>
      </div>

      {/* 感情変化チャート */}
      <EmotionChart simId={simulation.id} api={api} />

      {/* 関係性マップ */}
      <RelationMap simId={simulation.id} api={api} />

      {/* レポートセクション */}
      <ReportView simId={simulation.id} status={simulation.status} api={api} />
    </div>
  )
}
