from flask import Blueprint, jsonify, render_template
from stock_data import get_stocks, get_stock

bp = Blueprint('stock_data_bp', __name__)

@bp.route("/stock-data")
def stockData():
    stock_data = get_stocks()
    if stock_data:
        return jsonify({"stocks": stock_data}), 200
    else:
        return jsonify({"error": "No data available"}), 404


@bp.route("/get-stock/<ticker>")
def get_stock_info(ticker):
    stock_data = get_stock(ticker)
    if stock_data:
        return jsonify({"stocks": stock_data}), 200
    else:
        return jsonify({"error": "No data available"}), 404

