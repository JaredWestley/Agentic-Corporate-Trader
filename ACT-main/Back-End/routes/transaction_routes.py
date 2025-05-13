from flask import Blueprint, request, jsonify
from firebase_admin import firestore

transaction_bp = Blueprint('transaction_bp', __name__)
db = firestore.client()

@transaction_bp.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    transaction_id = data['TransactionID']
    transaction_data = {
        'PortfolioID': data['PortfolioID'],
        'TransactionType': data['TransactionType'],
        'Quantity': data['Quantity'],
        'TransactionDate': data.get('TransactionDate', firestore.SERVER_TIMESTAMP)
    }
    db.collection('Transactions').document(transaction_id).set(transaction_data)
    return jsonify({'success': True, 'message': 'Transaction added successfully!'}), 201

@transaction_bp.route('/api/transactions/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    transaction_ref = db.collection('Transactions').document(transaction_id)
    transaction = transaction_ref.get()
    if transaction.exists:
        return jsonify(transaction.to_dict()), 200
    else:
        return jsonify({'error': 'Transaction not found'}), 404

@transaction_bp.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    updated_data = request.json
    db.collection('Transactions').document(transaction_id).update(updated_data)
    return jsonify({'success': True, 'message': 'Transaction updated successfully!'}), 200

@transaction_bp.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    db.collection('Transactions').document(transaction_id).delete()
    return jsonify({'success': True, 'message': 'Transaction deleted successfully!'}), 200
