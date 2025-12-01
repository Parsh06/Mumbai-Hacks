import json
import time
import requests
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os

# Optional Selenium for dynamic websites (only import if available)
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print("⚠️  Selenium not available. JS-rendered sites will be skipped.")

# Headers to mimic a real browser
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
}

# Keywords to filter out non-news content
NOISE_KEYWORDS = [
    'subscribe', 'newsletter', 'download', 'app', 'cookie', 'privacy policy',
    'terms of service', 'copyright', 'all rights reserved', 'most watched',
    'trending now', 'latest news', 'also in news', 'more to explore',
    'read more', 'click here', 'advertise', 'contact us', 'about us',
    'follow us', 'social media', 'login', 'sign up', 'register',
    'wait for it', 'congratulations', 'you are now subscribed',
    'stock recommendations', 'buy/sell signals', 'market calendar',
    'find your first', 'board meeting', 'quarterly results'
]

# Navigation/section titles to exclude
NAVIGATION_TITLES = [
    'stock recommendations', 'buy/sell signals', 'market calendar',
    'bse announcement', 'find your first', 'latest news', 'trending',
    'most watched', 'also in news', 'more to explore', 'newsnews',
    'currency converter', 'calendar spread', 'digital real estate',
    'india inc\'s scorecard', 'cryptocurrencybitcoin', 'currenciesforex',
    'commoditybullion', 'ipostartups'
]

# Generic summaries to filter out
GENERIC_SUMMARIES = [
    'trending in markets', 'quick links', 'discover bonds that meet',
    'board meeting', 'quarterly results', 'download the mint app',
    'read premium stories', 'got a confidential news tip', 'subscribe',
    'download the app', 'read premium', 'sign up', 'log in'
]

def is_valid_article(title, summary, link):
    """Filter out non-news content."""
    if not title or len(title) < 15:  # Minimum meaningful title length
        return False
    
    title_lower = title.lower().strip()
    summary_lower = (summary or "").lower()
    
    # Filter out exact navigation titles
    if title_lower in NAVIGATION_TITLES:
        return False
    
    # Filter out navigation items and noise
    for keyword in NOISE_KEYWORDS:
        if keyword in title_lower or keyword in summary_lower:
            return False
    
    # Filter out very short or generic titles
    if title_lower in ['news', 'newsnews', 'latest', 'more', 'read', 'watch']:
        return False
    
    # Filter out titles that are just section headers
    if title_lower in ['india news', 'economy news', 'politics news', 'sports news',
                       'science news', 'defence news', 'international news', 'company news',
                       'market calendar', 'stock recommendations']:
        return False
    
    # Filter out company names without context (likely navigation)
    if len(title.split()) <= 2 and not any(char.isdigit() for char in title):
        # Check if it looks like just a company name
        if title_lower.isupper() or (title_lower[0].isupper() and not any(c in title for c in [':', '-', '?', '!'])):
            return False
    
    # Must have either a link or a meaningful summary
    if not link and (not summary or len(summary) < 20):
        return False
    
    # Filter out generic summaries
    if summary:
        if any(gs in summary_lower for gs in GENERIC_SUMMARIES):
            return False
        # Filter out very short generic summaries
        if len(summary) < 30 and any(word in summary_lower for word in ['trending', 'links', 'discover', 'find']):
            return False
    
    # Filter out section headers (titles that look like navigation)
    # Check for titles that are all caps or have no spaces (likely navigation)
    if title and (title.isupper() or len(title.split()) <= 2):
        # Allow if it has punctuation that suggests it's a real headline
        if not any(c in title for c in [':', '-', '?', '!', ',']):
            return False
    
    # Filter out titles that are clearly section headers
    section_indicators = ['bitcoin, blockchain', 'forex & futures', 'startups, grey market',
                         'bullion, base metals', 'all else', 'scorecard']
    if any(indicator in title_lower for indicator in section_indicators):
        return False
    
    return True

def extract_date(soup, article_elem=None):
    """Extract publication date from various formats."""
    date_str = ""
    
    # Try to find date in article element first
    if article_elem:
        time_tag = article_elem.find("time")
        if time_tag:
            date_str = time_tag.get("datetime", "") or time_tag.get_text(strip=True)
            if date_str and validate_date(date_str):
                return clean_date(date_str)
        
        # Look for date in various attributes
        for attr in ['data-date', 'data-published', 'data-time', 'pubdate']:
            date_str = article_elem.get(attr, "")
            if date_str and validate_date(date_str):
                return clean_date(date_str)
        
        # Look for date in text (common patterns)
        date_patterns = [
            r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}',
            r'\d{1,2}/\d{1,2}/\d{4}',
            r'\d{4}-\d{2}-\d{2}',
            r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4},\s+\d{1,2}:\d{2}',
        ]
        text = article_elem.get_text()
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(0)
                if validate_date(date_str):
                    return clean_date(date_str)
    
    # Try to find date in page metadata
    meta_date = soup.find("meta", property="article:published_time") or \
                soup.find("meta", attrs={"name": "publish-date"}) or \
                soup.find("meta", attrs={"name": "date"}) or \
                soup.find("meta", attrs={"name": "publishdate"})
    if meta_date:
        date_str = meta_date.get("content", "")
        if date_str and validate_date(date_str):
            return clean_date(date_str)
    
    return ""

def validate_date(date_str):
    """Validate if date string is reasonable."""
    if not date_str:
        return False
    
    # Check for obviously invalid dates
    if '00-00' in date_str or '00/00' in date_str:
        return False
    
    # Check if it contains year (should be 2020-2030 range)
    year_match = re.search(r'20[2-3][0-9]', date_str)
    if not year_match:
        return False
    
    year = int(year_match.group(0))
    if year < 2020 or year > 2030:
        return False
    
    return True

def clean_date(date_str):
    """Clean and normalize date string."""
    if not date_str:
        return ""
    
    # Remove timezone info if present
    date_str = re.sub(r'[+\-]\d{2}:\d{2}$', '', date_str)
    date_str = re.sub(r'Z$', '', date_str)
    
    return date_str.strip()

def extract_category(soup, article_elem=None, url=""):
    """Extract article category."""
    category = ""
    
    # Try meta tags
    meta_cat = soup.find("meta", property="article:section") or \
               soup.find("meta", attrs={"name": "category"})
    if meta_cat:
        category = meta_cat.get("content", "")
    
    # Try to extract from URL
    if not category and url:
        path_parts = urlparse(url).path.strip('/').split('/')
        if len(path_parts) > 1:
            category = path_parts[0].replace('-', ' ').title()
    
    return category

def clean_text(text):
    """Clean and normalize text."""
    if not text:
        return ""
    text = " ".join(str(text).split())
    text = text.replace('â‚¹', '₹').replace('\xa0', ' ').replace('\u2019', "'")
    return text.strip()

# --------------------------------------------------------
# 1) STATIC SCRAPER – Universal <article> parser
# --------------------------------------------------------
def scrape_static_article(url):
    """Scrape articles from static HTML pages."""
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, "lxml")
        articles = []
        seen_titles = set()
        
        for article in soup.find_all("article"):
            title_tag = article.find(["h1", "h2", "h3"])
            if not title_tag:
                continue
            
            title = clean_text(title_tag.get_text())
            if not title or title.lower() in seen_titles:
                continue
            
            seen_titles.add(title.lower())
            
            # Extract link
            link_elem = title_tag.find("a") or article.find("a", href=True)
            link = ""
            if link_elem and link_elem.get("href"):
                link = link_elem["href"]
                if not link.startswith('http'):
                    if link.startswith('//'):
                        link = f"https:{link}"
                    elif link.startswith('/'):
                        link = urljoin(url, link)
            
            # Extract summary - try multiple selectors
            summary = ""
            summary_candidates = []
            
            # Try multiple selectors (prioritize specific classes)
            for selector in [".summary", ".excerpt", ".description", ".lead", ".intro",
                           "[class*='summary']", "[class*='excerpt']", "[class*='description']",
                           "[class*='lead']", "[class*='intro']"]:
                summary_elems = article.select(selector)
                for elem in summary_elems[:2]:  # Limit to first 2 matches per selector
                    text = clean_text(elem.get_text())
                    if text and len(text) > 40 and len(text) < 500:
                        # Filter out generic text
                        text_lower = text.lower()
                        if not any(gs in text_lower for gs in GENERIC_SUMMARIES):
                            summary_candidates.append(text)
            
            # If no good summary found, try paragraphs
            if not summary_candidates:
                paragraphs = article.find_all("p")
                for p in paragraphs[:3]:  # Check first 3 paragraphs
                    text = clean_text(p.get_text())
                    if text and len(text) > 40 and len(text) < 500:
                        text_lower = text.lower()
                        if not any(gs in text_lower for gs in GENERIC_SUMMARIES):
                            summary_candidates.append(text)
                            break  # Use first good paragraph
            
            # Use the longest meaningful summary
            if summary_candidates:
                summary = max(summary_candidates, key=len)
            
            # Extract date
            date_str = extract_date(soup, article)
            
            # Extract category
            category = extract_category(soup, article, link or url)
            
            # Filter valid articles
            if is_valid_article(title, summary, link):
                articles.append({
                    "title": title,
                    "link": link,
                    "summary": summary[:400] if summary else "",
                    "date": date_str,
                    "category": category,
                    "source": url,
                    "scraped_at": datetime.now(timezone.utc).isoformat()
                })
        
        return articles
    except Exception as e:
        print(f"    Error in static scraper: {e}")
        return []

# --------------------------------------------------------
# 2) UNIVERSAL HEADLINE SCRAPER – h1/h2/h3/h4 extraction
# --------------------------------------------------------
HEADLINE_TAGS = ["h1", "h2", "h3", "h4"]

def scrape_headlines(url):
    """Scrape headlines from h1-h4 tags."""
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, "lxml")
        articles = []
        seen_titles = set()
        
        for tag in HEADLINE_TAGS:
            for h in soup.find_all(tag):
                title = clean_text(h.get_text())
                
                if not title or len(title) < 15 or title.lower() in seen_titles:
                    continue
                
                seen_titles.add(title.lower())
                
                # Extract link
                link_elem = h.find("a", href=True)
                link = ""
                if link_elem:
                    link = link_elem["href"]
                    if not link.startswith('http'):
                        if link.startswith('//'):
                            link = f"https:{link}"
                        elif link.startswith('/'):
                            link = urljoin(url, link)
                
                # Extract summary from next paragraph
                summary = ""
                p = h.find_next("p")
                if p:
                    summary = clean_text(p.get_text())
                
                # Extract date
                date_str = extract_date(soup, h.parent if h.parent else None)
                
                # Extract category
                category = extract_category(soup, h.parent if h.parent else None, link or url)
                
                # Filter valid articles
                if is_valid_article(title, summary, link):
                    articles.append({
                        "title": title,
                        "link": link,
                        "summary": summary[:400] if summary else "",
                        "date": date_str,
                        "category": category,
                        "source": url,
                        "scraped_at": datetime.now(timezone.utc).isoformat()
                    })
        
        return articles
    except Exception as e:
        print(f"    Error in headline scraper: {e}")
        return []

# --------------------------------------------------------
# 3) CATEGORY PAGE CRAWLER (Moneycontrol, Business websites)
# --------------------------------------------------------
def crawl_pages(url, pages=3):
    """Crawl multiple pages of a category/news listing."""
    all_news = []
    seen_titles = set()
    
    try:
        for p in range(1, pages + 1):
            page_url = f"{url}/page-{p}" if p > 1 else url
            
            try:
                response = requests.get(page_url, headers=headers, timeout=30)
                response.encoding = 'utf-8'
                
                if response.status_code != 200:
                    continue
                
                soup = BeautifulSoup(response.text, "lxml")
                
                # Try multiple selectors for news items
                selectors = [
                    "article", "li.article", "div.article", "div.story",
                    "h2 a", "h3 a", ".headline a", ".title a", "[class*='news'] a"
                ]
                
                for selector in selectors:
                    elements = soup.select(selector)
                    for elem in elements:
                        # Extract title
                        title_elem = elem if elem.name in ['h2', 'h3'] else elem.find(['h2', 'h3', 'a'])
                        if not title_elem:
                            title_elem = elem
                        
                        title = clean_text(title_elem.get_text())
                        
                        if not title or len(title) < 15 or title.lower() in seen_titles:
                            continue
                        
                        seen_titles.add(title.lower())
                        
                        # Extract link
                        link_elem = elem if elem.name == 'a' else elem.find("a", href=True)
                        link = ""
                        if link_elem and link_elem.get("href"):
                            link = link_elem["href"]
                            if not link.startswith('http'):
                                if link.startswith('//'):
                                    link = f"https:{link}"
                                elif link.startswith('/'):
                                    link = urljoin(page_url, link)
                        
                        # Extract summary
                        summary = ""
                        summary_elem = elem.find_next("p") or elem.find("p")
                        if summary_elem:
                            summary = clean_text(summary_elem.get_text())
                        
                        # Extract date
                        date_str = extract_date(soup, elem)
                        
                        # Extract category
                        category = extract_category(soup, elem, link or page_url)
                        
                        # Filter valid articles
                        if is_valid_article(title, summary, link):
                            all_news.append({
                                "title": title,
                                "link": link,
                                "summary": summary[:400] if summary else "",
                                "date": date_str,
                                "category": category,
                                "source": page_url,
                                "scraped_at": datetime.now(timezone.utc).isoformat()
                            })
                
                # Be polite - delay between pages
                if p < pages:
                    time.sleep(2)
            
            except Exception as e:
                print(f"    Error on page {p}: {e}")
                continue
        
        return all_news
    except Exception as e:
        print(f"    Error in page crawler: {e}")
        return []

# --------------------------------------------------------
# 4) DYNAMIC JS SCRAPER (Economic Times, HT, LiveMint)
# --------------------------------------------------------
def scrape_js(url):
    """Scrape JavaScript-rendered content using Selenium."""
    if not SELENIUM_AVAILABLE:
        return []
    
    try:
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument(f"user-agent={headers['User-Agent']}")
        
        driver = webdriver.Chrome(options=options)
        driver.get(url)
        time.sleep(3)  # Wait for JS to render
        
        soup = BeautifulSoup(driver.page_source, 'lxml')
        driver.quit()
        
        articles = []
        seen_titles = set()
        
        for article in soup.find_all("article"):
            title_tag = article.find(["h1", "h2", "h3"])
            if not title_tag:
                continue
            
            title = clean_text(title_tag.get_text())
            
            if not title or len(title) < 15 or title.lower() in seen_titles:
                continue
            
            seen_titles.add(title.lower())
            
            link_elem = title_tag.find("a") or article.find("a", href=True)
            link = ""
            if link_elem and link_elem.get("href"):
                link = link_elem["href"]
                if not link.startswith('http'):
                    if link.startswith('//'):
                        link = f"https:{link}"
                    elif link.startswith('/'):
                        link = urljoin(url, link)
            
            p = article.find("p")
            summary = clean_text(p.get_text()) if p else ""
            
            date_str = extract_date(soup, article)
            category = extract_category(soup, article, link or url)
            
            if is_valid_article(title, summary, link):
                articles.append({
                    "title": title,
                    "link": link,
                    "summary": summary[:400] if summary else "",
                    "date": date_str,
                    "category": category,
                    "source": url,
                    "scraped_at": datetime.now(timezone.utc).isoformat()
                })
        
        return articles
    except Exception as e:
        print(f"    Error in JS scraper: {e}")
        return []

# --------------------------------------------------------
# MASTER SCRAPER – COMBINING ALL TECHNIQUES
# --------------------------------------------------------
NEWS_SITES = [
    # Financial/Business News (Priority)
    "https://www.moneycontrol.com/news/business/stocks/",
    "https://www.business-standard.com/markets",
    "https://economictimes.indiatimes.com/markets",
    "https://www.livemint.com/market",
    "https://www.financialexpress.com/market/",
    
    # General News
    "https://www.bbc.com/news/business",
    "https://www.cnbc.com/world/",
    "https://www.reuters.com/business/",
    "https://www.ndtv.com/business",
]

def run_super_scraper():
    """Run all scraping techniques on all news sites."""
    final_news = []
    seen_articles = set()  # Track by title to avoid duplicates
    
    print("🚀 Starting Super News Scraper...")
    print("=" * 60)
    
    for idx, site in enumerate(NEWS_SITES, 1):
        print(f"\n[{idx}/{len(NEWS_SITES)}] 🔎 Scraping: {site}")
        
        site_articles = []
        
        # Try static article scraper
        print("  → Trying static article scraper...", end=" ")
        articles = scrape_static_article(site)
        if articles:
            print(f"✅ Found {len(articles)} articles")
            site_articles.extend(articles)
        else:
            print("❌ No articles")
        
        # Try headline scraper
        print("  → Trying headline scraper...", end=" ")
        articles = scrape_headlines(site)
        if articles:
            print(f"✅ Found {len(articles)} articles")
            site_articles.extend(articles)
        else:
            print("❌ No articles")
        
        # Try page crawler
        print("  → Trying page crawler...", end=" ")
        articles = crawl_pages(site, pages=2)
        if articles:
            print(f"✅ Found {len(articles)} articles")
            site_articles.extend(articles)
        else:
            print("❌ No articles")
        
        # Try JS scraper (only if Selenium available)
        if SELENIUM_AVAILABLE:
            print("  → Trying JS scraper...", end=" ")
            articles = scrape_js(site)
            if articles:
                print(f"✅ Found {len(articles)} articles")
                site_articles.extend(articles)
            else:
                print("❌ No articles")
        else:
            print("  → Skipping JS scraper (Selenium not available)")
        
        # Deduplicate and add to final list
        for article in site_articles:
            title_key = article.get("title", "").lower().strip()
            if title_key and title_key not in seen_articles:
                seen_articles.add(title_key)
                final_news.append(article)
        
        unique_count = len([a for a in site_articles if a.get('title', '').lower().strip() in seen_articles])
        print(f"  📊 Total unique articles from this site: {unique_count}")
        
        # Be polite - delay between sites
        if idx < len(NEWS_SITES):
            time.sleep(2)
    
    return final_news

# --------------------------------------------------------
# MAIN FUNCTION
# --------------------------------------------------------
def main():
    """Main function to scrape and save news."""
    print("=" * 60)
    print("🚀 FinSightAi Super News Scraper")
    print("=" * 60)
    print()
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'news.json')
    
    try:
        # Run the super scraper
        news_data = run_super_scraper()
        
        if not news_data:
            print("\n⚠️  No news articles were scraped.")
            print("   This might be due to:")
            print("   1. Website blocking/rate limiting")
            print("   2. Network connectivity issues")
            print("   3. Website structure changes")
            return
        
        # Create final output structure
        output_data = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_articles": len(news_data),
            "sources_scraped": len(NEWS_SITES),
            "articles": news_data
        }
        
        # Save to JSON file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print()
        print("=" * 60)
        print(f"✅ Successfully scraped {len(news_data)} unique news articles")
        print(f"📁 Saved to: {output_path}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
