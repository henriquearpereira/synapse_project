import jwt
import datetime
from flask import request, jsonify

SECRET_KEY = "your_secret_key"

def generate_token(username):
    payload = {
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token

def verify_token():
    token = request.headers.get("Authorization")
    if not token:
        return None, jsonify({"error": "Token is missing"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["username"], None
    except jwt.ExpiredSignatureError:
        return None, jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return None, jsonify({"error": "Invalid token"}), 401
