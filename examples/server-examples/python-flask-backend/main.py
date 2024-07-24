from flask import Flask, request


app = Flask(__name__)

@app.route("/")
def hello_world():
    return "Welcome to the Stack Auth Python Flask Backend!"

@app.route("/authentication-required")
def authentication_required():
    access_token = request.headers.get("x-access-token")
    refresh_token = request.headers.get("x-refresh-token")
    print(access_token, refresh_token)
    return "You are authenticated!"