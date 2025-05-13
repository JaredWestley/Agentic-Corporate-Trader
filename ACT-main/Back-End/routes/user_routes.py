from flask import Blueprint, request, jsonify
from firebase_admin import firestore

user_bp = Blueprint('user_bp', __name__)
db = firestore.client()

@user_bp.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    user_id = data['UserID']
    user_data = {
        'Name': data['Name'],
        'Email': data['Email'],
        'PasswordHash': data['PasswordHash'],
        'UserType': data['UserType'],
        'LoginType': data['LoginType'],
        'RegistrationDate': firestore.SERVER_TIMESTAMP,
        'LastLogin': None
    }
    db.collection('Users').document(user_id).set(user_data)
    return jsonify({'success': True, 'message': 'User added successfully!'}), 201

@user_bp.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user_ref = db.collection('Users').document(user_id)
    user = user_ref.get()
    if user.exists:
        return jsonify(user.to_dict()), 200
    else:
        return jsonify({'error': 'User not found'}), 404

@user_bp.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    updated_data = request.json
    db.collection('Users').document(user_id).update(updated_data)
    return jsonify({'success': True, 'message': 'User updated successfully!'}), 200

@user_bp.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    db.collection('Users').document(user_id).delete()
    return jsonify({'success': True, 'message': 'User deleted successfully!'}), 200
