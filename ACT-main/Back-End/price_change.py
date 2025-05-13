from datetime import datetime, timedelta
import yfinance as yf
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

def fetch_yesterday_price(asset_id):
    try:
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        yesterday_str = yesterday.strftime('%Y-%m-%d')
        
        stock = yf.Ticker(asset_id)
        history = stock.history(period="5d")

        if not history.empty:
            history.index = history.index.tz_localize(None)
            if yesterday_str in history.index.strftime('%Y-%m-%d').values:
                yesterday_close = history.loc[yesterday_str, 'Close']
                return yesterday_close
            else:
                return None
        else:
            return None

    except Exception as e:
        return None


def fetch_current_price(asset_id):
    try:
        stock = yf.Ticker(asset_id)

        live_price = stock.history(period="1d")['Close'].iloc[-1]

        return live_price
    except Exception as e:
        return None

load_dotenv()

def send_email(user_email, asset_id, percent_change):
    try:
        mail_server = os.getenv('MAIL_SERVER')
        mail_port = int(os.getenv('MAIL_PORT'))
        mail_use_tls = os.getenv('MAIL_USE_TLS') == 'True'
        mail_username = os.getenv('MAIL_USERNAME')
        mail_password = os.getenv('MAIL_PASSWORD')

        sender_email = mail_username
        receiver_email = user_email

        subject = f"Price Change Alert for {asset_id}"
        body = f"The price of {asset_id} has changed by {percent_change:.2f}%."

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(mail_server, mail_port) as server:
            if mail_use_tls:
                server.starttls()
            server.login(sender_email, mail_password)
            server.sendmail(sender_email, receiver_email, msg.as_string())

        print(f"Email sent to {user_email} regarding asset {asset_id} price change.")
    
    except Exception as e:
        print(f"Failed to send email: {e}")

def send_notification(user_id, asset_id, percent_change, db):
    user_ref = db.collection('Users').document(user_id)
    user_data = user_ref.get().to_dict()
    user_email = user_data.get('Email')
    if user_email:
        send_email(user_email, asset_id, percent_change)
    else:
        return 

def monitor_portfolio(db):
    while True:
        portfolios_ref = db.collection('Portfolios')
        portfolios = portfolios_ref.stream()
        
        for portfolio in portfolios:
            portfolio_data = portfolio.to_dict()

            user_id = portfolio_data.get('UserID')
            if not user_id:
                continue
            
            asset_id = portfolio_data.get('AssetID')

            if not asset_id:
                continue
            
            purchase_price = portfolio_data.get('PurchasePrice')
            if purchase_price is None:
                continue
            

            yesterday_price = fetch_yesterday_price(asset_id)
            if yesterday_price is None:
                continue

            current_price = fetch_current_price(asset_id)
            if current_price is None:
                continue

            price_change = current_price - yesterday_price
            percent_change = (price_change / yesterday_price) * 100

            if abs(percent_change) >= 5:
                send_notification(user_id, asset_id, percent_change, db)
            time.sleep(5)




