import { useState, useEffect } from 'react'

export default function ApiKeySettings({ onSave }) {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('prism_api_key')
    if (stored) {
      setKey(stored)
      setSaved(true)
    }
  }, [])

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem('prism_api_key', key.trim())
      setSaved(true)
      if (onSave) onSave(key.trim())
    }
  }

  const handleClear = () => {
    localStorage.removeItem('prism_api_key')
    setKey('')
    setSaved(false)
  }

  return (
    <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:'12px',padding:'20px',marginBottom:'16px'}}>
      <div style={{color:'#a78bfa',fontWeight:'bold',marginBottom:'12px',fontSize:'0.9rem'}}>Anthropic API Key</div>
      <div style={{color:'#94a3b8',fontSize:'0.8rem',marginBottom:'12px'}}>
        自分のAPIキーを設定すると、あなた自身のAnthropicアカウントからAPIが呼び出されます。
        取得: <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{color:'#7c3aed'}}>console.anthropic.com</a>
      </div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{flex:1,background:'rgba(0,0,0,0.3)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:'8px',padding:'8px 12px',color:'#e2e8f0',fontSize:'0.85rem',outline:'none'}}
        />
        <button
          onClick={handleSave}
          style={{background:'#7c3aed',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',cursor:'pointer',fontSize:'0.85rem'}}
        >
          保存
        </button>
        {saved && (
          <button
            onClick={handleClear}
            style={{background:'rgba(239,68,68,0.2)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',padding:'8px 12px',cursor:'pointer',fontSize:'0.85rem'}}
          >
            削除
          </button>
        )}
      </div>
      {saved && <div style={{color:'#4ade80',fontSize:'0.8rem',marginTop:'8px'}}>APIキーが設定されています</div>}
    </div>
  )
}
