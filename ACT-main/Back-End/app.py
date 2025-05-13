from flask import Flask
import os
from routes import bp as routes_bp
#from flask_firebase import Firebase
import firebase_admin
from firebase_admin import auth, credentials, firestore
from flask_cors import CORS
from dotenv import load_dotenv
from price_change import monitor_portfolio
load_dotenv()
import threading

app = Flask(__name__)
CORS(app)
secret_key = os.urandom(24).hex()

from routes.user_routes import user_bp
from routes.client_routes import client_bp
from routes.asset_routes import asset_bp
from routes.portfolio_routes import portfolio_bp
from routes.transaction_routes import transaction_bp
from routes.notification_routes import notification_bp
from routes.payment_routes import payment_bp

app.register_blueprint(user_bp)
app.register_blueprint(client_bp)
app.register_blueprint(asset_bp)
app.register_blueprint(portfolio_bp)
app.register_blueprint(transaction_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(payment_bp)

app.secret_key = secret_key
app.register_blueprint(routes_bp)

credential_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
db = firestore.Client.from_service_account_json(credential_path)


def run_flask():
    app.run(debug=True, use_reloader=False)  # Ensure reloader is disabled to avoid thread duplication

if __name__ == '__main__':
    # Start portfolio monitoring in a background thread
    portfolio_thread = threading.Thread(target=monitor_portfolio, args=(db,))
    portfolio_thread.daemon = True  # This will make the thread exit when the main program exits
    portfolio_thread.start()

    # Run Flask app
    run_flask()