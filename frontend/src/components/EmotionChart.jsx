import { useState, useEffect } from 'react'

/**
 * 感情変化チャートコンポーネント
 * エージェントごとの感情状態をターン別テーブルで表示
 */

// 感情状態のバッジ色分け
function getEmotionBadgeStyle(emotion) {
  if (!emotion) return { bg: 'bg-[#94a3b8]/20', text: 'text-[#94a3b8]' }

  // 期待・賛同系 → 緑
  const positive = ['期待', '賛成', '賛同', '協力', '前向き', '肯定', '喜び', '嬉し', '同意', '希望', '信頼']
  // 懸念・不安系 → 黄
  const caution = ['懸念', '不安', '心配', '疑問', '迷い', '戸惑', '慎重', '様子見', '観察', '疑念']
  // 怒り・反対系 → 赤
  const negative = ['怒り', '反対', '反発', '不満', '抵抗', '憤', '批判', '拒否', '否定', '苛立', '失望']

  for (const k of positive) {
    if (emotion.includes(k)) return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' }
  }
  for (const k of negative) {
    if (emotion.includes(k)) return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' }
  }
  for (const k of caution) {
    if (emotion.includes(k)) return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' }
  }
  // 中立・その他
  return { bg: 'bg-[#94a3b8]/15', text: 'text-[#94a3b8]', border: 'border-[#94a3b8]/20' }
}

export default function EmotionChart({ simId, api }) {
  const [emotions, setEmotions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!simId || !api) return
    setLoading(true)
    setError(null)

    fetch(`${api}/simulations/${simId}/emotions`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setEmotions(data.emotions || [])
      })
      .catch(err => {
        // 404 = まだデータなし、それ以外はエラー
        if (err.message.includes('404')) {
          setEmotions([])
        } else {
          setError(err.message)
          setEmotions([])
        }
      })
      .finally(() => setLoading(false))
  }, [simId, api])

  // テーブルデータ構築
  // emotionsを {agentName: {turn: emotionalState}} に変換
  const tableData = (() => {
    if (!emotions || emotions.length === 0) return { agents: [], turns: [] }
    const agentMap = {}
    const turnSet = new Set()

    for (const e of emotions) {
      const name = e.agent_name || `エージェント${e.agent_id}`
      if (!agentMap[name]) agentMap[name] = {}
      agentMap[name][e.turn] = e.emotional_state
      turnSet.add(e.turn)
    }

    const agents = Object.keys(agentMap).map(name => ({ name, turns: agentMap[name] }))
    const turns = Array.from(turnSet).sort((a, b) => a - b)
    return { agents, turns }
  })()

  return (
    <div className="bg-[#112240] border border-[#112240] rounded-xl p-5">
      <h3 className="text-lg font-bold mb-4 text-[#e2e8f0]">📈 感情変化の推移</h3>

      {loading && (
        <div className="flex items-center gap-2 text-[#94a3b8] text-sm py-4">
          <span className="spinner" style={{ width: 16, height: 16 }} />
          データを読み込み中...
        </div>
      )}

      {!loading && error && (
        <p className="text-red-400 text-sm">❌ 感情データの取得に失敗しました: {error}</p>
      )}

      {!loading && !error && tableData.agents.length === 0 && (
        <p className="text-[#94a3b8] text-sm py-2">感情データがありません</p>
      )}

      {!loading && !error && tableData.agents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-[#94a3b8] font-medium border-b border-[#0d1b2e] min-w-[120px]">
                  エージェント
                </th>
                {tableData.turns.map(t => (
                  <th
                    key={t}
                    className="px-3 py-2 text-center text-[#94a3b8] font-medium border-b border-[#0d1b2e] min-w-[120px]"
                  >
                    ターン {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.agents.map((agent, i) => (
                <tr
                  key={agent.name}
                  className={i % 2 === 0 ? 'bg-[#0d1b2e]/30' : ''}
                >
                  <td className="px-3 py-2.5 font-medium text-[#e2e8f0] border-b border-[#0d1b2e]/50">
                    {agent.name}
                  </td>
                  {tableData.turns.map(t => {
                    const state = agent.turns[t]
                    const style = getEmotionBadgeStyle(state)
                    return (
                      <td
                        key={t}
                        className="px-3 py-2.5 text-center border-b border-[#0d1b2e]/50"
                      >
                        {state ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border || ''}`}
                          >
                            {state}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]/40 text-xs">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
