from flask import Blueprint, request, jsonify
from firebase_admin import firestore

portfolio_bp = Blueprint('portfolio_bp', __name__)
db = firestore.client()

@portfolio_bp.route('/api/portfolios', methods=['POST'])
def add_portfolio():
    data = request.json
    portfolio_id = data['PortfolioID']
    portfolio_data = {
        'UserID': data['UserID'],
        'AssetID': data['AssetID'],
        'PurchasePrice': data['PurchasePrice'],
        'PurchaseDate': data.get('PurchaseDate', firestore.SERVER_TIMESTAMP)
    }
    db.collection('Portfolios').document(portfolio_id).set(portfolio_data)
    return jsonify({'success': True, 'message': 'Portfolio added successfully!'}), 201

@portfolio_bp.route('/api/portfolios/<portfolio_id>', methods=['GET'])
def get_portfolio(portfolio_id):
    portfolio_ref = db.collection('Portfolios').document(portfolio_id)
    portfolio = portfolio_ref.get()
    if portfolio.exists:
        return jsonify(portfolio.to_dict()), 200
    else:
        return jsonify({'error': 'Portfolio not found'}), 404

@portfolio_bp.route('/api/portfolios/<portfolio_id>', methods=['PUT'])
def update_portfolio(portfolio_id):
    updated_data = request.json
    db.collection('Portfolios').document(portfolio_id).update(updated_data)
    return jsonify({'success': True, 'message': 'Portfolio updated successfully!'}), 200

@portfolio_bp.route('/api/portfolios/<portfolio_id>', methods=['DELETE'])
def delete_portfolio(portfolio_id):
    db.collection('Portfolios').document(portfolio_id).delete()
    return jsonify({'success': True, 'message': 'Portfolio deleted successfully!'}), 200
