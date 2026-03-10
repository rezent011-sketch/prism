import { useState, useEffect } from 'react'

/**
 * エージェント関係性マップコンポーネント
 * trust_scoreに基づいて協調・対立・中立を表示
 */

function getRelationStyle(trustScore) {
  if (trustScore > 0.2) {
    return {
      icon: '🤝',
      label: '協調',
      bg: 'bg-green-500/15',
      text: 'text-green-300',
      border: 'border-green-500/30',
      scoreBg: 'bg-green-500/20',
    }
  } else if (trustScore < -0.2) {
    return {
      icon: '⚡',
      label: '対立',
      bg: 'bg-red-500/15',
      text: 'text-red-300',
      border: 'border-red-500/30',
      scoreBg: 'bg-red-500/20',
    }
  } else {
    return {
      icon: '〜',
      label: '中立',
      bg: 'bg-[#94a3b8]/10',
      text: 'text-[#94a3b8]',
      border: 'border-[#94a3b8]/20',
      scoreBg: 'bg-[#94a3b8]/15',
    }
  }
}

// trust_scoreを±1.0スケールで表示するバー
function TrustBar({ score }) {
  const pct = Math.round((score + 1) * 50) // -1→0%, 0→50%, 1→100%
  const clamped = Math.max(0, Math.min(100, pct))
  const isPositive = score >= 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-[#0d1b2e] rounded-full overflow-hidden relative">
        {/* 中心線 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#94a3b8]/30" />
        {/* バー */}
        <div
          className={`absolute top-0 bottom-0 rounded-full ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}
          style={{
            left: isPositive ? '50%' : `${clamped}%`,
            right: isPositive ? `${100 - clamped}%` : '50%',
          }}
        />
      </div>
      <span className={`text-xs font-mono ${isPositive ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-[#94a3b8]'}`}>
        {score >= 0 ? '+' : ''}{score.toFixed(2)}
      </span>
    </div>
  )
}

export default function RelationMap({ simId, api }) {
  const [relations, setRelations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!simId || !api) return
    setLoading(true)
    setError(null)

    fetch(`${api}/simulations/${simId}/relations`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setRelations(data.relations || [])
      })
      .catch(err => {
        if (err.message.includes('404')) {
          setRelations([])
        } else {
          setError(err.message)
          setRelations([])
        }
      })
      .finally(() => setLoading(false))
  }, [simId, api])

  // エージェントごとにグループ化（発信者視点）
  const grouped = (() => {
    if (!relations || relations.length === 0) return []
    const map = {}
    for (const r of relations) {
      const fromName = r.from_name || `エージェント${r.agent_id_from}`
      if (!map[fromName]) map[fromName] = { name: fromName, outgoing: [] }
      map[fromName].outgoing.push(r)
    }
    return Object.values(map)
  })()

  // サマリー統計
  const stats = (() => {
    if (!relations || relations.length === 0) return null
    const cooperative = relations.filter(r => r.trust_score > 0.2).length
    const conflict = relations.filter(r => r.trust_score < -0.2).length
    const neutral = relations.length - cooperative - conflict
    return { cooperative, conflict, neutral, total: relations.length }
  })()

  return (
    <div className="bg-[#112240] border border-[#112240] rounded-xl p-5">
      <h3 className="text-lg font-bold mb-4 text-[#e2e8f0]">🕸️ エージェント関係性</h3>

      {loading && (
        <div className="flex items-center gap-2 text-[#94a3b8] text-sm py-4">
          <span className="spinner" style={{ width: 16, height: 16 }} />
          データを読み込み中...
        </div>
      )}

      {!loading && error && (
        <p className="text-red-400 text-sm">❌ 関係性データの取得に失敗しました: {error}</p>
      )}

      {!loading && !error && relations?.length === 0 && (
        <p className="text-[#94a3b8] text-sm py-2">
          新しいシミュレーションを実行すると関係性データが表示されます
        </p>
      )}

      {!loading && !error && relations?.length > 0 && (
        <div className="space-y-4">
          {/* サマリーバッジ */}
          {stats && (
            <div className="flex flex-wrap gap-2 pb-3 border-b border-[#0d1b2e]">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                🤝 協調 {stats.cooperative}件
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                ⚡ 対立 {stats.conflict}件
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#94a3b8]/15 text-[#94a3b8] border border-[#94a3b8]/20">
                〜 中立 {stats.neutral}件
              </span>
              <span className="ml-auto text-xs text-[#94a3b8]">全{stats.total}関係</span>
            </div>
          )}

          {/* エージェントカード群 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped.map(agent => (
              <div
                key={agent.name}
                className="bg-[#0d1b2e] border border-[#112240] rounded-lg p-3"
              >
                <div className="font-semibold text-sm text-[#e2e8f0] mb-2.5">
                  👤 {agent.name}
                </div>
                <div className="space-y-2">
                  {agent.outgoing.map((rel, i) => {
                    const toName = rel.to_name || `エージェント${rel.agent_id_to}`
                    const style = getRelationStyle(rel.trust_score)
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border ${style.bg} ${style.border}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm flex-shrink-0">{style.icon}</span>
                          <span className={`text-xs font-medium ${style.text} flex-shrink-0`}>
                            {style.label}
                          </span>
                          <span className="text-[#94a3b8] text-xs truncate">
                            → {toName}
                          </span>
                          {rel.influence_count != null && rel.influence_count > 0 && (
                            <span className="text-xs text-[#94a3b8] flex-shrink-0">
                              ({rel.influence_count}回)
                            </span>
                          )}
                        </div>
                        <div className="w-28 flex-shrink-0 ml-2">
                          <TrustBar score={rel.trust_score} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
