import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

/**
 * レポート表示コンポーネント
 * レポート生成ボタン → Markdownレンダリングで表示
 */
export default function ReportView({ simId, status, api }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 既存レポートを取得
  const fetchReport = async () => {
    try {
      const res = await fetch(`${api}/simulations/${simId}/report`)
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
      const exists = await fetchReport()
      if (exists) { setLoading(false); return }
      const res = await fetch(`${api}/simulations/${simId}/report`, { method: 'POST' })
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
    <div className="bg-[#112240] border border-[#112240] rounded-xl p-5">
      <h3 className="text-lg font-bold mb-4 text-[#e2e8f0]">📊 分析レポート</h3>

      {!report && (
        <button
          onClick={generateReport}
          disabled={loading || status !== 'completed'}
          className="px-6 py-3 rounded-xl font-bold text-white btn-gradient"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="spinner" style={{ width: 18, height: 18 }} />
              生成中...
            </span>
          ) : (
            '📊 レポートを生成'
          )}
        </button>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-3">❌ {error}</p>
      )}

      {report && (
        <div className="mt-4 bg-[#0d1b2e] rounded-xl p-6 prose prose-invert prose-sm max-w-none
          prose-headings:text-[#e2e8f0] prose-headings:gradient-text
          prose-p:text-[#e2e8f0] prose-p:leading-relaxed
          prose-strong:text-[#0ea5e9]
          prose-li:text-[#e2e8f0]
          prose-code:text-[#7c3aed] prose-code:bg-[#112240] prose-code:px-1 prose-code:rounded
        ">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
