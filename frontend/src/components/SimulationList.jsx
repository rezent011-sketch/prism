/**
 * シミュレーション一覧（カード型グリッド）
 */
export default function SimulationList({ simulations, onSelect }) {
  if (!simulations || simulations.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4"></div>
        <p className="text-[#94a3b8] text-lg">まだシミュレーションがありません</p>
        <p className="text-[#94a3b8]/60 text-sm mt-1">新規タブからシミュレーションを開始してください</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 gradient-text">シミュレーション一覧</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {simulations.map(sim => (
          <div
            key={sim.id}
            onClick={() => onSelect(sim.id)}
            className="bg-[#112240] border border-[#112240] rounded-xl p-5 cursor-pointer card-hover"
          >
            {/* ヘッダー行 */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-[#0ea5e9] font-bold text-sm">#{sim.id}</span>
              <StatusBadge status={sim.status} />
            </div>
            {/* シナリオ概要 */}
            <p className="text-sm text-[#e2e8f0] mb-3 line-clamp-2 leading-relaxed">
              {sim.seed?.slice(0, 50)}{sim.seed?.length > 50 ? '...' : ''}
            </p>
            {/* メタ情報 */}
            <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
              <span> {sim.agent_count}人</span>
              <span> {sim.turn_count}ターン</span>
            </div>
            <div className="text-xs text-[#94a3b8]/60 mt-2">
              {sim.created_at?.slice(0, 19).replace('T', ' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** ステータスバッジ */
function StatusBadge({ status }) {
  const config = {
    created: { bg: 'bg-[#94a3b8]/20', text: 'text-[#94a3b8]', label: '作成済み' },
    running: { bg: 'bg-[#0ea5e9]/20', text: 'text-[#0ea5e9]', label: '実行中', pulse: true },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '完了' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: '失敗' },
  }
  const c = config[status] || config.created
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} ${c.pulse ? 'animate-pulse-glow' : ''}`}>
      {c.label}
    </span>
  )
}
