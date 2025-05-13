from flask import Blueprint, request, jsonify
from firebase_admin import firestore

client_bp = Blueprint('client_bp', __name__)
db = firestore.client()

@client_bp.route('/api/clients', methods=['POST'])
def add_client():
    data = request.json
    client_id = data['ClientID']
    client_data = {
        'ClientID': data['ClientID'],
        'ManagerID': data['ManagerID'],
        'ClientName': data['ClientName'],
        'ClientDetails': data.get('ClientDetails', '')
    }
    db.collection('Clients').document(client_id).set(client_data)
    return jsonify({'success': True, 'message': 'Client added successfully!'}), 201

@client_bp.route('/api/clients/<client_id>', methods=['GET'])
def get_client(client_id):
    client_ref = db.collection('Clients').document(client_id)
    client = client_ref.get()
    if client.exists:
        return jsonify(client.to_dict()), 200
    else:
        return jsonify({'error': 'Client not found'}), 404

@client_bp.route('/api/clients/<client_id>', methods=['PUT'])
def update_client(client_id):
    updated_data = request.json
    db.collection('Clients').document(client_id).update(updated_data)
    return jsonify({'success': True, 'message': 'Client updated successfully!'}), 200

@client_bp.route('/api/clients/<client_id>', methods=['DELETE'])
def delete_client(client_id):
    db.collection('Clients').document(client_id).delete()
    return jsonify({'success': True, 'message': 'Client deleted successfully!'}), 200
