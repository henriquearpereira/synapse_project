import logging
import logging_loki
from flask import Flask, request, jsonify
from models.synapspark import SynapSpark
from utils.auth import generate_token, verify_token
from pymongo import MongoClient
from prometheus_client import start_http_server, Counter, Histogram
from prometheus_client import make_wsgi_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware

app = Flask(__name__)
synapspark = SynapSpark()

# Configura logging pro Loki
handler = logging_loki.LokiHandler(
    url="http://loki:3100/loki/api/v1/push",
    tags={"application": "synapspark-backend"},
    version="1",
)
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

users_db = MongoClient("mongodb://mongodb:27017/")["synapspark_db"]["users"]

start_http_server(8000)
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
    '/metrics': make_wsgi_app()
})

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    logging.info(f"Register attempt for username: {username}")
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    existing_user = users_db.find_one({"username": username})
    if existing_user:
        return jsonify({"error": "User already exists"}), 400
    
    users_db.insert_one({"username": username, "password": password})
    token = generate_token(username)
    logging.info(f"User registered: {username}")
    return jsonify({"token": token})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    logging.info(f"Login attempt for username: {username}")
    
    user = users_db.find_one({"username": username, "password": password})
    if not user:
        logging.warning(f"Failed login for username: {username}")
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = generate_token(username)
    logging.info(f"User logged in: {username}")
    return jsonify({"token": token})

@app.route("/reformulate", methods=["POST"])
def reformulate():
    user_id, error_response = verify_token()
    if error_response:
        logging.error(f"Unauthorized access attempt: {error_response}")
        return error_response
    
    data = request.json
    prompt = data.get("prompt")
    model = data.get("model", "deepseek")
    params = data.get("params", {"temperature": 0.7, "top_p": 0.9, "max_tokens": 150})
    logging.info(f"Reformulate request by user {user_id} with model {model}")
    
    if not prompt:
        logging.error("Prompt missing in reformulate request")
        return jsonify({"error": "Prompt is required"}), 400

    result = synapspark.reformulate_prompt(user_id, prompt, model, params)
    logging.info(f"Prompt reformulated for user {user_id}")
    return jsonify(result)

@app.route("/feedback", methods=["POST"])
def feedback():
    user_id, error_response = verify_token()
    if error_response:
        logging.error(f"Unauthorized feedback attempt: {error_response}")
        return error_response
    
    data = request.json
    prompt = data.get("prompt")
    final_prompt = data.get("final_prompt")
    score = data.get("score")
    logging.info(f"Feedback submitted by user {user_id}")
    
    if not all([prompt, final_prompt, score]):
        logging.error("Missing fields in feedback request")
        return jsonify({"error": "Missing required fields"}), 400

    synapspark.save_feedback(user_id, prompt, final_prompt, score)
    return jsonify({"message": "Feedback saved"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)