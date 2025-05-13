import stripe
from flask import Blueprint, request, jsonify
from firebase_config import db  # Import Firestore instance
import os

bp = Blueprint('stripe_bp', __name__)

# Initialize Stripe with your secret key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@bp.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        amount = data['PaymentAmount']
        user_id = data['UserID']

        # Create a PaymentIntent on Stripe
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            metadata={'UserID': user_id}
        )

        return jsonify({'clientSecret': intent.client_secret}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/api/payments/confirm', methods=['POST'])
def confirm_payment():
    try:
        data = request.json
        user_id = data['UserID']
        payment_id = data['PaymentID']
        payment_amount = data['PaymentAmount']
        payment_method = data['PaymentMethod']

        # Record payment details in Firestore
        payment_data = {
            'UserID': user_id,
            'PaymentAmount': payment_amount,
            'PaymentDate': firestore.SERVER_TIMESTAMP,
            'PaymentMethod': payment_method
        }
        db.collection('Payments').document(payment_id).set(payment_data)

        # Update user’s Premium status
        user_ref = db.collection('Users').document(user_id)
        user_ref.update({'Premium': True})

        return jsonify({'success': True, 'message': 'Payment confirmed and user upgraded to premium.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
