tickers = [
    "BTC-USD",  # Bitcoin
    "ETH-USD",  # Ethereum
    "XRP-USD",  # Ripple
    "LTC-USD",  # Litecoin
    "ADA-USD",  # Cardano
    "SOL-USD",  # Solana
    "DOGE-USD", # Dogecoin
    "DOT-USD",  # Polkadot
    "MATIC-USD", # Polygon
    "BCH-USD",  # Bitcoin Cash
    "AVAX-USD", # Avalanche
    "UNI-USD",  # Uniswap
    "LINK-USD", # Chainlink
    "AAVE-USD", # Aave
    "ALGO-USD", # Algorand
    "XLM-USD",  # Stellar
    "VET-USD",  # VeChain
    "FIL-USD",  # Filecoin
    "THETA-USD",# Theta Network
    "TRX-USD"   # TRON
]



import base64
import datetime
import io
from matplotlib import pyplot as plt
import yfinance as yf
import json

def get_cryptos():
    crypto_data = []
    for ticker in tickers:
        crypto = yf.Ticker(ticker)
        current_price = crypto.history(period="1d")['Close'][0]
        previous_close = crypto.info.get("previousClose")
        price_change = current_price - previous_close
        percentage_change = (price_change / previous_close) * 100
    
        day_low = crypto.info.get("dayLow")
        day_high = crypto.info.get("dayHigh")
        day_range = day_high - day_low
        history = crypto.history(period="1d")
        price = history['Close'].iloc[-1]
        crypto_info = {
        "symbol": ticker,
        "name": crypto.info.get('shortName', 'N/A'),
        "price": price,
        "previous_close": previous_close,
        "price_change": price_change,
        "percentage_change": percentage_change,
        "day_high": day_high,
        "day_low": day_low,
        "day_range": day_range
    }
        crypto_data.append(crypto_info)

    return crypto_data


def get_crypto(ticker, currency="USD"):
    currency = currency.upper()
    ticker = ticker.upper()
    crypto_symbol = f"{ticker}-{currency}"

    crypto = yf.Ticker(crypto_symbol)

    history = crypto.history(period="1d")
    price = history['Close'].iloc[-1]

    previous_close = crypto.info.get("previousClose")
    price_change = price - previous_close
    percentage_change = (price_change / previous_close) * 100
    
    day_low = crypto.info.get("dayLow")
    day_high = crypto.info.get("dayHigh")
    day_range = day_high - day_low


    print(crypto)
    history = crypto.history(period="1d")
    if history.empty:
        raise ValueError(f"No data found for {ticker}-{currency}")

    # Get the latest closing price
    price = history['Close'].iloc[-1]

    stock_info = {
        "symbol": ticker,
        "name": crypto.info.get('shortName', 'N/A'),
        "price": price,
        "previous_close": previous_close,
        "price_change": price_change,
        "percentage_change": percentage_change,
        "day_high": day_high,
        "day_low": day_low,
        "day_range": day_range,
        "chart": create_chart(ticker, currency)
    }

    return stock_info
    




def create_chart(ticker, currency):
    today = datetime.date.today()

    one_year_ago = today - datetime.timedelta(days=365)

    stock_data = yf.download(ticker, start=one_year_ago, end=today)

    plt.figure(figsize=(12, 6))
    plt.plot(stock_data['Close'], label='Closing Price')
    plt.title(f"{ticker} Price (Past Year)")
    plt.xlabel('Date')
    plt.ylabel(f'Price {currency}')
    plt.legend()
    plt.grid(True)
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    base64_image = base64.b64encode(buf.read()).decode('utf-8')
    return base64_image


