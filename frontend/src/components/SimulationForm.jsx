import { useState, useRef, useEffect } from 'react'

// プリセットシナリオ
const PRESETS = [
  {
    icon: '🔥',
    label: 'PR炎上予測',
    text: '大手IT企業が全社員にオフィス出勤を週5日義務化する方針を発表した。社員の間で賛否が分かれている。',
  },
  {
    icon: '📈',
    label: '市場反応分析',
    text: '政府がAI生成コンテンツに対する厳格な規制法案を提出した。クリエイター、テック企業、消費者の間で激しい議論が起きている。',
  },
  {
    icon: '🗳️',
    label: '政策波及予測',
    text: '市が2030年までにガソリン車の市内乗り入れを禁止する条例案を発表した。住民、事業者、環境団体がそれぞれの立場から反応している。',
  },
  {
    icon: '📱',
    label: 'Xポスト反応',
    badge: 'NEW',
    text: 'Xに投稿するポストの反応をシミュレートします。\n投稿内容: [ここにポスト文面]\n想定フォロワー層: ビジネス・AI・スタートアップ系アカウント（フォロワー5000人）\nシミュレート内容: いいね・リツイート・返信のトーン・炎上リスク',
  },
]

/**
 * 新規シミュレーションフォーム（MiroFish風）
 * 左: 入力パネル / 右: プレビューパネル
 */
export default function SimulationForm({ onStart, loading, runStatus, api }) {
  const [seed, setSeed] = useState('')
  const [agentCount, setAgentCount] = useState(15)
  const [turnCount, setTurnCount] = useState(10)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!seed.trim()) return
    onStart(seed, agentCount, turnCount)
  }

  return (
    <div>
      {/* ヒーロー文言 */}
      <div style={{textAlign:"center",marginBottom:"32px",padding:"0 24px"}}>
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">AIエージェントが社会をシミュレートする</span>
        </h2>
        <p className="text-xl text-[#0ea5e9]">未来予測エンジン</p>
      </div>

      {/* 2カラムレイアウト */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左: 入力パネル (40%) */}
        <form onSubmit={handleSubmit} className="lg:w-5/12 space-y-5">
          {/* シナリオ入力 */}
          <div>
            <label className="text-sm text-[#94a3b8] mb-2 block">シナリオ入力</label>
            <textarea
              value={seed}
              onChange={e => setSeed(e.target.value)}
              rows={5}
              placeholder="シミュレーションのシナリオを入力してください..."
              className="w-full bg-[#0d1b2e] border border-[#112240] rounded-xl p-4 text-sm text-[#e2e8f0] focus:outline-none textarea-glow resize-none transition-all duration-300"
            />
          </div>

          {/* プリセットボタン */}
          <div>
            <label className="text-sm text-[#94a3b8] mb-2 block">プリセットシナリオ</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSeed(p.text)}
                  className="relative bg-[#112240] border border-[#112240] rounded-lg p-3 text-left text-sm hover:border-[#7c3aed] transition-all duration-300 hover:bg-[#112240]/80 group"
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="ml-2 text-[#e2e8f0] group-hover:text-white">{p.label}</span>
                  {p.badge && (
                    <span className="absolute top-1 right-1 text-[10px] bg-[#0ea5e9] text-white px-1.5 py-0.5 rounded-full font-bold">
                      {p.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* エージェント数スライダー */}
          <div>
            <label className="text-sm text-[#94a3b8] mb-2 flex justify-between">
              <span>エージェント数</span>
              <span className="text-[#7c3aed] font-bold text-base">{agentCount}</span>
            </label>
            <input
              type="range" min={10} max={20} value={agentCount}
              onChange={e => setAgentCount(Number(e.target.value))}
              className="w-full accent-[#7c3aed] h-2"
            />
            <div className="flex justify-between text-xs text-[#94a3b8] mt-1">
              <span>10</span><span>20</span>
            </div>
          </div>

          {/* ターン数スライダー */}
          <div>
            <label className="text-sm text-[#94a3b8] mb-2 flex justify-between">
              <span>ターン数</span>
              <span className="text-[#0ea5e9] font-bold text-base">{turnCount}</span>
            </label>
            <input
              type="range" min={3} max={20} value={turnCount}
              onChange={e => setTurnCount(Number(e.target.value))}
              className="w-full accent-[#0ea5e9] h-2"
            />
            <div className="flex justify-between text-xs text-[#94a3b8] mt-1">
              <span>3</span><span>20</span>
            </div>
          </div>

          {/* 開始ボタン */}
          <button
            type="submit"
            disabled={loading || !seed.trim()}
            className="w-full py-4 rounded-xl font-bold text-white text-lg btn-gradient"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="spinner" />
                実行中...
              </span>
            ) : (
              (<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}><img src="/prism/logo.png" alt="" style={{width:"22px",height:"22px",objectFit:"contain"}} /> シミュレーション開始</span>)
            )}
          </button>
        </form>

        {/* 右: プレビューパネル (60%) */}
        <div className="lg:w-7/12 bg-[#0d1b2e] border border-[#112240] rounded-xl p-6 min-h-[400px] flex items-center justify-center">
          {!loading && !runStatus && (
            <PreviewIdle />
          )}
          {loading && runStatus && (
            <PreviewRunning simId={runStatus.simId} api={api} runStatus={runStatus} />
          )}
        </div>
      </div>
    </div>
  )
}

/** 開始前のプレビュー表示 */
function PreviewIdle() {
  return (
    <div className="text-center">
      {/* 粒子風装飾 */}
      <div className="relative mb-6">
        <img src="/prism/logo.png" alt="Prism" style={{width:"72px",height:"72px",objectFit:"contain",marginBottom:"16px"}} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="particle absolute text-[#7c3aed] text-xs"
              style={{
                left: `${(i - 2) * 30}px`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      </div>
      <p className="text-[#94a3b8] text-lg">シナリオを入力して開始してください</p>
      <p className="text-[#94a3b8]/60 text-sm mt-2">AIエージェントが社会の反応をシミュレートします</p>
    </div>
  )
}

/** 実行中のプレビュー表示（SSEリアルタイムストリーミング） */
function PreviewRunning({ simId, api, runStatus }) {
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)
  const { phase, turn, totalTurns } = runStatus || {}

  // simIdが確定したらSSE接続を開始
  useEffect(() => {
    if (!simId || !api) return
    const es = new EventSource(`${api}/simulations/${simId}/stream`)
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        setMessages(prev => [...prev.slice(-50), msg])
      } catch {}
    }
    es.addEventListener('done', () => es.close())
    es.onerror = () => es.close()
    return () => es.close()
  }, [simId, api])

  // 新しいメッセージが届いたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // simIdがまだない場合（starting/generating フェーズ）はスピナー表示
  if (!simId || messages.length === 0) {
    const statusText = phase === 'starting' ? 'シミュレーションを開始しています...'
      : phase === 'generating' ? 'エージェントを生成中...'
      : `ターン ${turn}/${totalTurns} 実行中...`
    const progress = phase === 'starting' ? 5
      : phase === 'generating' ? 15
      : Math.min(15 + ((turn || 0) / (totalTurns || 1)) * 85, 95)

    return (
      <div className="w-full max-w-md text-center">
        <div className="spinner mx-auto mb-6" style={{ width: 48, height: 48, borderWidth: 4 }} />
        <p className="text-[#e2e8f0] text-lg font-bold mb-4">{statusText}</p>
        <div className="w-full bg-[#112240] rounded-full h-3 overflow-hidden">
          <div
            className="progress-bar h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[#94a3b8] text-sm mt-3">{Math.round(progress)}% 完了</p>
      </div>
    )
  }

  return (
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',gap:'8px',overflowY:'auto',maxHeight:'560px'}}>
      <p style={{color:'#94a3b8',fontSize:'0.8rem',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
        <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#0ea5e9',display:'inline-block',animation:'pulse 1s infinite'}} />
        シミュレーション実行中...
      </p>
      {messages.map((msg, i) => (
        <div key={i} style={{
          background:'rgba(124,58,237,0.08)',
          border:'1px solid rgba(124,58,237,0.2)',
          borderRadius:'12px',
          padding:'10px 14px',
          animation:'fadeIn 0.3s ease',
          flexShrink:0,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
            <span style={{fontSize:'1.1rem'}}>👤</span>
            <span style={{fontWeight:'bold',color:'#e2e8f0',fontSize:'0.85rem'}}>{msg.agent_name}</span>
            <span style={{
              fontSize:'0.7rem',
              padding:'2px 6px',
              borderRadius:'999px',
              background: msg.action_type === '発言' ? 'rgba(14,165,233,0.15)' : 'rgba(124,58,237,0.15)',
              color: msg.action_type === '発言' ? '#0ea5e9' : '#7c3aed',
            }}>{msg.action_type}</span>
            <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'#94a3b8'}}>T{msg.turn}</span>
          </div>
          <p style={{color:'#cbd5e1',fontSize:'0.82rem',lineHeight:'1.5',margin:0}}>{msg.content}</p>
          <p style={{color:'#64748b',fontSize:'0.72rem',margin:'4px 0 0',fontStyle:'italic'}}>感情: {msg.emotional_state}</p>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
