import { useState, useEffect } from 'react'
import SimulationForm from './components/SimulationForm'
import AgentList from './components/AgentList'
import SimulationLog from './components/SimulationLog'
import ReportView from './components/ReportView'

const API = 'http://localhost:8000/api'

// タブ定義
const TABS = [
  { id: 'home', label: '🏠 新規シミュレーション' },
  { id: 'list', label: '📋 シミュレーション一覧' },
  { id: 'detail', label: '🔍 詳細' },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [simulations, setSimulations] = useState([])
  const [selectedSim, setSelectedSim] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

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
      setSelectedSim(id)
      setTab('detail')
    } catch (e) {
      console.error('詳細取得エラー:', e)
    }
  }

  // シミュレーション開始
  const startSimulation = async (seed, agentCount, turnCount) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, agent_count: agentCount, turn_count: turnCount }),
      })
      const data = await res.json()
      // ポーリングで完了を待つ
      const simId = data.simulation_id
      const poll = setInterval(async () => {
        const r = await fetch(`${API}/simulations`)
        const sims = await r.json()
        const sim = sims.find(s => s.id === simId)
        if (sim && sim.status !== 'created' && sim.status !== 'running') {
          clearInterval(poll)
          setLoading(false)
          fetchSimulations()
          fetchDetail(simId)
        }
        setSimulations(sims)
      }, 3000)
    } catch (e) {
      console.error('シミュレーション開始エラー:', e)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSimulations()
  }, [])

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="border-b border-[#30363d] px-6 py-4">
        <h1 className="text-2xl font-bold">
          <span className="accent">🔮 Prism</span>
          <span className="text-[#8b949e] text-lg ml-3">群体知能シミュレーションエンジン</span>
        </h1>
      </header>

      {/* タブ */}
      <nav className="flex border-b border-[#30363d] px-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              if (t.id === 'list') fetchSimulations()
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#8b5cf6] text-white'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* コンテンツ */}
      <main className="p-6 max-w-7xl mx-auto">
        {tab === 'home' && (
          <SimulationForm onStart={startSimulation} loading={loading} />
        )}

        {tab === 'list' && (
          <div>
            <h2 className="text-xl font-bold mb-4">シミュレーション一覧</h2>
            {simulations.length === 0 ? (
              <p className="text-[#8b949e]">まだシミュレーションがありません。</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {simulations.map(sim => (
                  <div
                    key={sim.id}
                    onClick={() => fetchDetail(sim.id)}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 cursor-pointer hover:border-[#8b5cf6] transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">#{sim.id}</span>
                      <StatusBadge status={sim.status} />
                    </div>
                    <p className="text-sm text-[#8b949e] mb-2 line-clamp-2">{sim.seed}</p>
                    <div className="text-xs text-[#8b949e] flex gap-4">
                      <span>👥 {sim.agent_count}人</span>
                      <span>🔄 {sim.turn_count}ターン</span>
                    </div>
                    <div className="text-xs text-[#8b949e] mt-1">
                      {sim.created_at?.slice(0, 19).replace('T', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'detail' && detail && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              シミュレーション #{detail.simulation.id}
              <StatusBadge status={detail.simulation.status} className="ml-3" />
            </h2>
            <p className="text-[#8b949e] mb-4 text-sm">{detail.simulation.seed}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左パネル: エージェント一覧 */}
              <div className="lg:col-span-1">
                <AgentList agents={detail.agents} />
              </div>
              {/* 右パネル: 対話ログ */}
              <div className="lg:col-span-2">
                <SimulationLog interactions={detail.interactions} />
              </div>
            </div>

            {/* レポート */}
            <div className="mt-6">
              <ReportView simId={detail.simulation.id} status={detail.simulation.status} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ステータスバッジコンポーネント
function StatusBadge({ status, className = '' }) {
  const colors = {
    created: 'bg-[#30363d] text-[#8b949e]',
    running: 'bg-yellow-900/50 text-yellow-300',
    completed: 'bg-green-900/50 text-green-300',
    failed: 'bg-red-900/50 text-red-300',
  }
  const labels = {
    created: '作成済み',
    running: '実行中',
    completed: '完了',
    failed: '失敗',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || ''} ${className}`}>
      {labels[status] || status}
    </span>
  )
}
