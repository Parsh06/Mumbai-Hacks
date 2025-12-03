import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin, urlparse
import re
from datetime import datetime

# ========================= IMPROVED SCRAPER FOR A SINGLE PAGE =========================

def clean_text(text):
    """Clean and normalize text."""
    if not text:
        return ""
    # Remove extra whitespace and newlines
    text = re.sub(r'\s+', ' ', text.strip())
    return text


def extract_key_value_pairs(soup):
    """Extract key-value pairs from common IPO page structures."""
    key_values = {}
    
    # Look for common patterns: dt/dd, label/value pairs, etc.
    for dt in soup.find_all(['dt', 'label', 'strong', 'b']):
        key = clean_text(dt.get_text())
        if not key or len(key) > 100:  # Skip very long keys
            continue
            
        # Find associated value
        value = None
        
        # Check for dd element (common in definition lists)
        dd = dt.find_next_sibling('dd')
        if dd:
            value = clean_text(dd.get_text())
        
        # Check for next sibling with value
        if not value:
            next_elem = dt.find_next_sibling()
            if next_elem and next_elem.name not in ['dt', 'label', 'strong', 'b']:
                value = clean_text(next_elem.get_text())
        
        # Check parent's next sibling
        if not value and dt.parent:
            parent_next = dt.parent.find_next_sibling()
            if parent_next:
                value = clean_text(parent_next.get_text())
        
        if value and len(value) < 500:  # Only store reasonable length values
            key_values[key] = value
    
    return key_values


def extract_structured_tables(soup):
    """Extract tables with proper structure."""
    tables = []
    
    for table in soup.find_all("table"):
        table_data = {
            "headers": [],
            "rows": [],
            "caption": ""
        }
        
        # Extract caption if exists
        caption = table.find("caption")
        if caption:
            table_data["caption"] = clean_text(caption.get_text())
        
        # Extract headers from thead or first row
        thead = table.find("thead")
        if thead:
            header_row = thead.find("tr")
            if header_row:
                table_data["headers"] = [
                    clean_text(th.get_text()) 
                    for th in header_row.find_all(["th", "td"])
                ]
        else:
            # Try first row as header
            first_row = table.find("tr")
            if first_row:
                cells = first_row.find_all(["th", "td"])
                # Check if first row looks like headers (all th or has th)
                if any(cell.name == "th" for cell in cells) or len(cells) > 2:
                    table_data["headers"] = [
                        clean_text(cell.get_text()) 
                        for cell in cells
                    ]
        
        # Extract data rows
        tbody = table.find("tbody")
        rows_source = tbody.find_all("tr") if tbody else table.find_all("tr")
        
        # Skip header row if headers were extracted from first row
        start_idx = 1 if not thead and table_data["headers"] else 0
        
        for row in rows_source[start_idx:]:
            cells = row.find_all(["td", "th"])
            if not cells:
                continue
                
            row_data = [clean_text(cell.get_text()) for cell in cells]
            
            # Convert to dict if headers exist
            if table_data["headers"] and len(row_data) == len(table_data["headers"]):
                row_dict = dict(zip(table_data["headers"], row_data))
                table_data["rows"].append(row_dict)
            else:
                table_data["rows"].append(row_data)
        
        # Only add table if it has meaningful data
        if table_data["rows"] or table_data["headers"]:
            tables.append(table_data)
    
    return tables


def extract_meaningful_links(soup, base_url):
    """Extract only meaningful links (not navigation, scripts, etc.)."""
    meaningful_links = []
    seen_urls = set()
    
    # Skip common navigation/UI links
    skip_patterns = [
        '#', 'javascript:', 'mailto:', 'tel:',
        '/login', '/register', '/signup', '/logout',
        'facebook.com', 'twitter.com', 'linkedin.com',
        'instagram.com', 'youtube.com'
    ]
    
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        text = clean_text(a.get_text())
        
        # Skip if empty or matches skip patterns
        if not href or any(pattern in href.lower() for pattern in skip_patterns):
            continue
        
        # Skip if text is too short or just symbols
        if len(text) < 2 or text in ['#', '...', '»', '«', '←', '→']:
            continue
        
        # Build full URL
        full_url = urljoin(base_url, href)
        
        # Skip duplicates
        if full_url in seen_urls:
            continue
        seen_urls.add(full_url)
        
        meaningful_links.append({
            "text": text,
            "url": full_url,
            "type": "external" if urlparse(full_url).netloc != urlparse(base_url).netloc else "internal"
        })
    
    return meaningful_links


def extract_content_sections(soup):
    """Extract meaningful content sections organized by headings."""
    sections = []
    current_section = None
    
    # Find all headings and their following content
    for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div']):
        if element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            # Save previous section if exists
            if current_section and current_section.get('content'):
                sections.append(current_section)
            
            # Start new section
            current_section = {
                "heading": clean_text(element.get_text()),
                "level": int(element.name[1]),
                "content": []
            }
        elif current_section and element.name in ['p', 'div']:
            text = clean_text(element.get_text())
            # Only add meaningful paragraphs (not empty, not too short, not navigation)
            if text and len(text) > 20 and not any(
                skip in text.lower() for skip in ['cookie', 'privacy', 'terms', 'copyright', 'menu', 'navigation']
            ):
                current_section["content"].append(text)
    
    # Add last section
    if current_section and current_section.get('content'):
        sections.append(current_section)
    
    return sections


def scrape_single_page(url):
    """Scrapes a page with improved structure and data extraction."""
    
    print(f"🔍 Scraping: {url}")

    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
    except Exception as e:
        return {"error": f"Failed to fetch page: {str(e)}"}

    page_data = {
        "url": url,
        "title": clean_text(soup.title.string) if soup.title else "",
        "meta_description": "",
        "headings": {},
        "key_value_pairs": {},
        "tables": [],
        "content_sections": [],
        "links": [],
        "scraped_at": datetime.now().isoformat()
    }

    # Extract meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        page_data["meta_description"] = clean_text(meta_desc.get("content"))

    # ------ HEADINGS (organized by level) -------
    for tag in ["h1", "h2", "h3", "h4", "h5", "h6"]:
        headings = [
            clean_text(h.get_text()) 
            for h in soup.find_all(tag)
            if clean_text(h.get_text())  # Only non-empty headings
        ]
        if headings:
            page_data["headings"][tag] = headings

    # ------ KEY-VALUE PAIRS -------
    page_data["key_value_pairs"] = extract_key_value_pairs(soup)

    # ------ STRUCTURED TABLES -------
    page_data["tables"] = extract_structured_tables(soup)

    # ------ CONTENT SECTIONS (organized by headings) -------
    page_data["content_sections"] = extract_content_sections(soup)

    # ------ MEANINGFUL LINKS ONLY -------
    page_data["links"] = extract_meaningful_links(soup, url)

    return page_data


# ========================= SCRAPER FOR ALL TABS =========================

def scrape_all_tabs(base_url):
    """Scrapes base IPO page + every tab automatically with improved structure."""

    print("\n🔎 Fetching base page:", base_url)

    try:
        resp = requests.get(base_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
    except Exception as e:
        return {"error": f"Failed to fetch base page: {str(e)}"}

    # Extract company slug from the URL
    try:
        company_slug = urlparse(base_url).path.split("/")[2]
    except:
        company_slug = urlparse(base_url).path.replace("/", "_").strip("_")

    # Final JSON structure
    all_data = {
        "base_url": base_url,
        "company": company_slug,
        "scraped_at": datetime.now().isoformat(),
        "tabs": {}
    }

    # Find all navigation tabs
    nav_tabs = soup.select(".nav.nav-tabs a")

    tab_links = {}

    for a in nav_tabs:
        tab_name = clean_text(a.get_text())
        if not tab_name:
            continue
        tab_url = urljoin(base_url, a.get("href", ""))
        tab_links[tab_name] = tab_url

    # Always include the main page as "IPO Detail"
    tab_links["IPO Detail"] = base_url

    # Remove duplicates (keep first occurrence)
    seen_urls = set()
    unique_tabs = {}
    for name, url in tab_links.items():
        if url not in seen_urls:
            seen_urls.add(url)
            unique_tabs[name] = url
    tab_links = dict(sorted(unique_tabs.items()))

    print("\n📌 Tabs found:")
    for t, u in tab_links.items():
        print(f"  - {t}: {u}")

    print("\n=========== STARTING FULL SCRAPE ===========\n")

    # Scrape each tab
    for tab_name, tab_url in tab_links.items():
        try:
            print(f"📄 Scraping tab: {tab_name}...")
            tab_data = scrape_single_page(tab_url)
            all_data["tabs"][tab_name] = tab_data
            
            # Print summary
            tables_count = len(tab_data.get("tables", []))
            sections_count = len(tab_data.get("content_sections", []))
            links_count = len(tab_data.get("links", []))
            print(f"✅ Scraped: {tab_name} | Tables: {tables_count}, Sections: {sections_count}, Links: {links_count}")
        except Exception as e:
            print(f"❌ Error scraping {tab_name}: {e}")
            all_data["tabs"][tab_name] = {"error": str(e)}

    return all_data


# ========================= SAVE JSON =========================

def save_json(data, filename):
    """Save data to JSON file with proper formatting."""
    try:
        with open(filename, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        print(f"\n🎉 JSON saved as: {filename}")
        
        # Print summary
        total_tabs = len(data.get("tabs", {}))
        total_tables = sum(
            len(tab.get("tables", [])) 
            for tab in data.get("tabs", {}).values()
        )
        print(f"📊 Summary: {total_tabs} tabs scraped, {total_tables} tables extracted")
    except Exception as e:
        print(f"❌ Error saving JSON: {e}")


# ========================= MAIN =========================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("=== IMPROVED CHITTORGARH IPO SCRAPER ===")
    print("="*60 + "\n")
    
    base_url = input("Enter the IPO company URL: ").strip()
    
    if not base_url:
        print("❌ No URL provided!")
        exit(1)
    
    if not base_url.startswith("http"):
        print("❌ Invalid URL format. Please include http:// or https://")
        exit(1)
    
    scraped = scrape_all_tabs(base_url)
    
    if "error" in scraped:
        print(f"\n❌ Fatal error: {scraped['error']}")
        exit(1)
    
    slug = urlparse(base_url).path.replace("/", "_").strip("_")
    if not slug:
        slug = "ipo_data"
    
    filename = f"IPO_FULL_SCRAPED_{slug}.json"
    
    save_json(scraped, filename)
