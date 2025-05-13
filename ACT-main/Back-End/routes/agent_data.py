from flask import Blueprint, jsonify, render_template, request, redirect, url_for, flash
from agents import run_agents
bp = Blueprint('agent_data_bp', __name__)

@bp.route("/make-recomendation<ticker>")
def make_recomendation(ticker):
    stock_data = run_agents(ticker)
    if stock_data:
        return jsonify(stock_data)
    else:
        return jsonify({"error": "No data available"}), 404