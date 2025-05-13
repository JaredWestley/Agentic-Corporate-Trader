import yfinance as yf
import pandas as pd
from pandas import DataFrame
from crewai_tools import BaseTool

class Financial_information_retrieval(BaseTool):
    name: str = "Financial Information Retrieval Tool"
    description: str = "Get financial information about a given stock using the ticker"

    def _run(self, ticker: str) -> DataFrame:
        """
        Retrieve financial information for a stock
        """

        stock = yf.Ticker(ticker)
        balance_sheet = stock.balance_sheet
        balance_sheet.fillna(0, inplace=True)
        return balance_sheet
