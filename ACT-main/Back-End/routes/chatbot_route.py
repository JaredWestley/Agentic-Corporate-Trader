from flask import Blueprint, jsonify, request
from openai import OpenAI
client = OpenAI()
bp = Blueprint('chatbot_bp', __name__)

@bp.route("/chatbot", methods=["POST"])
def chatbot():
    question = request.json.get("question")
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    answer = generate_answer(question)
    
    return jsonify({"answer": answer})


def generate_answer(question):
    response = client.chat.completions.create(
    model="ft:gpt-3.5-turbo-0125:personal:act-chat-bot:AQyl27re",
    messages=[
        {
            "role": "user",
            "content": f"{question}"
        }
    ]
    )
    return response.choices[0].message.content
    
