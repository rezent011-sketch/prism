import { useState, useRef, useEffect, useCallback } from 'react'

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

  const isRunning = loading && runStatus

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,overflow:isRunning ? "hidden" : "auto"}}>
      {/* ヒーロー文言 */}
      {!isRunning && (
      <div style={{textAlign:"center",marginBottom:"32px",padding:"0 24px"}}>
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">AIエージェントが社会をシミュレートする</span>
        </h2>
        <p className="text-xl text-[#0ea5e9]">未来予測エンジン</p>
      </div>
      )}

      {/* 2カラムレイアウト */}
      <div className={isRunning ? "" : "flex flex-col lg:flex-row gap-6"} style={isRunning ? {display:"flex",flexDirection:"row",gap:"16px",flex:1,minHeight:0,overflow:"hidden"} : {}}>
        {/* 左: 入力パネル (40%) */}
        <form onSubmit={handleSubmit} className={isRunning ? "" : "lg:w-5/12 space-y-5"} style={isRunning ? {width:"280px",flexShrink:0,overflowY:"auto",padding:"8px"} : {}}>
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
        <div className={isRunning ? "" : "lg:w-7/12"} style={isRunning
          ? {flex:1,minHeight:0,minWidth:0,background:"#0d1b2e",border:"1px solid #112240",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column"}
          : {background:"#0d1b2e",border:"1px solid #112240",borderRadius:"12px",padding:"24px",minHeight:"400px",display:"flex",alignItems:"center",justifyContent:"center"}
        }>
          {!loading && !runStatus && (
            <PreviewIdle />
          )}
          {loading && !runStatus && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,minHeight:0,gap:'16px',padding:'32px'}}>
              <div className="spinner" style={{width:48,height:48,borderWidth:4}} />
              <p style={{color:'#e2e8f0',fontSize:'1rem',fontWeight:'bold'}}>シミュレーションを開始しています...</p>
            </div>
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

/** 軽量版エージェントグラフ（D3不使用） */
function AgentGraph({ messages }) {
  const agents = []
  const seen = new Set()
  for (const msg of messages) {
    if (!seen.has(msg.agent_name)) {
      seen.add(msg.agent_name)
      agents.push(msg.agent_name)
      if (agents.length >= 12) break
    }
  }

  const cx = 140, cy = 140, r = 100
  const positions = agents.map((name, i) => {
    const angle = (i / agents.length) * 2 * Math.PI - Math.PI / 2
    return { name, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  const recentMessages = messages.slice(-10)
  const COLORS = ['#7c3aed','#0ea5e9','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#f43f5e']

  if (agents.length === 0) {
    return (
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#94a3b8',fontSize:'0.75rem'}}>エージェント待機中...</p>
      </div>
    )
  }

  return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <svg width="100%" height="100%" viewBox="0 0 280 280" style={{maxWidth:'280px',maxHeight:'280px'}}>
      {recentMessages.map((msg, i) => {
        const fromIdx = agents.indexOf(msg.agent_name)
        if (fromIdx === -1) return null
        const from = positions[fromIdx]
        const toIdx = (fromIdx + 1) % positions.length
        const to = positions[toIdx]
        return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="rgba(124,58,237,0.3)" strokeWidth="1" />
      })}
      {positions.map((pos, i) => {
        const isLatest = messages.length > 0 && messages[messages.length - 1].agent_name === pos.name
        const color = COLORS[i % COLORS.length]
        return (
          <g key={pos.name}>
            {isLatest && <circle cx={pos.x} cy={pos.y} r="24" fill="none" stroke={color} strokeWidth="2" opacity="0.6" style={{animation:'pulse 1s ease-in-out infinite'}} />}
            <circle cx={pos.x} cy={pos.y} r="18" fill={color} opacity="0.9" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{pos.name.slice(0, 3)}</text>
          </g>
        )
      })}
    </svg>
    </div>
  )
}

function parseContent(raw) {
  if (typeof raw !== 'string') return String(raw || '')
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      return parsed.content || trimmed
    } catch {}
  }
  return raw
}

/** 実行中のプレビュー表示（MiroFish風UI） */
function PreviewRunning({ simId, api, runStatus }) {
  const [messages, setMessages] = useState([])
  const chatEndRef = useRef(null)
  const logEndRef = useRef(null)
  const { phase, turn, totalTurns } = runStatus || {}

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Loading state
  if (!simId || messages.length === 0) {
    const statusText = phase === 'starting' ? 'シミュレーションを開始しています...'
      : phase === 'generating' ? 'エージェントを生成中...'
      : `ターン ${turn}/${totalTurns} 実行中...`
    const progress = phase === 'starting' ? 5
      : phase === 'generating' ? 15
      : Math.min(15 + ((turn || 0) / (totalTurns || 1)) * 85, 95)

    return (
      <div style={{width:'100%',flex:1,minHeight:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px'}}>
        <div className="spinner" style={{width:48,height:48,borderWidth:4,marginBottom:'24px'}} />
        <p style={{color:'#e2e8f0',fontSize:'1.1rem',fontWeight:'bold',marginBottom:'16px',textAlign:'center'}}>{statusText}</p>
        <div style={{width:'100%',maxWidth:'320px',background:'#112240',borderRadius:'9999px',height:'12px',overflow:'hidden'}}>
          <div className="progress-bar" style={{height:'100%',borderRadius:'9999px',width:`${progress}%`,transition:'width 1s ease'}} />
        </div>
        <p style={{color:'#94a3b8',fontSize:'0.85rem',marginTop:'12px'}}>{Math.round(progress)}% 完了</p>
      </div>
    )
  }

  const uniqueAgents = [...new Set(messages.map(m => m.agent_name))]
  const currentTurn = messages[messages.length - 1]?.turn || 0

  return (
    <div style={{width:'100%',flex:1,minHeight:0,display:'flex',flexDirection:'column',background:'#050a14',borderRadius:'12px',overflow:'hidden'}}>
      {/* ステータスバー */}
      <div style={{display:'flex',alignItems:'center',gap:'16px',padding:'8px 16px',background:'rgba(124,58,237,0.1)',borderBottom:'1px solid rgba(124,58,237,0.2)',flexShrink:0,flexWrap:'wrap'}}>
        <span style={{display:'flex',alignItems:'center',gap:'6px',color:'#0ea5e9',fontSize:'0.8rem',fontWeight:'bold'}}>
          <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#0ea5e9',display:'inline-block',animation:'pulse 1s infinite'}} />
          実行中
        </span>
        <span style={{color:'#94a3b8',fontSize:'0.75rem'}}>ラウンド <span style={{color:'#7c3aed',fontWeight:'bold'}}>{currentTurn}</span>/{totalTurns || '?'}</span>
        <span style={{color:'#94a3b8',fontSize:'0.75rem'}}>エージェント <span style={{color:'#0ea5e9',fontWeight:'bold'}}>{uniqueAgents.length}</span>人</span>
        <span style={{color:'#94a3b8',fontSize:'0.75rem'}}>イベント <span style={{color:'#7c3aed',fontWeight:'bold'}}>{messages.length}</span>件</span>
      </div>

      {/* メインエリア: D3グラフ + チャット */}
      <div style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
        {/* 左: D3ノードグラフ */}
        <div style={{width:'280px',minWidth:'220px',flexShrink:0,borderRight:'1px solid rgba(124,58,237,0.15)',padding:'8px',display:'flex',flexDirection:'column'}}>
          <AgentGraph messages={messages} />
        </div>

        {/* 右: チャットバブル */}
        <div style={{flex:1,minHeight:0,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
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
                <span style={{fontSize:'1rem'}}>👤</span>
                <span style={{fontWeight:'bold',color:'#e2e8f0',fontSize:'0.82rem'}}>{msg.agent_name}</span>
                <span style={{
                  fontSize:'0.68rem',padding:'2px 6px',borderRadius:'999px',
                  background: msg.action_type === '発言' ? 'rgba(14,165,233,0.15)' : 'rgba(124,58,237,0.15)',
                  color: msg.action_type === '発言' ? '#0ea5e9' : '#7c3aed',
                }}>{msg.action_type}</span>
                <span style={{marginLeft:'auto',fontSize:'0.68rem',color:'#94a3b8'}}>T{msg.turn}</span>
              </div>
              <p style={{color:'#cbd5e1',fontSize:'0.8rem',lineHeight:'1.5',margin:0}}>{parseContent(msg.content)}</p>
              <p style={{color:'#64748b',fontSize:'0.7rem',margin:'4px 0 0',fontStyle:'italic'}}>感情: {msg.emotional_state}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 下部: ターミナルログ */}
      <div style={{height:'100px',flexShrink:0,background:'#000',borderTop:'1px solid rgba(0,255,65,0.2)',overflowY:'auto',padding:'8px 12px',fontFamily:'monospace'}}>
        {messages.map((msg, i) => (
          <div key={i} style={{color:'#00ff41',fontSize:'0.72rem',lineHeight:'1.6',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            &gt; [T{msg.turn}] {msg.agent_name}: {msg.content?.slice(0, 80)}{msg.content?.length > 80 ? '...' : ''}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
