import { useState } from 'react'
import AgentList from './AgentList'
import SimulationLog from './SimulationLog'
import EmotionChart from './EmotionChart'
import RelationMap from './RelationMap'
import ReportView from './ReportView'

/**
 * シミュレーション詳細ビュー
 */
export default function SimulationDetail({ detail, api }) {
  const { simulation, agents, interactions } = detail

  const statusConfig = {
    created: { bg: 'bg-[#94a3b8]/20', text: 'text-[#94a3b8]', label: '作成済み' },
    running: { bg: 'bg-[#0ea5e9]/20', text: 'text-[#0ea5e9]', label: '実行中' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '完了' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: '失敗' },
  }
  const sc = statusConfig[simulation.status] || statusConfig.created

  return (
    <div className="space-y-6">
      {/* シナリオ概要カード */}
      <div className="bg-[#112240] border border-[#112240] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-bold gradient-text">
            シミュレーション #{simulation.id}
          </h2>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
            {sc.label}
          </span>
        </div>
        <p className="text-[#e2e8f0] text-sm leading-relaxed">{simulation.seed}</p>
        <div className="flex gap-4 mt-3 text-xs text-[#94a3b8]">
          <span> {simulation.agent_count}人</span>
          <span> {simulation.turn_count}ターン</span>
          <span> {simulation.created_at?.slice(0, 19).replace('T', ' ')}</span>
        </div>
      </div>

      {/* 失敗時の詳細エラーメッセージ */}
      {simulation.status === 'failed' && (
        <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
          <div style={{color:'#f87171',fontWeight:'bold',marginBottom:'8px'}}>シミュレーション失敗</div>
          <div style={{color:'#94a3b8',fontSize:'0.85rem'}}>
            シミュレーションの実行中にエラーが発生しました。<br/>
            エージェント数を減らすか、シナリオを短くして再試行してください。
          </div>
        </div>
      )}

      {/* 2カラム: エージェント + 対話ログ */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[35%]">
          <AgentList agents={agents} />
        </div>
        <div className="lg:w-[65%]">
          <SimulationLog interactions={interactions} totalTurns={simulation.turn_count} />
        </div>
      </div>

      <EmotionChart simId={simulation.id} api={api} />
      <RelationMap simId={simulation.id} api={api} />
      <ReportView simId={simulation.id} status={simulation.status} api={api} />

      {/* インタラクティブツール */}
      {simulation.status === 'completed' && (
        <InteractiveTools simId={simulation.id} agents={agents} api={api} />
      )}
    </div>
  )
}

function InteractiveTools({ simId, agents, api }) {
  const [tab, setTab] = useState('report_chat')
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.name || '')
  const [question, setQuestion] = useState('')
  const [interviewHistory, setInterviewHistory] = useState([])
  const [surveyResults, setSurveyResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // レポートチャット state
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const sendReportChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const q = chatInput
    setChatInput('')
    setChatLoading(true)
    setChatHistory(h => [...h, { role: 'user', content: q }])
    try {
      const res = await fetch(`${api}/simulations/${simId}/report_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: chatHistory }),
      })
      const data = await res.json()
      setChatHistory(h => [...h, { role: 'assistant', content: data.response }])
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', content: '通信エラーが発生しました' }])
    } finally {
      setChatLoading(false)
    }
  }

  const sendInterview = async () => {
    if (!question.trim() || !selectedAgent || loading) return
    setLoading(true)
    const q = question
    setQuestion('')
    setInterviewHistory(prev => [...prev, { role: 'user', text: q }])
    try {
      const res = await fetch(`${api}/simulations/${simId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: selectedAgent, question: q }),
      })
      const data = await res.json()
      setInterviewHistory(prev => [...prev, { role: 'agent', agent: selectedAgent, text: data.response || data.error || 'エラー' }])
    } catch {
      setInterviewHistory(prev => [...prev, { role: 'agent', agent: selectedAgent, text: '通信エラー' }])
    }
    setLoading(false)
  }

  const sendSurvey = async () => {
    if (!question.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch(`${api}/simulations/${simId}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, max_agents: 10 }),
      })
      const data = await res.json()
      setSurveyResults(data)
    } catch {
      setSurveyResults({ error: '通信エラー' })
    }
    setLoading(false)
    setQuestion('')
  }

  const tabs = [
    { id: 'report_chat', label: 'レポートと話す' },
    { id: 'interview', label: 'エージェントインタビュー' },
    { id: 'survey', label: 'アンケート' },
  ]

  return (
    <div className="bg-[#112240] border border-[#112240] rounded-xl p-5">
      <h3 className="text-lg font-bold gradient-text mb-4"> インタラクティブツール</h3>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #1e3a5f', paddingBottom: '8px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '6px 16px', fontSize: '0.82rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer',
            background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'transparent',
            color: tab === t.id ? '#e2e8f0' : '#94a3b8',
          }}>{t.label}</button>
        ))}
      </div>

      {/* レポートチャット */}
      {tab === 'report_chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '300px' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chatHistory.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>
                レポートについて質問してください
              </p>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'rgba(124,58,237,0.3)' : 'rgba(14,165,233,0.1)',
                border: `1px solid ${m.role === 'user' ? 'rgba(124,58,237,0.4)' : 'rgba(14,165,233,0.2)'}`,
                borderRadius: '12px', padding: '8px 12px',
                maxWidth: '80%', fontSize: '0.82rem', color: '#e2e8f0',
              }}>{m.content}</div>
            ))}
            {chatLoading && <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '0.8rem' }}>回答中...</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '8px', borderTop: '1px solid rgba(124,58,237,0.2)', flexShrink: 0 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReportChat()}
              placeholder="レポートについて質問..."
              style={{ flex: 1, background: '#0d1b2e', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none' }}
            />
            <button
              onClick={sendReportChat}
              disabled={chatLoading}
              style={{ background: 'rgba(124,58,237,0.4)', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
            >送信</button>
          </div>
        </div>
      )}

      {/* インタビュー */}
      {tab === 'interview' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <select
              value={selectedAgent}
              onChange={e => { setSelectedAgent(e.target.value); setInterviewHistory([]) }}
              style={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '0.82rem' }}
            >
              {agents.map(a => <option key={a.name} value={a.name}>{a.name} ({a.occupation})</option>)}
            </select>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {interviewHistory.map((h, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: '10px', fontSize: '0.82rem', maxWidth: '85%',
                alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start',
                background: h.role === 'user' ? 'rgba(14,165,233,0.2)' : 'rgba(124,58,237,0.15)',
                color: '#e2e8f0',
              }}>
                {h.role === 'agent' && <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginBottom: '2px' }}>{h.agent}</div>}
                {h.text}
              </div>
            ))}
            {loading && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>回答生成中...</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInterview()}
              placeholder="エージェントに質問..."
              style={{ flex: 1, background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none' }}
            />
            <button onClick={sendInterview} disabled={loading} style={{
              background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px',
              padding: '8px 20px', fontSize: '0.82rem', cursor: 'pointer', opacity: loading ? 0.5 : 1,
            }}>送信</button>
          </div>
        </div>
      )}

      {/* サーベイ */}
      {tab === 'survey' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendSurvey()}
              placeholder="全エージェントへの質問を入力..."
              style={{ flex: 1, background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none' }}
            />
            <button onClick={sendSurvey} disabled={loading} style={{
              background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px',
              padding: '8px 20px', fontSize: '0.82rem', cursor: 'pointer', opacity: loading ? 0.5 : 1,
            }}>{loading ? '送信中...' : ' 送信'}</button>
          </div>
          {surveyResults && !surveyResults.error && (
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '8px' }}>
                Q: {surveyResults.question}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                {surveyResults.results?.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px' }}>{r.agent}</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>{r.response}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {surveyResults?.error && <div style={{ color: '#ef4444', fontSize: '0.82rem' }}>{surveyResults.error}</div>}
        </div>
      )}
    </div>
  )
}
