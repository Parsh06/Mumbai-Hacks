"""
News Scraper for Commonwealth Countries
Scrapes news articles from RSS feeds and saves to news_scrapped.json
"""

import requests
import json
from bs4 import BeautifulSoup
from datetime import datetime
import time
import os

# News sources configuration
SOURCES = {
    "Times of India": {
        "RSSlink": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "Country": "India"
    },
    "NDTV": {
        "RSSlink": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "Country": "India"
    },
    "The Hindu": {
        "RSSlink": "https://www.thehindu.com/news/national/feeder/default.rss",
        "Country": "India"
    },
    "Mint Politics": {
        "RSSlink": "https://www.livemint.com/rss/politics",
        "Country": "India"
    },
    "Mint News": {
        "RSSlink": "https://www.livemint.com/rss/news",
        "Country": "India"
    },
    "CNBC Politics": {
        "RSSlink": "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/politics.xml",
        "Country": "India"
    },
    "CNBC Economics": {
        "RSSlink": "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/economy.xml",
        "Country": "India"
    },
    "CNBC World": {
        "RSSlink": "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/world.xml",
        "Country": "India"
    },
    "CNBC Market": {
        "RSSlink": "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml",
        "Country": "India"
    },
    "DNA India": {
        "RSSlink": "https://www.dnaindia.com/feeds/india.xml",
        "Country": "India"
    },
    "The Star Online": {
        "RSSlink": "https://www.thestar.com.my/rss/News/Nation",
        "Country": "Malaysia"
    },
    "The Sun (Malaysia)": {
        "RSSlink": "https://thesun.my/rss/local",
        "Country": "Malaysia"
    },
    "Free Malaysia Today": {
        "RSSlink": "https://www.freemalaysiatoday.com/category/nation/feed/",
        "Country": "Malaysia"
    },
    "The Sydney Morning Herald": {
        "RSSlink": "https://www.smh.com.au/rss/feed.xml",
        "Country": "Australia"
    },
    "Independent Australia": {
        "RSSlink": "http://feeds.feedburner.com/IndependentAustralia",
        "Country": "Australia"
    },
    "The Age": {
        "RSSlink": "https://www.theage.com.au/rss/feed.xml",
        "Country": "Australia"
    },
    "The Straits Times": {
        "RSSlink": "https://www.straitstimes.com/news/singapore/rss.xml",
        "Country": "Singapore"
    },
    "Channel NewsAsia": {
        "RSSlink": "https://www.channelnewsasia.com/rssfeeds/8395986",
        "Country": "Singapore"
    },
    "Business Times": {
        "RSSlink": "https://www.businesstimes.com.sg/rss/singapore",
        "Country": "Singapore"
    },
    "CBC News": {
        "RSSlink": "https://www.cbc.ca/webfeed/rss/rss-world",
        "Country": "Canada"
    },
    "Toronto Star": {
        "RSSlink": "https://www.thestar.com/search/?f=rss&t=article&c=news/canada*&l=50&s=start_time&sd=desc",
        "Country": "Canada"
    },
    "Global News (Canada)": {
        "RSSlink": "https://globalnews.ca/feed/",
        "Country": "Canada"
    }
}

# Headers to mimic browser requests
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def scrape_article(link, source, country):
    """
    Scrape individual article content from a URL
    
    Args:
        link: URL of the article
        source: Name of the news source
        country: Country of the news source
    
    Returns:
        dict: Article data or None if scraping fails
    """
    try:
        resp = requests.get(link, headers=HEADERS, timeout=15)
        resp.raise_for_status()

        # Parse HTML with built-in parser to avoid lxml dependency
        soup = BeautifulSoup(resp.content, "html.parser")

        # Best-effort title
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else "No title"

        # Naive content extraction: join all <p> texts
        paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        content = "\n\n".join(paragraphs)

        return {
            "title": title,
            "link": link,
            "content": content,
            "source": source,
            "source_country": country,
            "scraped_at": datetime.now().isoformat(),
        }
    except Exception as e:
        print(f"  ⚠️  Error scraping article {link}: {str(e)}")
        return None


def scrape_rss_feed(source_name, rss_url, country, max_articles=10):
    """
    Scrape articles from an RSS feed
    
    Args:
        source_name: Name of the news source
        rss_url: URL of the RSS feed
        country: Country of the news source
        max_articles: Maximum number of articles to scrape per source
    
    Returns:
        list: List of scraped articles
    """
    articles = []
    
    try:
        print(f"\n📰 Scraping {source_name} ({country})...")
        
        # Fetch RSS feed
        response = requests.get(rss_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        # Parse XML
        soup = BeautifulSoup(response.content, "xml")
        items = soup.find_all("item")
        
        if not items:
            print(f"  ❌ No articles found in RSS feed")
            return articles
        
        print(f"  Found {len(items)} items in RSS feed")
        
        # Process each item
        for idx, item in enumerate(items[:max_articles], 1):
            try:
                # Extract link
                link_elem = item.find("link")
                if not link_elem:
                    continue
                
                link = link_elem.text.strip() if hasattr(link_elem, 'text') else str(link_elem).strip()
                if not link:
                    continue
                
                # Extract basic info from RSS
                title_elem = item.find("title")
                title = title_elem.text.strip() if title_elem and hasattr(title_elem, 'text') else "No title"
                
                desc_elem = item.find("description")
                description = desc_elem.text.strip() if desc_elem and hasattr(desc_elem, 'text') else ""
                
                pub_date_elem = item.find("pubDate")
                published_date = pub_date_elem.text.strip() if pub_date_elem and hasattr(pub_date_elem, 'text') else ""
                
                # Scrape full article content
                print(f"  [{idx}/{min(len(items), max_articles)}] Scraping: {title[:60]}...")
                article_data = scrape_article(link, source_name, country)
                
                if article_data:
                    # Add RSS metadata
                    article_data["description"] = description
                    article_data["published_date"] = published_date
                    articles.append(article_data)
                    time.sleep(1)  # Be respectful to servers
                else:
                    # If scraping fails, still save RSS data
                    articles.append({
                        "title": title,
                        "link": link,
                        "description": description,
                        "published_date": published_date,
                        "content": "",  # Empty if scraping failed
                        "source": source_name,
                        "source_country": country,
                        "scraped_at": datetime.now().isoformat()
                    })
                
            except Exception as e:
                print(f"  ⚠️  Error processing item {idx}: {str(e)}")
                continue
        
        print(f"  ✅ Successfully scraped {len(articles)} articles from {source_name}")
        
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error fetching RSS feed: {str(e)}")
    except Exception as e:
        print(f"  ❌ Unexpected error: {str(e)}")
    
    return articles


def scrape_all_news():
    """
    Scrape news from all configured sources
    
    Returns:
        list: All scraped articles
    """
    all_articles = []
    total_sources = len(SOURCES)
    
    print("=" * 60)
    print("🚀 Starting News Scraping Process")
    print(f"📊 Total sources: {total_sources}")
    print("=" * 60)
    
    for idx, (source_name, source_info) in enumerate(SOURCES.items(), 1):
        print(f"\n[{idx}/{total_sources}] Processing: {source_name}")
        
        rss_url = source_info["RSSlink"]
        country = source_info["Country"]
        
        articles = scrape_rss_feed(source_name, rss_url, country, max_articles=10)
        all_articles.extend(articles)
        
        # Small delay between sources
        if idx < total_sources:
            time.sleep(2)
    
    return all_articles


def save_articles(articles, filename="news.json"):
    """
    Save scraped articles to JSON file
    
    Args:
        articles: List of article dictionaries
        filename: Output filename
    """
    # Get the base scraper directory (one level up from this file)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    output_dir = os.path.join(base_dir, "scraped-data")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 60)
        print(f"✅ Successfully saved {len(articles)} articles to {filepath}")
        print("=" * 60)
        
        # Print summary statistics
        print("\n📊 Summary Statistics:")
        print(f"  Total articles: {len(articles)}")
        
        # Count by country
        country_counts = {}
        for article in articles:
            country = article.get("source_country", "Unknown")
            country_counts[country] = country_counts.get(country, 0) + 1
        
        print("\n  Articles by country:")
        for country, count in sorted(country_counts.items()):
            print(f"    {country}: {count}")
        
        # Count by source
        source_counts = {}
        for article in articles:
            source = article.get("source", "Unknown")
            source_counts[source] = source_counts.get(source, 0) + 1
        
        print("\n  Articles by source:")
        for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"    {source}: {count}")
        
    except Exception as e:
        print(f"\n❌ Error saving file: {str(e)}")
        raise


def main():
    """Main execution function"""
    print("\n" + "=" * 60)
    print("🌍 Commonwealth News Scraper")
    print("=" * 60)
    
    # Scrape all news
    articles = scrape_all_news()
    
    if not articles:
        print("\n❌ No articles were scraped. Please check your internet connection and RSS feed URLs.")
        return
    
    # Save to JSON file in scraped-data/news.json
    save_articles(articles, "news.json")
    
    print("\n✨ Scraping completed successfully!")


if __name__ == "__main__":
    main()

