import { useState, useEffect } from 'react'
import SimulationForm from './components/SimulationForm'
import SimulationList from './components/SimulationList'
import SimulationDetail from './components/SimulationDetail'

// API ベースURL
const API_BASE = import.meta.env.VITE_API_URL || 'https://prism-n5z8.onrender.com'
const API = `${API_BASE}/api`

// タブ定義
const TABS = [
  { id: 'home', label: '🔮 新規シミュレーション' },
  { id: 'list', label: '📋 シミュレーション一覧' },
  { id: 'detail', label: '🔍 詳細' },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [simulations, setSimulations] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  // シミュレーション実行中のステータス表示用
  const [runStatus, setRunStatus] = useState(null) // null | { phase, turn, totalTurns, simId }

  // シミュレーション一覧を取得
  const fetchSimulations = async () => {
    try {
      const res = await fetch(`${API}/simulations`)
      const data = await res.json()
      setSimulations(data)
    } catch (e) {
      console.error('一覧取得エラー:', e)
    }
  }

  // 詳細を取得
  const fetchDetail = async (id) => {
    try {
      const res = await fetch(`${API}/simulations/${id}`)
      const data = await res.json()
      setDetail(data)
      setTab('detail')
    } catch (e) {
      console.error('詳細取得エラー:', e)
    }
  }

  // シミュレーション開始
  const startSimulation = async (seed, agentCount, turnCount) => {
    setLoading(true)
    setRunStatus({ phase: 'starting', turn: 0, totalTurns: turnCount, simId: null })
    try {
      const res = await fetch(`${API}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, agent_count: agentCount, turn_count: turnCount }),
      })
      const data = await res.json()
      const simId = data.simulation_id
      setRunStatus({ phase: 'generating', turn: 0, totalTurns: turnCount, simId })

      // ポーリングで完了を待つ
      const startTime = Date.now()
      const poll = setInterval(async () => {
        try {
          const r = await fetch(`${API}/simulations`)
          const sims = await r.json()
          const sim = sims.find(s => s.id === simId)
          setSimulations(sims)

          if (sim) {
            if (sim.status === 'running') {
              // ターン進捗を推定（経過時間ベース）
              const elapsed = (Date.now() - startTime) / 1000
              const estimatedTurn = Math.min(Math.floor(elapsed / 10) + 1, turnCount)
              setRunStatus({ phase: 'running', turn: estimatedTurn, totalTurns: turnCount, simId })
            } else if (sim.status === 'completed' || sim.status === 'failed') {
              clearInterval(poll)
              setLoading(false)
              setRunStatus(null)
              fetchSimulations()
              fetchDetail(simId)
            }
          }
        } catch (e) {
          // ポーリングエラーは無視
        }
      }, 3000)
    } catch (e) {
      console.error('シミュレーション開始エラー:', e)
      setLoading(false)
      setRunStatus(null)
    }
  }

  useEffect(() => {
    fetchSimulations()
  }, [])

  return (
    <div className="min-h-screen bg-[#050a14]">
      {/* ヘッダー（固定） */}
      <header style={{position:'sticky',top:0,zIndex:50,background:'rgba(5,10,20,0.92)',backdropFilter:'blur(8px)',borderBottom:'1px solid rgba(124,58,237,0.2)',padding:'10px 12px'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0}}>
            <img src="/prism/logo.png" alt="Prism" style={{width:'26px',height:'26px',objectFit:'contain',flexShrink:0}} />
            <h1 style={{fontSize:'1.1rem',fontWeight:'bold',background:'linear-gradient(135deg,#7c3aed,#0ea5e9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',whiteSpace:'nowrap'}}>Prism</h1>
            <span style={{color:'#94a3b8',fontSize:'0.7rem',display:'none'}} className="sm-show">群体知能シミュレーションエンジン</span>
          </div>
          <a href="https://github.com/rezent011-sketch/prism" target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',gap:'4px',color:'#94a3b8',textDecoration:'none',fontSize:'0.8rem',flexShrink:0}}>
            <svg style={{width:'18px',height:'18px',flexShrink:0}} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
      </header>

      {/* タブナビゲーション */}
      <nav style={{borderBottom:"1px solid #112240",padding:"0 8px",background:"rgba(13,27,46,0.5)",overflowX:"auto",display:"flex"}}>
        <div style={{display:"flex",minWidth:"max-content"}}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                if (t.id === 'list') fetchSimulations()
              }}
              style={{padding:'8px 14px',fontSize:'0.78rem',fontWeight:500,whiteSpace:'nowrap',borderBottom:'2px solid',cursor:'pointer',background:'none',transition:'all 0.2s'}} className={` transition-all duration-300 ${
                tab === t.id
                  ? 'border-[#7c3aed] text-[#e2e8f0] bg-[#7c3aed]/10'
                  : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#112240]/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main style={{padding:"12px 8px",maxWidth:"1280px",margin:"0 auto"}}>
        <div className="fade-in" key={tab}>
          {tab === 'home' && (
            <SimulationForm
              onStart={startSimulation}
              loading={loading}
              runStatus={runStatus}
            />
          )}
          {tab === 'list' && (
            <SimulationList
              simulations={simulations}
              onSelect={fetchDetail}
            />
          )}
          {tab === 'detail' && detail && (
            <SimulationDetail detail={detail} api={API} />
          )}
          {tab === 'detail' && !detail && (
            <div className="text-center text-[#94a3b8] py-20">
              <p className="text-lg">シミュレーションを選択してください</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
