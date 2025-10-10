# SwapSync Backend

FastAPI backend for SwapSync - Phone Swapping and Repair Shop Management System

## Setup

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

