"""設定管理モジュール"""
import os
from dotenv import load_dotenv

load_dotenv()

# Claude API設定
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-haiku-4-5-20251001"

# シミュレーション デフォルト設定
DEFAULT_AGENT_COUNT = 15
DEFAULT_TURN_COUNT = 10
MAX_TURN_COUNT = 20
MAX_AGENT_COUNT = 20
MIN_AGENT_COUNT = 10

# データベース設定
DB_PATH = os.getenv("PRISM_DB_PATH", "prism_data.db")

# APIリトライ設定
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # 秒
