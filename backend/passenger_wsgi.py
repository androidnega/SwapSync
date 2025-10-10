import sys
import os

INTERP = os.path.join(os.environ['HOME'], 'virtualenv', 'digitstec.store', 'backend', '3.11', 'bin', 'python')
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.insert(0, os.path.dirname(__file__))

try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

from main import app as application

