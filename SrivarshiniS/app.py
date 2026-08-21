"""
TicketAI Flask Backend — connects the frontend to a local Ollama model.

Setup:
  pip install -r requirements.txt
  ollama pull llama3.2   (only needed once)

Run:
  python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
import json
import re

app = Flask(__name__)
CORS(app)

VALID_CATEGORIES = ["Account", "Billing", "Network", "HR", "Finance", "General"]

SYSTEM_PROMPT = """You are the AI support assistant for TicketAI, a ticket management system.

A user will describe a support issue. You must respond with ONLY a single valid JSON object — no markdown, no code fences, no extra text before or after it. Use exactly this shape:

{
  "reply": "<a short, clear, actionable troubleshooting reply, 3-5 steps if applicable>",
  "category": "<one of: Account, Billing, Network, HR, Finance, General>",
  "confidence": <integer 0-100, how confident you are this reply fully resolves the issue without a human agent>,
  "escalate": <true or false — true if confidence is below 50, or if the issue involves billing disputes, refunds, HR matters, or anything requiring account/human access>
}

Rules for the "reply" field:
- Plain text only. Never include HTML tags, markdown links, or clickable URLs.
- Never invent or reference specific website URLs, email addresses, or support links that you are not certain exist.
- If the user needs to go somewhere in the app, describe it in words (e.g. "go to Account Settings") instead of a link.

Respond with nothing but that JSON object."""

def extract_json(raw_text):
    """Try to parse the model's output as JSON, even if it added stray text around it."""
    try:
        return json.loads(raw_text)
    except Exception:
        pass
    match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return None

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = (data or {}).get('message', '').strip()

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    fallback = {
        "reply": "I've noted your issue and I'm routing it to the right team for a closer look.",
        "category": "General",
        "confidence": 50,
        "escalate": True
    }

    try:
        response = ollama.chat(
            model="llama3.2",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
        )
        raw = response["message"]["content"].strip()
        parsed = extract_json(raw)

        if not parsed:
            fallback["reply"] = raw if raw else fallback["reply"]
            return jsonify(fallback)

        result = {
            "reply": parsed.get("reply", fallback["reply"]),
            "category": parsed.get("category") if parsed.get("category") in VALID_CATEGORIES else "General",
            "confidence": int(parsed.get("confidence", 50)) if str(parsed.get("confidence", "")).isdigit() else 50,
            "escalate": bool(parsed.get("escalate", False))
        }
        result["confidence"] = max(0, min(100, result["confidence"]))

        # Safety net: if the model's reply is too short or low-quality, use a fallback
        if len(result["reply"].strip()) < 15:
            result["reply"] = "I want to make sure I understand your issue correctly — could you tell me a bit more about what's going wrong? Or I can connect you with a specialist right away."
            result["escalate"] = True

        # Strip any HTML tags the model might still slip in, despite instructions
        result["reply"] = re.sub(r'<[^>]+>', '', result["reply"]).strip()
        if len(result["reply"]) < 15:
            result["reply"] = "I want to make sure I understand your issue correctly — could you tell me a bit more about what's going wrong? Or I can connect you with a specialist right away."
            result["escalate"] = True

        return jsonify(result)

    except Exception as e:
        fallback["reply"] = f"Sorry, I'm having trouble reaching the AI assistant right now. ({str(e)})"
        return jsonify(fallback), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)