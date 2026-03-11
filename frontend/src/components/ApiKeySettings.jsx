import { useState, useEffect } from 'react'

export default function ApiKeySettings({ onKeyChange }) {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('prism_api_key')
    if (stored) {
      setKey(stored)
      setSaved(true)
      if (onKeyChange) onKeyChange(stored)
    }
  }, [])

  const handleSave = () => {
    const trimmed = key.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      alert('Anthropic APIキーは sk-ant- で始まります。\nhttps://console.anthropic.com で取得してください。')
      return
    }
    localStorage.setItem('prism_api_key', trimmed)
    setSaved(true)
    if (onKeyChange) onKeyChange(trimmed)
  }

  const handleClear = () => {
    localStorage.removeItem('prism_api_key')
    setKey('')
    setSaved(false)
    if (onKeyChange) onKeyChange('')
  }

  return (
    <div style={{
      background: saved ? 'rgba(74,222,128,0.05)' : 'rgba(239,68,68,0.08)',
      border: saved ? '1px solid rgba(74,222,128,0.3)' : '2px solid rgba(239,68,68,0.5)',
      borderRadius:'16px', padding:'24px', marginBottom:'24px'
    }}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
        <div style={{
          width:'10px', height:'10px', borderRadius:'50%',
          background: saved ? '#4ade80' : '#f87171',
          boxShadow: saved ? '0 0 8px #4ade80' : '0 0 8px #f87171'
        }} />
        <div style={{fontWeight:'bold',fontSize:'1rem',color: saved ? '#4ade80' : '#f87171'}}>
          {saved ? 'APIキー設定済み — 使用準備完了' : 'APIキーを設定してください（必須）'}
        </div>
      </div>

      {!saved && (
        <div style={{
          background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',
          borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#fca5a5',fontSize:'0.85rem',lineHeight:'1.6'
        }}>
          このサービスはあなた自身のAnthropicAPIキーで動作します。<br/>
          APIキーを設定しないとシミュレーションを実行できません。<br/>
          <span style={{color:'#94a3b8'}}>取得先: </span>
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
            style={{color:'#a78bfa',textDecoration:'underline'}}>
            console.anthropic.com
          </a>
          <span style={{color:'#94a3b8'}}> → API Keys → Create Key</span>
        </div>
      )}

      <div style={{display:'flex',gap:'8px',alignItems:'stretch'}}>
        <div style={{flex:1,position:'relative'}}>
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={e => { setKey(e.target.value); setSaved(false) }}
            placeholder="sk-ant-api03-xxxxxxxxxx..."
            style={{
              width:'100%',boxSizing:'border-box',
              background:'rgba(0,0,0,0.4)',
              border: saved ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(124,58,237,0.5)',
              borderRadius:'10px',padding:'12px 44px 12px 14px',
              color:'#e2e8f0',fontSize:'0.9rem',outline:'none',
              fontFamily:'monospace'
            }}
          />
          <button
            onClick={() => setShowKey(v => !v)}
            style={{
              position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:'0.8rem'
            }}
          >
            {showKey ? '隠す' : '表示'}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          style={{
            background: key.trim() ? '#7c3aed' : 'rgba(124,58,237,0.3)',
            color: key.trim() ? 'white' : '#94a3b8',
            border:'none',borderRadius:'10px',padding:'12px 20px',
            cursor: key.trim() ? 'pointer' : 'not-allowed',
            fontWeight:'bold',fontSize:'0.9rem',whiteSpace:'nowrap'
          }}
        >
          保存
        </button>
        {saved && (
          <button
            onClick={handleClear}
            style={{
              background:'rgba(239,68,68,0.15)',color:'#f87171',
              border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',
              padding:'12px 14px',cursor:'pointer',fontSize:'0.85rem',whiteSpace:'nowrap'
            }}
          >
            削除
          </button>
        )}
      </div>

      {saved && (
        <div style={{marginTop:'10px',fontSize:'0.8rem',color:'#4ade80'}}>
          設定済み: {key.substring(0, 12)}...{key.substring(key.length - 4)}
        </div>
      )}
    </div>
  )
}
