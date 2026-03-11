import { useState, useEffect } from 'react'

function getEmotionBadgeStyle(emotion) {
  if (!emotion) return { background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }

  const positive = ['期待', '賛成', '賛同', '協力', '前向き', '肯定', '喜び', '嬉し', '同意', '希望', '信頼', '楽観', '満足', 'positive', 'hopeful']
  const negative = ['怒り', '反対', '反発', '不満', '抵抗', '憤', '批判', '拒否', '否定', '苛立', '失望', '怒', '反感', 'angry', 'frustrated']
  const caution = ['懸念', '不安', '心配', '疑問', '迷い', '戸惑', '慎重', '様子見', '観察', '疑念', '緊張', 'anxious', 'worried']

  for (const k of positive) {
    if (emotion.includes(k)) return { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
  }
  for (const k of negative) {
    if (emotion.includes(k)) return { background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }
  }
  for (const k of caution) {
    if (emotion.includes(k)) return { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
  }
  return { background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }
}

export default function EmotionChart({ simId, api }) {
  const [emotions, setEmotions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!simId || !api) return
    setLoading(true)
    setError(null)

    fetch(`${api}/simulations/${simId}/emotions`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setEmotions(data.emotions || [])
      })
      .catch(err => {
        if (err.message.includes('404')) {
          setEmotions([])
        } else {
          setError(err.message)
          setEmotions([])
        }
      })
      .finally(() => setLoading(false))
  }, [simId, api])

  const tableData = (() => {
    if (!emotions || emotions.length === 0) return { agents: [], turns: [] }
    const agentMap = {}
    const turnSet = new Set()

    for (const e of emotions) {
      const name = e.agent_name || `エージェント${e.agent_id}`
      if (!agentMap[name]) agentMap[name] = {}
      const emotionVal = e.emotional_state || e.emotion || ''
      if (emotionVal) {
        agentMap[name][e.turn] = emotionVal
        turnSet.add(e.turn)
      }
    }

    const agents = Object.keys(agentMap).map(name => ({ name, turns: agentMap[name] }))
    const turns = Array.from(turnSet).sort((a, b) => a - b)
    return { agents, turns }
  })()

  return (
    <div style={{background:'rgba(17,34,64,0.8)',border:'1px solid rgba(17,34,64,0.8)',borderRadius:'12px',padding:'20px'}}>
      <h3 style={{fontSize:'1rem',fontWeight:'bold',marginBottom:'16px',color:'#e2e8f0'}}>感情変化の推移</h3>

      {loading && (
        <div style={{color:'#94a3b8',fontSize:'0.85rem',padding:'16px 0'}}>
          データを読み込み中...
        </div>
      )}

      {!loading && error && (
        <p style={{color:'#f87171',fontSize:'0.85rem'}}>感情データの取得に失敗しました: {error}</p>
      )}

      {!loading && !error && tableData.agents.length === 0 && (
        <p style={{color:'#94a3b8',fontSize:'0.85rem',padding:'8px 0'}}>感情データがありません</p>
      )}

      {!loading && !error && tableData.agents.length > 0 && (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',fontSize:'0.85rem',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left',padding:'8px 12px',color:'#94a3b8',fontWeight:'500',borderBottom:'1px solid rgba(13,27,46,0.8)',minWidth:'120px'}}>
                  エージェント
                </th>
                {tableData.turns.map(t => (
                  <th key={t} style={{padding:'8px 12px',textAlign:'center',color:'#94a3b8',fontWeight:'500',borderBottom:'1px solid rgba(13,27,46,0.8)',minWidth:'100px'}}>
                    ターン {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.agents.map((agent, i) => (
                <tr key={agent.name} style={{background: i % 2 === 0 ? 'rgba(13,27,46,0.3)' : 'transparent'}}>
                  <td style={{padding:'10px 12px',fontWeight:'500',color:'#e2e8f0',borderBottom:'1px solid rgba(13,27,46,0.4)'}}>
                    {agent.name}
                  </td>
                  {tableData.turns.map(t => {
                    const state = agent.turns[t]
                    const badgeStyle = getEmotionBadgeStyle(state)
                    return (
                      <td key={t} style={{padding:'10px 12px',textAlign:'center',borderBottom:'1px solid rgba(13,27,46,0.4)'}}>
                        {state ? (
                          <span style={{display:'inline-block',padding:'2px 8px',borderRadius:'20px',fontSize:'0.75rem',fontWeight:'500',...badgeStyle}}>
                            {state}
                          </span>
                        ) : (
                          <span style={{color:'rgba(148,163,184,0.3)',fontSize:'0.75rem'}}>-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
