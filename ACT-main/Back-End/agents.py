from typing import List
from crewai import Agent, Task, Crew, Process, LLM
import os
from dotenv import load_dotenv
import requests
from pydantic import BaseModel
from datetime import date
from crewai_tools import SeleniumScrapingTool
from tools import Financial_information_retrieval
from langchain_community.tools.asknews import AskNewsSearch
from langchain.agents import Tool
from langchain_openai import ChatOpenAI

load_dotenv()
OPEN_AI_KEY = os.getenv("OPENAI_API_KEY")
OPEN_AI_URL = "https://api.openai.com/v1"
GROQ_KEY = os.getenv("GROQ_KEY")



llama = LLM(
    model="ollama/llama3.2act",
    base_url="http://localhost:11434",
)






ask_news = AskNewsSearch()
ask_news_tool = Tool(
    name="News Tool",
    func=ask_news.run,
    description="Useful fopr gathering news about stocks"
)


class Stock(BaseModel):
    ticker: str
    name: str
    short_description: str
    buy_hold_sell_recomendation: str
    report: str
    predicted_future_price: str

class Model(BaseModel):
    stocks: List[Stock]

openai = LLM(model="gpt-4o", api_key=OPEN_AI_KEY,base_url=OPEN_AI_URL )
groqai = LLM(model="llama3-70b-8192", api_key=GROQ_KEY, base_url="https://api.groq.com/openai/v1/")




def buy_hold_sell_recomendation(ticker):
    researcher = Agent(
    llm = groqai,
    role="Senior Stock Researcher",
    goal=f"gather as much recent information about current stock market news for this stock {ticker}. Do not make up any news stories",
    backstory="A highly experienced researcher, you specialize in gathering and interpreting critical stock data, market news, and trends. You're renowned for finding relevant insights, and now you're tasked with supporting an important financial mission.",
    tools=[ask_news_tool],
    verbose=True,
    allow_delegation=False,
)

    accountant = Agent(
    llm=openai,
    role="Financial Accountant",
    goal=f"Provide comprehensive analysis of financial health by calculating liquidity ratios for this stock: {ticker}, impressing customers with detailed stock evaluations. Ensure calculations are correct, do not make up calculations",
    backstory="With a strong background in financial analysis, you excel at interpreting financial statements and calculating liquidity ratios. Now you must analyze the performance of key stocks for a prestigious customer, ensuring thorough and accurate accounting evaluations.",
    tools=[Financial_information_retrieval()],
    verbose=True,
    allow_delegation=False
    )

    recommender = Agent(
    llm=openai,
    role="Investment Recommender",
    goal=f"Analyse the data given by the researcher and the accountant to provide accurate buy/sell recomendations for the  stock: {ticker}, also provide a predicted future price" ,
    backstory="Known for your sharp decision-making skills, you synthesize multiple financial insights and market conditions to create strategic recommendations. Your job now is to guide an important customer with the best stock market decisions.",
    verbose=True,
    allow_delegation=False
    )

    blogger = Agent(
        ##Fix llm = phi not running
        llm=openai,
    role="Financial Blogger",
    goal="Deliver well-written, insightful financial reports for the stock",
    backstory="As a seasoned financial writer, you excel in transforming complex data into simple, readable content. You're now responsible for crafting polished reports that impress a high-profile customer with the quality of your communication.",
    verbose=True,
    allow_delegation=False
    )

    task1 = Task(
    description="Provide a comprehensive report about the current tecjhnology market specifically for the given stock, Do your best to find news about the given stock",
    agent=researcher,
    expected_output="A comprehensive report that will be sent to an investment recomender"
    )


    task2 = Task(
    description="Calculate liquidity ratios for the stock based on the data provided by the tool.",
    agent=accountant,
    expected_output="A report of liquidity ratios necessary for the next agent to make recomendations"
    )


    task3 = Task(
    description="Analyze the  data to generate a buy, or sell recommendation for the stock and also a predicted future price.",
    agent=recommender,
    expected_output="A buy, sell, or hold recommendation for the stock, based on the data given by the researcher and the accountant."
    )


    task4 = Task(
    description="Format the research, financial analysis, and recommendations into a well-structured report that is easy to understand for customers",
    agent=blogger,
    expected_output="A clear comprehensive report for the stock",
    output_json=Model
    )
    
    crew = Crew(
        agents=[researcher, accountant, recommender, blogger],
        tasks=[task1, task2, task3, task4], 
        verbose=True,
        process=Process.sequential
    )

    crew_output = crew.kickoff()
    task_output =task4.output
    if task_output.json_dict:
        return task_output.json_dict








def run_agents(ticker):
    #return suggest_first_stocks()
    ticker = str(ticker).lower()
    predictions = buy_hold_sell_recomendation(ticker)
    return predictions



if __name__ =="__main__":
    ticker = "AAPL"
    run_agents(ticker)