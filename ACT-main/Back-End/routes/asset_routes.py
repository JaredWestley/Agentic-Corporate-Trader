from flask import Blueprint, request, jsonify
from firebase_admin import firestore

asset_bp = Blueprint('asset_bp', __name__)
db = firestore.client()

@asset_bp.route('/api/assets', methods=['POST'])
def add_asset():
    data = request.json
    asset_id = data['AssetID']
    asset_data = {
        'AssetName': data['AssetName'],
        'AssetType': data['AssetType'],
        'CurrentPrice': data['CurrentPrice'],
        'PredictedPrice': data.get('PredictedPrice', 0)
    }
    db.collection('Assets').document(asset_id).set(asset_data)
    return jsonify({'success': True, 'message': 'Asset added successfully!'}), 201

@asset_bp.route('/api/assets/<asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset_ref = db.collection('Assets').document(asset_id)
    asset = asset_ref.get()
    if asset.exists:
        return jsonify(asset.to_dict()), 200
    else:
        return jsonify({'error': 'Asset not found'}), 404

@asset_bp.route('/api/assets/<asset_id>', methods=['PUT'])
def update_asset(asset_id):
    updated_data = request.json
    db.collection('Assets').document(asset_id).update(updated_data)
    return jsonify({'success': True, 'message': 'Asset updated successfully!'}), 200

@asset_bp.route('/api/assets/<asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    db.collection('Assets').document(asset_id).delete()
    return jsonify({'success': True, 'message': 'Asset deleted successfully!'}), 200
