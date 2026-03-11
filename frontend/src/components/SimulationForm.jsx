import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import * as d3 from 'd3'

// プリセットシナリオ
const PRESETS = [
  {
    icon: '',
    label: 'PR炎上予測',
    text: '大手IT企業が全社員にオフィス出勤を週5日義務化する方針を発表した。社員の間で賛否が分かれている。',
  },
  {
    icon: '',
    label: '市場反応分析',
    text: '政府がAI生成コンテンツに対する厳格な規制法案を提出した。クリエイター、テック企業、消費者の間で激しい議論が起きている。',
  },
  {
    icon: '',
    label: '政策波及予測',
    text: '市が2030年までにガソリン車の市内乗り入れを禁止する条例案を発表した。住民、事業者、環境団体がそれぞれの立場から反応している。',
  },
  {
    icon: '',
    label: 'Xポスト反応',
    badge: 'NEW',
    text: 'Xに投稿するポストの反応をシミュレートします。\n投稿内容: [ここにポスト文面]\n想定フォロワー層: ビジネス・AI・スタートアップ系アカウント（フォロワー5000人）\nシミュレート内容: いいね・リツイート・返信のトーン・炎上リスク',
  },
]

const COLORS = ['#7c3aed','#0ea5e9','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#f43f5e']

/** Zoomable NetworkGraph (D3) */
function NetworkGraph({ messages, onNodeClick }) {
  const svgRef = useRef(null)

  const agents = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const m of messages) {
      if (!seen.has(m.agent_name)) {
        seen.add(m.agent_name)
        list.push(m.agent_name)
      }
    }
    return list
  }, [messages.length])

  const positions = useMemo(() => {
    if (agents.length === 0) return {}
    const pos = {}
    const innerCount = Math.min(8, agents.length)
    const outerCount = agents.length - innerCount
    const cx = 200, cy = 200
    agents.forEach((name, i) => {
      if (i < innerCount) {
        const a = (i / innerCount) * 2 * Math.PI - Math.PI / 2
        pos[name] = { x: cx + 80 * Math.cos(a), y: cy + 80 * Math.sin(a) }
      } else {
        const j = i - innerCount
        const a = (j / Math.max(outerCount, 1)) * 2 * Math.PI - Math.PI / 2
        pos[name] = { x: cx + 160 * Math.cos(a), y: cy + 160 * Math.sin(a) }
      }
    })
    return pos
  }, [agents])

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const g = svg.select('g.zoom-container')
    const zoom = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (e) => g.attr('transform', e.transform))
    svg.call(zoom)
    return () => svg.on('.zoom', null)
  }, [])

  const recentEdges = messages.slice(-20)
  const latest = messages[messages.length - 1]?.agent_name

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 400 400" style={{ cursor: 'grab' }}>
        <defs>
          <marker id="arrow" viewBox="0 -5 10 10" refX="20" refY="0" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,-5L10,0L0,5" fill="rgba(124,58,237,0.4)" />
          </marker>
        </defs>
        <g className="zoom-container">
          {recentEdges.map((msg, i) => {
            const from = positions[msg.agent_name]
            const targets = agents.filter(a => a !== msg.agent_name)
            if (!from || targets.length === 0) return null
            const to = positions[targets[i % targets.length]]
            if (!to) return null
            const opacity = 0.1 + (i / recentEdges.length) * 0.3
            return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={`rgba(124,58,237,${opacity})`} strokeWidth="1" markerEnd="url(#arrow)" />
          })}
          {agents.map((name, i) => {
            const pos = positions[name]
            if (!pos) return null
            const color = COLORS[i % COLORS.length]
            const isActive = name === latest
            return (
              <g key={name} style={{ cursor: 'pointer' }} onClick={() => onNodeClick && onNodeClick(name)}>
                {isActive && <circle cx={pos.x} cy={pos.y} r="24" fill="none" stroke={color} strokeWidth="2" opacity="0.5" style={{ animation: 'pulse 1s infinite' }} />}
                <circle cx={pos.x} cy={pos.y} r="16" fill={color} opacity="0.9" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{name.slice(0, 3)}</text>
                <text x={pos.x} y={pos.y + 26} textAnchor="middle" fill={color} fontSize="9" opacity="0.8">{name.slice(0, 6)}</text>
              </g>
            )
          })}
        </g>
        {agents.length === 0 && (
          <text x="50%" y="50%" textAnchor="middle" fill="#94a3b8" fontSize="12">エージェント待機中...</text>
        )}
      </svg>
    </div>
  )
}

/**
 * 新規シミュレーションフォーム（MiroFish風）
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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: isRunning ? "hidden" : "auto" }}>
      {!isRunning && (
        <div style={{ textAlign: "center", marginBottom: "32px", padding: "0 24px" }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">AIエージェントが社会をシミュレートする</span>
          </h2>
          <p className="text-xl text-[#0ea5e9]">未来予測エンジン</p>
        </div>
      )}

      <div className={isRunning ? "" : "flex flex-col lg:flex-row gap-6"} style={isRunning ? { display: "flex", flexDirection: "row", gap: "16px", flex: 1, minHeight: 0, overflow: "hidden" } : {}}>
        {/* 左: 入力パネル */}
        <form onSubmit={handleSubmit} className={isRunning ? "" : "lg:w-5/12 space-y-5"} style={isRunning ? { width: "280px", flexShrink: 0, overflowY: "auto", padding: "8px" } : {}}>
          <div>
            <label className="text-sm text-[#94a3b8] mb-2 block">シナリオ入力</label>
            <textarea
              value={seed}
              onChange={e => setSeed(e.target.value)}
              rows={5}
              placeholder="シミュレーションのシナリオを入力してください..."
              className="w-full bg-[#0d1b2e] border border-[#112240] rounded-xl p-4 text-sm text-[#e2e8f0] focus:outline-none textarea-glow resize-none transition-all duration-300"
            />
            {/* ファイルアップロード */}
            <div style={{marginTop:'8px'}}>
              <label style={{
                display:'inline-flex',alignItems:'center',gap:'8px',
                padding:'6px 14px',borderRadius:'8px',
                border:'1px dashed rgba(124,58,237,0.5)',
                color:'#94a3b8',fontSize:'0.8rem',cursor:'pointer',
                background:'rgba(124,58,237,0.05)',
              }}>
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  style={{display:'none'}}
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    const form = new FormData()
                    form.append('file', file)
                    try {
                      const res = await fetch(`${api}/upload`, {method:'POST', body: form})
                      const data = await res.json()
                      setSeed(data.text)
                    } catch {}
                  }}
                />
                ファイルを読み込む (.txt / .md / .pdf)
              </label>
            </div>
          </div>

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

          <div>
            <label className="text-sm text-[#94a3b8] mb-2 flex justify-between">
              <span>エージェント数</span>
              <span className="text-[#7c3aed] font-bold text-base">{agentCount}</span>
            </label>
            <input
              type="range" min={5} max={1000} value={agentCount}
              onChange={e => setAgentCount(Number(e.target.value))}
              className="w-full accent-[#7c3aed] h-2"
            />
            <div className="flex justify-between text-xs text-[#94a3b8] mt-1">
              <span>5</span><span>1000</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#94a3b8] mb-2 flex justify-between">
              <span>ターン数</span>
              <span className="text-[#0ea5e9] font-bold text-base">{turnCount}</span>
            </label>
            <input
              type="range" min={3} max={50} value={turnCount}
              onChange={e => setTurnCount(Number(e.target.value))}
              className="w-full accent-[#0ea5e9] h-2"
            />
            <div className="flex justify-between text-xs text-[#94a3b8] mt-1">
              <span>3</span><span>50</span>
            </div>
          </div>

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
              <span>シミュレーション開始</span>
            )}
          </button>
        </form>

        {/* 右: プレビューパネル */}
        <div className={isRunning ? "" : "lg:w-7/12"} style={isRunning
          ? { flex: 1, minHeight: 0, minWidth: 0, background: "#0d1b2e", border: "1px solid #112240", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }
          : { background: "#0d1b2e", border: "1px solid #112240", borderRadius: "12px", padding: "24px", minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }
        }>
          {!loading && !runStatus && <PreviewIdle />}
          {loading && !runStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, gap: '16px', padding: '32px' }}>
              <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <p style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 'bold' }}>シミュレーションを開始しています...</p>
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

function PreviewIdle() {
  return (
    <div className="text-center">
      <div className="relative mb-6">
        <img src="/prism/logo.png" alt="Prism" style={{ width: "72px", height: "72px", objectFit: "contain", marginBottom: "16px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="particle absolute text-[#7c3aed] text-xs" style={{ left: `${(i - 2) * 30}px`, animationDelay: `${i * 0.5}s` }}></span>
          ))}
        </div>
      </div>
      <p className="text-[#94a3b8] text-lg">シナリオを入力して開始してください</p>
      <p className="text-[#94a3b8]/60 text-sm mt-2">AIエージェントが社会の反応をシミュレートします</p>
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

/** 実行中のプレビュー（MiroFish風: NetworkGraph + チャット + インタビュータブ） */
function PreviewRunning({ simId, api, runStatus }) {
  const [messages, setMessages] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [rightTab, setRightTab] = useState('chat') // 'chat' | 'interview'
  const [interviewQ, setInterviewQ] = useState('')
  const [interviewHistory, setInterviewHistory] = useState([])
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [injectText, setInjectText] = useState('')
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

  const sendInterview = async () => {
    if (!interviewQ.trim() || !selectedAgent || interviewLoading) return
    setInterviewLoading(true)
    const q = interviewQ
    setInterviewQ('')
    setInterviewHistory(prev => [...prev, { role: 'user', text: q }])
    try {
      const res = await fetch(`${api}/simulations/${simId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: selectedAgent, question: q }),
      })
      const data = await res.json()
      setInterviewHistory(prev => [...prev, { role: 'agent', text: data.response || data.error || 'エラー' }])
    } catch (e) {
      setInterviewHistory(prev => [...prev, { role: 'agent', text: '通信エラー' }])
    }
    setInterviewLoading(false)
  }

  // Loading state
  if (!simId || messages.length === 0) {
    const statusText = phase === 'starting' ? 'シミュレーションを開始しています...'
      : phase === 'generating' ? 'エージェントを生成中...'
      : `ターン ${turn}/${totalTurns} 実行中...`
    const progress = phase === 'starting' ? 5
      : phase === 'generating' ? 15
      : Math.min(15 + ((turn || 0) / (totalTurns || 1)) * 85, 95)

    return (
      <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, marginBottom: '24px' }} />
        <p style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{statusText}</p>
        <div style={{ width: '100%', maxWidth: '320px', background: '#112240', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
          <div className="progress-bar" style={{ height: '100%', borderRadius: '9999px', width: `${progress}%`, transition: 'width 1s ease' }} />
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '12px' }}>{Math.round(progress)}% 完了</p>
      </div>
    )
  }

  const uniqueAgents = [...new Set(messages.map(m => m.agent_name))]
  const currentTurn = messages[messages.length - 1]?.turn || 0
  const agentMessages = selectedAgent ? messages.filter(m => m.agent_name === selectedAgent) : []

  return (
    <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#050a14', borderRadius: '12px', overflow: 'hidden' }}>
      {/* ステータスバー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px', background: 'rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(124,58,237,0.2)', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 'bold' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          実行中
        </span>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>ラウンド <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>{currentTurn}</span>/{totalTurns || '?'}</span>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>エージェント <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{uniqueAgents.length}</span>人</span>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>イベント <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>{messages.length}</span>件</span>
      </div>

      {/* メインエリア */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* 左: NetworkGraph + 選択エージェント情報 */}
        <div style={{ width: '45%', minWidth: '250px', flexShrink: 0, borderRight: '1px solid rgba(124,58,237,0.15)', display: 'flex', flexDirection: 'column' }}>
          {/* グラフ */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <NetworkGraph messages={messages} onNodeClick={(name) => { setSelectedAgent(name); setInterviewHistory([]) }} />
          </div>
          {/* 選択エージェント詳細パネル */}
          <div style={{ height: '110px', flexShrink: 0, borderTop: '1px solid rgba(124,58,237,0.15)', padding: '8px 12px', overflowY: 'auto', background: 'rgba(13,27,46,0.8)' }}>
            {selectedAgent ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[uniqueAgents.indexOf(selectedAgent) % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '0.85rem' }}>{selectedAgent}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.7rem', marginLeft: 'auto' }}>発言 {agentMessages.length}件</span>
                </div>
                {/* 直近の発言リスト（最新3件） */}
                {messages.filter(m => m.agent_name === selectedAgent).slice(-3).map((m, i) => (
                  <div key={i} style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: '1.4', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    [T{m.turn}] {parseContent(m.content)?.slice(0, 60)}...
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: '20px' }}>
                グラフのノードをクリックするとエージェントの詳細が表示されます
              </p>
            )}
          </div>
          {/* 変数注入 */}
          <div style={{padding:'8px',borderTop:'1px solid rgba(124,58,237,0.15)',flexShrink:0}}>
            <div style={{color:'#94a3b8',fontSize:'0.7rem',marginBottom:'4px',fontWeight:'bold'}}>変数注入（神の視点）</div>
            <div style={{display:'flex',gap:'4px'}}>
              <input
                placeholder="新しい出来事を入力..."
                value={injectText}
                onChange={e => setInjectText(e.target.value)}
                style={{flex:1,background:'#0d1b2e',border:'1px solid rgba(124,58,237,0.3)',borderRadius:'6px',padding:'4px 8px',color:'#e2e8f0',fontSize:'0.75rem',outline:'none'}}
              />
              <button
                onClick={async () => {
                  if (!injectText.trim() || !runStatus?.simId) return
                  await fetch(`${api}/simulations/${runStatus.simId}/inject`, {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({event: injectText})
                  })
                  setInjectText('')
                }}
                style={{background:'rgba(124,58,237,0.3)',border:'none',borderRadius:'6px',padding:'4px 10px',color:'white',fontSize:'0.75rem',cursor:'pointer'}}
              >注入</button>
            </div>
          </div>
        </div>

        {/* 右: タブ切替 (チャット / インタビュー) */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* タブバー */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(124,58,237,0.15)', flexShrink: 0 }}>
            {[{ id: 'chat', label: ' 会話ログ' }, { id: 'interview', label: ' インタビュー' }].map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)} style={{
                padding: '6px 16px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                background: rightTab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: rightTab === t.id ? '#e2e8f0' : '#94a3b8',
                borderBottom: rightTab === t.id ? '2px solid #7c3aed' : '2px solid transparent',
              }}>{t.label}</button>
            ))}
          </div>

          {/* チャットタブ */}
          {rightTab === 'chat' && (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: '12px', padding: '10px 14px', animation: 'fadeIn 0.3s ease', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1rem' }}></span>
                    <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '0.82rem' }}>{msg.agent_name}</span>
                    <span style={{
                      fontSize: '0.68rem', padding: '2px 6px', borderRadius: '999px',
                      background: msg.action_type === '発言' ? 'rgba(14,165,233,0.15)' : 'rgba(124,58,237,0.15)',
                      color: msg.action_type === '発言' ? '#0ea5e9' : '#7c3aed',
                    }}>{msg.action_type}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#94a3b8' }}>T{msg.turn}</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: '1.5', margin: 0 }}>{parseContent(msg.content)}</p>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '4px 0 0', fontStyle: 'italic' }}>感情: {msg.emotional_state}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* インタビュータブ */}
          {rightTab === 'interview' && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '12px' }}>
              {!selectedAgent ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>左のグラフからエージェントを選択してください</p>
                </div>
              ) : (
                <>
                  <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>
                     {selectedAgent} にインタビュー
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                    {interviewHistory.map((h, i) => (
                      <div key={i} style={{
                        padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', maxWidth: '85%',
                        alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start',
                        background: h.role === 'user' ? 'rgba(14,165,233,0.2)' : 'rgba(124,58,237,0.15)',
                        color: '#e2e8f0',
                      }}>{h.text}</div>
                    ))}
                    {interviewLoading && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>回答生成中...</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <input
                      value={interviewQ}
                      onChange={e => setInterviewQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendInterview()}
                      placeholder="質問を入力..."
                      style={{
                        flex: 1, background: '#112240', border: '1px solid #112240', borderRadius: '8px',
                        padding: '8px 12px', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none',
                      }}
                    />
                    <button onClick={sendInterview} disabled={interviewLoading} style={{
                      background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px',
                      padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', opacity: interviewLoading ? 0.5 : 1,
                    }}>送信</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 下部: ターミナルログ */}
      <div style={{ height: '80px', flexShrink: 0, background: '#000', borderTop: '1px solid rgba(0,255,65,0.2)', overflowY: 'auto', padding: '8px 12px', fontFamily: 'monospace' }}>
        {messages.slice(-15).map((msg, i) => (
          <div key={i} style={{ color: '#00ff41', fontSize: '0.72rem', lineHeight: '1.6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            &gt; [T{msg.turn}] {msg.agent_name}: {msg.content?.slice(0, 80)}{msg.content?.length > 80 ? '...' : ''}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
