from yahoo_fin import news
from typing import List, Dict
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

def get_latest_headlines(ticker: str) -> List[Dict]:
    try:
        headlines = news.get_yf_rss(ticker)
        if not headlines:
            return [{"title": "No news available", "sentiment": 0.0}]

        formatted_headlines = []
        for h in headlines[:5]:
            title = h.get('title', 'No title available')
            # Analyze sentiment of the title
            sentiment_score = analyzer.polarity_scores(title)['compound']
            formatted_headlines.append({
                'title': title,
                'date': h.get('published', 'No date available'),
                'link': h.get('link', ''),
                'sentiment': sentiment_score  # Add sentiment score (-1 to 1)
            })
        return formatted_headlines
    except Exception as e:
        print(f"⚠ Error fetching news: {str(e)}")
        return [{"title": "News not available", "sentiment": 0.0}]