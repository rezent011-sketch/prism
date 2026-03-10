import { useState } from 'react'

const API = 'http://localhost:8000/api'

/**
 * レポート表示コンポーネント
 * レポート生成ボタン → Markdownで表示
 */
export default function ReportView({ simId, status }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 既存レポートを取得
  const fetchReport = async () => {
    try {
      const res = await fetch(`${API}/simulations/${simId}/report`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.report_text)
        return true
      }
    } catch (e) { /* 未生成 */ }
    return false
  }

  // レポート生成
  const generateReport = async () => {
    setLoading(true)
    setError(null)
    try {
      // まず既存レポートを確認
      const exists = await fetchReport()
      if (exists) {
        setLoading(false)
        return
      }
      // 生成
      const res = await fetch(`${API}/simulations/${simId}/report`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'レポート生成に失敗しました')
      }
      const data = await res.json()
      setReport(data.report_text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <h3 className="text-lg font-bold mb-3">📊 分析レポート</h3>

      {!report && (
        <button
          onClick={generateReport}
          disabled={loading || status !== 'completed'}
          className="px-4 py-2 rounded-lg font-bold text-white bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              生成中...
            </span>
          ) : (
            '📊 レポート生成'
          )}
        </button>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-2">❌ {error}</p>
      )}

      {report && (
        <div className="mt-4 prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-[#c9d1d9] leading-relaxed bg-[#0d1117] p-4 rounded-lg overflow-auto">
            {report}
          </pre>
        </div>
      )}
    </div>
  )
}
