import paypalrestsdk
from flask import Blueprint, request, jsonify
from firebase_config import db  # Import Firestore instance

bp = Blueprint('paypal_bp', __name__)

# Configure PayPal SDK
paypalrestsdk.configure({
    "mode": "sandbox",  # or "live" for production
    "client_id": "ARBjhm4LTjPyHWE5k_-BcosNlZV-0s56jxBPChiP7bFtMmfv17M8O6A-ci-7eycUV5Etf0EGX06ZnWmh",
    "client_secret": "EGRDkUhS78RFafwh4WD7_vgVn064ZtaMU1c0j8xdX-Q597aVbKdtxyxuqjNw17wCWA39AnTjny_wQfAL"
})

@bp.route('/api/create-paypal-payment', methods=['POST'])
def create_paypal_payment():
    try:
        data = request.get_json()
        payment_amount = data['PaymentAmount']
        user_id = data['UserID']

        # Create PayPal Payment
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {"payment_method": "paypal"},
            "redirect_urls": {
                "return_url": "http://localhost:3000/payment-success",
                "cancel_url": "http://localhost:3000/payment-cancel"
            },
            "transactions": [{
                "amount": {
                    "total": f"{payment_amount / 100:.2f}",
                    "currency": "USD"
                },
                "description": f"Upgrade account for user {user_id}"
            }]
        })

        if payment.create():
            # Return approval URL to frontend
            approval_url = next(link.href for link in payment.links if link.rel == "approval_url")
            return jsonify({'approvalUrl': approval_url}), 200
        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/api/execute-paypal-payment', methods=['POST'])
def execute_paypal_payment():
    try:
        data = request.get_json()
        payment_id = data['paymentID']
        payer_id = data['payerID']
        user_id = data['UserID']

        # Execute PayPal Payment
        payment = paypalrestsdk.Payment.find(payment_id)
        if payment.execute({"payer_id": payer_id}):
            # Update Firestore to reflect premium status
            # (Add your Firestore integration here to update user status)
            return jsonify({'success': True, 'message': 'Payment successful!'}), 200
        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500
