from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import stripe
import os

# Initialize Blueprint and Firestore
payment_bp = Blueprint('payment_bp', __name__)
db = firestore.client()

# Set Stripe API key (make sure it's securely stored in environment variables)
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Route to create a new payment record in Firestore
@payment_bp.route('/api/payments', methods=['POST'])
def add_payment():
    data = request.json
    payment_id = data['PaymentID']
    payment_data = {
        'UserID': data['UserID'],
        'PaymentAmount': data['PaymentAmount'],
        'PaymentDate': data.get('PaymentDate', firestore.SERVER_TIMESTAMP),
        'PaymentMethod': data['PaymentMethod']
    }
    db.collection('Payments').document(payment_id).set(payment_data)
    return jsonify({'success': True, 'message': 'Payment added successfully!'}), 201

# Route to retrieve a payment record from Firestore
@payment_bp.route('/api/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    payment_ref = db.collection('Payments').document(payment_id)
    payment = payment_ref.get()
    if payment.exists:
        return jsonify(payment.to_dict()), 200
    else:
        return jsonify({'error': 'Payment not found'}), 404

# Route to update a payment record in Firestore
@payment_bp.route('/api/payments/<payment_id>', methods=['PUT'])
def update_payment(payment_id):
    updated_data = request.json
    db.collection('Payments').document(payment_id).update(updated_data)
    return jsonify({'success': True, 'message': 'Payment updated successfully!'}), 200

# Route to delete a payment record from Firestore
@payment_bp.route('/api/payments/<payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    db.collection('Payments').document(payment_id).delete()
    return jsonify({'success': True, 'message': 'Payment deleted successfully!'}), 200

# Route to create a Stripe Checkout Session
@payment_bp.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        user_id = data['UserID']
        price = data.get('Price', 5000)  # Price in cents; adjust as needed

        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Premium Subscription',
                    },
                    'unit_amount': price,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:3000/success',  # Frontend success URL
            cancel_url='http://localhost:3000/cancel',    # Frontend cancel URL
            metadata={'UserID': user_id}  # Pass UserID for tracking
        )

        return jsonify({'url': session.url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Stripe Webhook to handle checkout session completion
@payment_bp.route('/api/stripe-webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')  # Set this in your Stripe settings

    try:
        # Verify and construct the event
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError:
        return 'Invalid signature', 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['UserID']

        # Update user's premium status in Firestore
        user_ref = db.collection('Users').document(user_id)
        user_ref.update({'Premium': True})

    return 'Success', 200

# Route to create a Stripe Payment Link
@payment_bp.route('/api/create-payment-link', methods=['POST'])
def create_payment_link():
    try:
        data = request.json
        user_id = data['UserID']
        price = data.get('Price', 5000)  # Price in cents; adjust as needed

        # Create Stripe Payment Link
        payment_link = stripe.paymentLinks.create(
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Stock Purchase',  # Example product name
                    },
                    'unit_amount': price,
                },
                'quantity': 1,
            }],
            metadata={'UserID': user_id}  # Pass UserID for tracking
        )

        return jsonify({'url': payment_link.url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
