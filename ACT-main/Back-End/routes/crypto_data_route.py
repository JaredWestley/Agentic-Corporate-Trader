from flask import Blueprint, jsonify, render_template
from crypto_data import get_cryptos, get_crypto  # Assuming this is your function file

bp = Blueprint('crypto_data_bp', __name__)

@bp.route("/crypto-data")
def cryptoData():
    crypto_data = get_cryptos()
    if crypto_data:
        return jsonify({"cryptos": crypto_data}), 200  # Returning JSON response
    else:
        return jsonify({"error": "No data available"}), 404

@bp.route("/get-crypto/<ticker>")
def get_crypto_info(ticker):
    crypto_data = get_crypto(ticker)

    if crypto_data:
        return jsonify({"stocks": crypto_data}), 200  # Returning JSON response
    else:
        return jsonify({"error": "No data available"}), 404

