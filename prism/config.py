"""設定管理モジュール"""
import os
from dotenv import load_dotenv

load_dotenv()

# Claude API設定
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

# シミュレーション デフォルト設定
DEFAULT_AGENT_COUNT = 15
DEFAULT_TURN_COUNT = 10
MAX_TURN_COUNT = 20
MAX_AGENT_COUNT = 20
MIN_AGENT_COUNT = 10

# データベース設定
# Renderでは/tmpが揮発しないのでそこに保存、ローカルではプロジェクトルートに保存
if os.environ.get("RENDER"):
    DB_PATH = "/tmp/prism.db"
else:
    DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "prism.db"))

# APIリトライ設定
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # 秒
