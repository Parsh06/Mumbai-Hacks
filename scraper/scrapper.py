import requests
import re
import time
import pandas as pd
from bs4 import BeautifulSoup
import os
import json
from datetime import datetime

def clean_text(text):
    """Clean and normalize text content."""
    if not text:
        return ""
    text = str(text).replace('â‚¹', '₹').replace('\xa0', ' ')
    return " ".join(text.split())

def parse_table(section_id, soup):
    """Parse a table from a specific section and return it as DataFrame."""
    section = soup.find("section", id=section_id)
    if not section:
        return None

    table = section.find("table", class_="data-table responsive-text-nowrap")
    if not table:
        return None

    headers = [clean_text(th.text) for th in table.find_all("th")]
    rows = []
    for row in table.find_all("tr")[1:]:
        cols = [clean_text(td.text) for td in row.find_all("td")]
        if cols:
            rows.append(cols)

    if rows and headers:
        return pd.DataFrame(rows, columns=headers)
    return None

def fetch_company_data(company_code, headers):
    """Fetch data for a single company and return structured dict."""
    url = f"https://www.screener.in/company/{company_code}/"
    print(f"\n🔍 Fetching data for {company_code} from {url}...")

    result = {
        "company_code": company_code,
        "url": url,
        "name": None,
        "about": None,
        "pros": [],
        "cons": [],
        "key_ratios": [],
        "tables": {},
        "status": "success",
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.encoding = 'utf-8'

        if response.status_code != 200:
            result["status"] = f"http_error_{response.status_code}"
            return result

        soup = BeautifulSoup(response.text, "html.parser")

        # Company Name
        company_name_tag = soup.select_one("h1.h2.shrink-text")
        if company_name_tag:
            result["name"] = clean_text(company_name_tag.text)

        # Company About
        about_text = soup.select_one("main.container .company-info p")
        if about_text:
            result["about"] = re.sub(r"\[\d+\]", "", clean_text(about_text.text))

        # Pros & Cons
        pros = soup.select("section#analysis .pros ul li")
        cons = soup.select("section#analysis .cons ul li")
        result["pros"] = [clean_text(li.text) for li in pros] if pros else []
        result["cons"] = [clean_text(li.text) for li in cons] if cons else []

        # Top Ratios
        top_ratios = soup.select("ul#top-ratios li")
        if top_ratios:
            ratio_data = []
            for item in top_ratios:
                metric = item.select_one("span.name")
                value = item.select_one("span.value")
                if metric and value:
                    ratio_data.append({
                        "metric": clean_text(metric.text),
                        "value": clean_text(value.text)
                    })
            result["key_ratios"] = ratio_data

        # Tables
        table_sections = {
            "quarters": "Quarterly Results",
            "profit-loss": "Profit and Loss",
            "cash-flow": "Cash Flow",
            "balance-sheet": "Balance Sheet",
            "ratios": "Ratios",
        }

        for section_id, title in table_sections.items():
            df = parse_table(section_id, soup)
            if df is not None:
                result["tables"][title] = df.to_dict(orient="records")

    except Exception as e:
        result["status"] = f"error: {str(e)}"

    return result

# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(OUTPUT_DIR, "company.json")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Sample list of 100 company codes (NIFTY 100 + a few extras to ensure coverage)
COMPANY_CODES = [
    "RELIANCE","TCS","HDFCBANK","ICICIBANK","INFY","ITC","LT","KOTAKBANK","AXISBANK","SBIN",
    "BHARTIARTL","ASIANPAINT","MARUTI","SUNPHARMA","BAJFINANCE","TITAN","HCLTECH","ADANIGREEN","ADANIPORTS","NESTLEIND",
    "ULTRACEMCO","BAJAJFINSV","POWERGRID","TATAMOTORS","ONGC","WIPRO","HINDUNILVR","COALINDIA","ADANIENT","HDFCLIFE",
    "VBL","NTPC","JSWSTEEL","HINDALCO","DIVISLAB","TECHM","HEROMOTOCO","M&M","BRITANNIA","TATACONSUM",
    "TATASTEEL","CIPLA","DRREDDY","BPCL","SHREECEM","EICHERMOT","INDUSINDBK","BAJAJ-AUTO","DLF","UBL",
    "PIDILITIND","SIEMENS","GRASIM","TRENT","APOLLOHOSP","GODREJCP","LTIM","BANKBARODA","AMBUJACEM","HAVELLS",
    "ICICIGI","ICICIPRULI","PEL","PNB","INDIGO","TATAPOWER","BIOCON","CHOLAFIN","ADANIPOWER","COLPAL",
    "MCDOWELL-N","VEDL","ABB","HAL","TORNTPHARM","TVSMOTOR","SBICARD","CANBK","IDFCFIRSTB","BANDHANBNK",
    "JINDALSTEL","MFSL","LICHSGFIN","BOSCHLTD","NAUKRI","AUBANK","AUROPHARMA","BERGEPAINT","DALBHARAT","DABUR",
    "MRF","PIIND","SRF","HERITGFOOD","MUTHOOTFIN","PAGEIND","ZOMATO","NYKAA","PAYTM","POLYCAB"
]

MAX_COMPANIES = 100

def main():
    print(f"{'='*80}")
    print(f"🚀 Starting Screener Scraper for {MAX_COMPANIES} companies")
    print(f"{'='*80}\n")

    scraped_data = []
    total = 0

    for code in COMPANY_CODES:
        if total >= MAX_COMPANIES:
            break

        data = fetch_company_data(code, HEADERS)
        scraped_data.append(data)
        total += 1

        # polite delay
        time.sleep(1.5)

    # Save to JSON
    output_payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_companies": len(scraped_data),
        "companies": scraped_data,
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)

    success_count = len([c for c in scraped_data if c["status"] == "success"])
    print(f"\n{'='*80}")
    print(f"✨ Scraping complete!")
    print(f"✅ Successful: {success_count}")
    print(f"⚠️ Failed: {len(scraped_data) - success_count}")
    print(f"📄 Output saved to: {OUTPUT_JSON}")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
