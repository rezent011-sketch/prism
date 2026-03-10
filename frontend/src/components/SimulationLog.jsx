/**
 * 対話ログ表示コンポーネント
 * ターンごとにエージェント名・発言内容を表示
 */
export default function SimulationLog({ interactions }) {
  if (!interactions || interactions.length === 0) {
    return <p className="text-[#8b949e]">対話ログがありません。</p>
  }

  // ターンごとにグループ化
  const byTurn = {}
  interactions.forEach(i => {
    if (!byTurn[i.turn]) byTurn[i.turn] = []
    byTurn[i.turn].push(i)
  })

  return (
    <div>
      <h3 className="text-lg font-bold mb-3">💬 対話ログ ({interactions.length}件)</h3>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {Object.entries(byTurn).map(([turn, items]) => (
          <div key={turn}>
            <div className="text-xs font-bold text-[#8b5cf6] mb-2 sticky top-0 bg-[#0d1117] py-1">
              ── ターン {turn} ──
            </div>
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{item.agent_name}</span>
                    <span className="text-xs text-[#8b949e]">{item.action_type}</span>
                    {item.emotional_state && (
                      <span className="text-xs text-[#8b949e] ml-auto">
                        {item.emotional_state}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#c9d1d9] leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
