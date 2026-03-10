"""Claude API呼び出しモジュール（リトライロジック付き）"""
import time
import anthropic
from .config import ANTHROPIC_API_KEY, CLAUDE_MODEL, MAX_RETRIES, RETRY_DELAY


def get_client() -> anthropic.Anthropic:
    """Anthropicクライアントを取得"""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY が設定されていません。環境変数または.envファイルで設定してください。")
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def call_claude(system_prompt: str, user_message: str, max_tokens: int = 4096) -> str:
    """Claude APIを呼び出し、レスポンステキストを返す。リトライロジック付き。"""
    client = get_client()
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            return response.content[0].text
        except anthropic.RateLimitError as e:
            last_error = e
            wait = RETRY_DELAY * (2 ** attempt)
            print(f"  ⏳ レート制限 - {wait}秒待機中... (試行 {attempt + 1}/{MAX_RETRIES})")
            time.sleep(wait)
        except anthropic.APIError as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_DELAY * (attempt + 1)
                print(f"  ⚠️ APIエラー: {e} - {wait}秒後にリトライ...")
                time.sleep(wait)
            else:
                raise

    raise last_error
