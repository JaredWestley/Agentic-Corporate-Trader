import base64
import datetime
import io
from flask import jsonify
from matplotlib import pyplot as plt
import yfinance as yf
import json

tickers = [
    "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NFLX", "NVDA", "SPY", "V",
    "JPM", "DIS", "BA", "WMT", "KO", "PEP", "INTC", "PFE", "CSCO", "XOM",
    "BABA", "IBM", "VZ", "GM", "NKE", "PG", "WFC", "BA", "T", "UNH", "BIDU",
    "C", "CVX", "ABT", "GE", "MCD", "MMM", "PYPL", "GS", "LMT", "RTX", "DUK",
    "CAT", "MS", "AMT", "CL", "SBUX", "MO", "AMD", "MU", "BMY", "GILD"
]

def get_stocks():
    stock_data = []
    for ticker in tickers:
        stock = yf.Ticker(ticker)

        try:
            current_price = stock.info.get("currentPrice")
            previous_close = stock.info.get("previousClose")
            price_change = None
            percentage_change = None

            if current_price and previous_close:
                price_change = current_price - previous_close
                percentage_change = (price_change / previous_close) * 100

            day_low = stock.info.get("dayLow", 0)
            day_high = stock.info.get("dayHigh", 0)
            day_range = day_high - day_low if day_low and day_high else None

            stock_info = {
                "ticker": ticker,
                "name": stock.info.get('shortName', 'N/A'),
                "fullname": stock.info.get("longName", "N/A"),
                "industry": stock.info.get("industry", "N/A"),
                "dayHigh": day_high,
                "dayLow": day_low,
                "dayRange": day_range,
                "percentage_change": round(percentage_change, 2) if percentage_change else "N/A",
                "price": stock.history(period="1d")['Close'].iloc[-1] if not stock.history(period="1d").empty else "N/A"
            }
            stock_data.append(stock_info)

        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
            stock_data.append({"ticker": ticker, "error": str(e)})

    return stock_data

def get_stock(ticker):
    ticker = ticker.strip("<>").upper()

    stock = yf.Ticker(ticker)

    try:
        # Fetch stock info
        current_price = stock.info.get("currentPrice")
        previous_close = stock.info.get("previousClose")
        price_change = None
        percentage_change = None

        if current_price and previous_close:
            price_change = current_price - previous_close
            percentage_change = (price_change / previous_close) * 100

        day_low = stock.info.get("dayLow", 0)
        day_high = stock.info.get("dayHigh", 0)
        day_range = day_high - day_low if day_low and day_high else None

        stock_info = {
            "ticker": ticker,
            "name": stock.info.get('shortName', 'N/A'),
            "fullName": stock.info.get("longName", "N/A"),
            "industry": stock.info.get("industry", "N/A"),
            "price": stock.history(period="1d")['Close'].iloc[-1] if not stock.history(period="1d").empty else "N/A",
            "dayHigh": day_high,
            "dayLow": day_low,
            "dayRange": day_range,
            "percentage_change": round(percentage_change, 2) if percentage_change else "N/A",
            "chart": create_chart(ticker)
        }

        return stock_info

    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return {"ticker": ticker, "error": str(e)}




def create_chart(ticker):
    today = datetime.date.today()

    one_year_ago = today - datetime.timedelta(days=365)

    stock_data = yf.download(ticker, start=one_year_ago, end=today)

    plt.figure(figsize=(12, 6))
    plt.plot(stock_data['Close'], label='Closing Price')
    plt.title(f"{ticker} Stock Price (Past Year)")
    plt.xlabel('Date')
    plt.ylabel('Price (USD)')
    plt.legend()
    plt.grid(True)
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    base64_image = base64.b64encode(buf.read()).decode('utf-8')
    return base64_image




