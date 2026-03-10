/**
 * 対話ログ表示コンポーネント（バブル型チャットUI）
 * ターンごとに区切り線、エージェント名+絵文字アバター+発言内容
 */

const AVATARS = ['👨‍💼', '👩‍💻', '👨‍🔬', '👩‍🏫', '👨‍🎨', '👩‍⚕️', '👨‍🌾', '👩‍🍳', '🧑‍💼', '👨‍🔧', '👩‍🎤', '🧑‍🔬', '👨‍✈️', '👩‍🚒', '🧑‍🎓', '👨‍⚖️', '👩‍🏭', '🧑‍🍳', '👨‍🎓', '👩‍💼']

function getAvatar(name) {
  if (!name) return '🧑'
  const hash = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATARS[hash % AVATARS.length]
}

export default function SimulationLog({ interactions, totalTurns }) {
  if (!interactions || interactions.length === 0) {
    return <p className="text-[#94a3b8]">対話ログがありません。</p>
  }

  // ターンごとにグループ化
  const byTurn = {}
  interactions.forEach(i => {
    if (!byTurn[i.turn]) byTurn[i.turn] = []
    byTurn[i.turn].push(i)
  })

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-[#e2e8f0]">
        💬 対話ログ <span className="text-[#94a3b8] text-sm font-normal">({interactions.length}件)</span>
      </h3>
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {Object.entries(byTurn).map(([turn, items]) => (
          <div key={turn}>
            {/* ターン区切り線 */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#7c3aed]/40 to-transparent" />
              <span className="text-xs font-bold text-[#7c3aed] whitespace-nowrap">
                ── ターン {turn}/{totalTurns || '?'} ──
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#7c3aed]/40 to-transparent" />
            </div>
            {/* 発言バブル */}
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  {/* アバター */}
                  <div className="text-xl flex-shrink-0 mt-1">
                    {getAvatar(item.agent_name)}
                  </div>
                  {/* バブル */}
                  <div className="flex-1 bg-[#112240] border border-[#112240] rounded-xl rounded-tl-sm p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-sm text-[#0ea5e9]">{item.agent_name}</span>
                      {item.action_type && (
                        <span className="text-xs text-[#94a3b8] bg-[#94a3b8]/10 px-1.5 py-0.5 rounded">
                          {item.action_type}
                        </span>
                      )}
                      {item.emotional_state && (
                        <span className="text-xs text-[#7c3aed] ml-auto">
                          {item.emotional_state}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#e2e8f0] leading-relaxed">{
                      (() => {
                        try {
                          const parsed = JSON.parse(item.content);
                          return parsed.content || item.content;
                        } catch {
                          return item.content;
                        }
                      })()
                    }</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
