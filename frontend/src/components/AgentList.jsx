/**
 * エージェント一覧コンポーネント
 * 名前・年齢・職業・立場をカード形式で表示
 */
export default function AgentList({ agents }) {
  if (!agents || agents.length === 0) {
    return <p className="text-[#8b949e]">エージェントがいません。</p>
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3">👥 エージェント一覧 ({agents.length}人)</h3>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        {agents.map(agent => (
          <div
            key={agent.id}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          >
            <div className="font-bold text-sm mb-1">{agent.name}</div>
            <div className="text-xs text-[#8b949e] space-y-0.5">
              <div>🎂 {agent.age}歳 / 💼 {agent.occupation}</div>
              <div>📌 立場: {agent.stance}</div>
              {agent.emotional_state && (
                <div>😊 感情: {agent.emotional_state}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
