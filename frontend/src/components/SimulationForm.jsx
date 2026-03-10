import { useState } from 'react'

// プリセットシード
const PRESETS = [
  { label: '🏢 リモートワーク', text: '大手IT企業が全社員にオフィス出勤を週5日義務化する方針を発表した。社員の間で賛否が分かれている。' },
  { label: '🤖 AI規制', text: '政府がAI生成コンテンツに対する厳格な規制法案を提出した。クリエイター、テック企業、消費者の間で激しい議論が起きている。' },
  { label: '🌍 環境政策', text: '市が2030年までにガソリン車の市内乗り入れを禁止する条例案を発表した。住民、事業者、環境団体がそれぞれの立場から反応している。' },
  { label: '🎓 教育改革', text: '文部科学省が大学入試を廃止し、ポートフォリオ評価に完全移行する方針を発表した。教育関係者や学生、保護者の間で議論が巻き起こっている。' },
]

export default function SimulationForm({ onStart, loading }) {
  const [seed, setSeed] = useState('')
  const [agentCount, setAgentCount] = useState(15)
  const [turnCount, setTurnCount] = useState(10)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!seed.trim()) return
    onStart(seed, agentCount, turnCount)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">新規シミュレーション</h2>

      {/* プリセットボタン */}
      <div className="mb-4">
        <label className="text-sm text-[#8b949e] mb-2 block">プリセットシナリオ</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSeed(p.text)}
              className="px-3 py-1.5 text-sm bg-[#161b22] border border-[#30363d] rounded-lg hover:border-[#8b5cf6] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* シード入力 */}
      <div className="mb-4">
        <label className="text-sm text-[#8b949e] mb-2 block">シード情報（シナリオ）</label>
        <textarea
          value={seed}
          onChange={e => setSeed(e.target.value)}
          rows={4}
          placeholder="シミュレーションのシナリオを入力してください..."
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm focus:outline-none focus:border-[#8b5cf6] resize-none"
        />
      </div>

      {/* エージェント数 */}
      <div className="mb-4">
        <label className="text-sm text-[#8b949e] mb-2 block">
          エージェント数: <span className="text-white font-bold">{agentCount}</span>
        </label>
        <input
          type="range"
          min={10}
          max={20}
          value={agentCount}
          onChange={e => setAgentCount(Number(e.target.value))}
          className="w-full accent-[#8b5cf6]"
        />
        <div className="flex justify-between text-xs text-[#8b949e]">
          <span>10</span><span>20</span>
        </div>
      </div>

      {/* ターン数 */}
      <div className="mb-6">
        <label className="text-sm text-[#8b949e] mb-2 block">
          ターン数: <span className="text-white font-bold">{turnCount}</span>
        </label>
        <input
          type="range"
          min={3}
          max={20}
          value={turnCount}
          onChange={e => setTurnCount(Number(e.target.value))}
          className="w-full accent-[#8b5cf6]"
        />
        <div className="flex justify-between text-xs text-[#8b949e]">
          <span>3</span><span>20</span>
        </div>
      </div>

      {/* 開始ボタン */}
      <button
        type="submit"
        disabled={loading || !seed.trim()}
        className="w-full py-3 rounded-lg font-bold text-white bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            実行中...
          </span>
        ) : (
          '🔮 シミュレーション開始'
        )}
      </button>
    </form>
  )
}
