from flask import Blueprint, request, jsonify
from firebase_admin import firestore

notification_bp = Blueprint('notification_bp', __name__)
db = firestore.client()

@notification_bp.route('/api/notifications', methods=['POST'])
def add_notification():
    data = request.json
    notification_id = data['NotificationID']
    notification_data = {
        'UserID': data['UserID'],
        'AssetID': data.get('AssetID', None),
        'AlertType': data['AlertType'],
        'AlertMessage': data['AlertMessage'],
        'Date': data.get('Date', firestore.SERVER_TIMESTAMP),
        'ReadStatus': data.get('ReadStatus', False)
    }
    db.collection('Notifications').document(notification_id).set(notification_data)
    return jsonify({'success': True, 'message': 'Notification added successfully!'}), 201

@notification_bp.route('/api/notifications/<notification_id>', methods=['GET'])
def get_notification(notification_id):
    notification_ref = db.collection('Notifications').document(notification_id)
    notification = notification_ref.get()
    if notification.exists:
        return jsonify(notification.to_dict()), 200
    else:
        return jsonify({'error': 'Notification not found'}), 404

@notification_bp.route('/api/notifications/<notification_id>', methods=['PUT'])
def update_notification(notification_id):
    updated_data = request.json
    db.collection('Notifications').document(notification_id).update(updated_data)
    return jsonify({'success': True, 'message': 'Notification updated successfully!'}), 200

@notification_bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    db.collection('Notifications').document(notification_id).delete()
    return jsonify({'success': True, 'message': 'Notification deleted successfully!'}), 200
