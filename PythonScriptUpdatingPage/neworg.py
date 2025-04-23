from newsapi import NewsApiClient
import json

# ✅ Initialize the client with your API key
newsapi = NewsApiClient(api_key='76ad70ff99cf4e3a80a7d2fcb45c574a')

# ✅ Top Headlines
try:
    top_headlines = newsapi.get_top_headlines(
        q='bitcoin',
        sources='bbc-news,the-verge',
        category='business',
        language='en',
        country='us'
    )
    print("🔹 Top Headlines:")
    for article in top_headlines['articles']:
        print(f"- {article['title']} ({article['source']['name']})")
except Exception as e:
    print("⚠️ Error fetching top headlines:", e)

# ✅ Everything Search
try:
    all_articles = newsapi.get_everything(
        q='bitcoin',
        sources='bbc-news,the-verge',
        domains='bbc.co.uk,techcrunch.com',
        from_param='2017-12-01',
        to='2017-12-12',
        language='en',
        sort_by='relevancy',
        page=2
    )
    print("\n🔹 All Articles:")
    for article in all_articles['articles']:
        print(f"- {article['title']} ({article['source']['name']})")
except Exception as e:
    print("⚠️ Error fetching all articles:", e)

# ✅ News Sources
try:
    sources = newsapi.get_sources()
    print("\n🔹 News Sources:")
    for source in sources['sources']:
        print(f"- {source['name']} ({source['category']})")
except Exception as e:
    print("⚠️ Error fetching sources:", e)
