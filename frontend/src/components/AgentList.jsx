/**
 * エージェント一覧コンポーネント
 * 絵文字アバター・名前・年齢・職業・感情状態バッジ
 */

// 名前から絵文字アバターを自動選択
const AVATARS = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']

function getAvatar(name, index) {
 // 名前のハッシュからアバターを選択
 const hash = name ? name.charCodeAt(0) + (name.charCodeAt(1) || 0) : index
 return AVATARS[hash % AVATARS.length]
}

// 感情状態のカラーバッジ設定
const EMOTION_COLORS = {
 '懸念': { bg: 'bg-yellow-500/20', text: 'text-yellow-300' },
 '期待': { bg: 'bg-green-500/20', text: 'text-green-300' },
 '怒り': { bg: 'bg-red-500/20', text: 'text-red-300' },
 '中立': { bg: 'bg-[#94a3b8]/20', text: 'text-[#94a3b8]' },
 '賛成': { bg: 'bg-green-500/20', text: 'text-green-300' },
 '反対': { bg: 'bg-red-500/20', text: 'text-red-300' },
 '不安': { bg: 'bg-orange-500/20', text: 'text-orange-300' },
 '興味': { bg: 'bg-[#0ea5e9]/20', text: 'text-[#0ea5e9]' },
}

function getEmotionStyle(emotion) {
 if (!emotion) return { bg: 'bg-[#94a3b8]/20', text: 'text-[#94a3b8]' }
 // 部分一致で検索
 for (const [key, val] of Object.entries(EMOTION_COLORS)) {
 if (emotion.includes(key)) return val
 }
 return { bg: 'bg-[#7c3aed]/20', text: 'text-[#7c3aed]' }
}

export default function AgentList({ agents }) {
 if (!agents || agents.length === 0) {
 return <p className="text-[#94a3b8]">エージェントがいません。</p>
 }

 return (
 <div>
 <h3 className="text-lg font-bold mb-3 text-[#e2e8f0]">
 エージェント一覧 <span className="text-[#94a3b8] text-sm font-normal">({agents.length}人)</span>
 </h3>
 <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
 {agents.map((agent, i) => {
 const avatar = getAvatar(agent.name, i)
 const emotionStyle = getEmotionStyle(agent.emotional_state)
 return (
 <div
 key={agent.id}
 className="bg-[#112240] border border-[#112240] rounded-lg p-3 card-hover"
 >
 <div className="flex items-start gap-3">
 {/* アバター */}
 <div className="text-2xl flex-shrink-0 mt-0.5">{avatar}</div>
 <div className="flex-1 min-w-0">
 <div className="font-bold text-sm text-[#e2e8f0]">{agent.name}</div>
 <div className="text-xs text-[#94a3b8] mt-1">
 {agent.age}歳 / {agent.occupation}
 </div>
 {agent.stance && (
 <div className="text-xs text-[#94a3b8] mt-0.5"> {agent.stance}</div>
 )}
 {agent.emotional_state && (
 <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${emotionStyle.bg} ${emotionStyle.text}`}>
 {agent.emotional_state}
 </span>
 )}
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )
}
