"""
IPO Scraper for Mainboard and SME IPOs
Scrapes IPO data from Chittorgarh.com and converts to JSON

Requirements:
    - Chrome browser installed
    - ChromeDriver installed and in PATH (or use webdriver-manager)
    - selenium package installed (pip install selenium)

Usage:
    python ipo_scraper.py

Output:
    - CSV files saved in: scrapers-file/
        * main-ipo.csv
        * sme-ipo.csv
    - JSON files saved in: scraped-data/
        * main-ipo.json
        * sme-ipo.json

Note: If downloads fail, try running with headless=False in setup_driver() 
      to see what's happening in the browser.
"""

import os
import json
import csv
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Paths configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPERS_FILE_DIR = SCRIPT_DIR
SCRAPED_DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "scraped-data")

# Ensure scraped-data directory exists
os.makedirs(SCRAPED_DATA_DIR, exist_ok=True)

# URLs and XPaths
MAINBOARD_URL = "https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/mainboard/"
SME_URL = "https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/sme/"
EXPORT_BUTTON_XPATH = "/html/body/div[9]/div[4]/div[1]/div[3]/div/div[1]/button"

# File names
MAINBOARD_CSV = os.path.join(SCRAPERS_FILE_DIR, "main-ipo.csv")
SME_CSV = os.path.join(SCRAPERS_FILE_DIR, "sme-ipo.csv")
MAINBOARD_JSON = os.path.join(SCRAPED_DATA_DIR, "main-ipo.json")
SME_JSON = os.path.join(SCRAPED_DATA_DIR, "sme-ipo.json")


def setup_driver(download_dir, headless=True):
    """Setup Chrome driver with download preferences"""
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Set download preferences
    prefs = {
        "download.default_directory": download_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "safebrowsing.disable_download_protection": True,
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {e}")
        print("Make sure ChromeDriver is installed and in PATH")
        raise


def find_downloaded_csv(download_dir, expected_name=None):
    """Find the most recently downloaded CSV file in the directory"""
    csv_files = []
    for file in os.listdir(download_dir):
        if file.endswith('.csv') and not file.startswith('.'):
            file_path = os.path.join(download_dir, file)
            # Check if file is not a temporary download file
            if not file.endswith('.crdownload'):
                csv_files.append((file_path, os.path.getmtime(file_path)))
    
    if csv_files:
        # Sort by modification time (most recent first)
        csv_files.sort(key=lambda x: x[1], reverse=True)
        return csv_files[0][0]
    return None


def download_csv(driver, url, csv_path, button_xpath, file_type="Mainboard"):
    """Navigate to URL, click export button, and wait for CSV download"""
    print(f"\n📥 Downloading {file_type} IPO CSV...")
    print(f"   URL: {url}")
    
    # Get list of existing files before download
    download_dir = os.path.dirname(csv_path)
    existing_files = set()
    if os.path.exists(download_dir):
        for file in os.listdir(download_dir):
            if file.endswith('.csv'):
                existing_files.add(file)
    
    try:
        # Navigate to the page
        driver.get(url)
        print(f"   ✓ Page loaded")
        
        # Wait for the page to fully load and table to render
        time.sleep(8)  # Give more time for dynamic content to load
        
        # Try to wait for the table or export button to be present
        try:
            wait = WebDriverWait(driver, 15)
            # Wait for either the button or a table element to be present
            wait.until(
                lambda d: d.find_elements(By.ID, "export_btn") or 
                         d.find_elements(By.XPATH, "//table") or
                         d.find_elements(By.XPATH, button_xpath)
            )
            print(f"   ✓ Page content loaded")
        except TimeoutException:
            print(f"   ⚠ Page content loading timeout, proceeding anyway...")
        
        # Try to dismiss any overlays or popups first
        try:
            # Look for common overlay elements and close them
            overlay_selectors = [
                "//div[@class='modal-backdrop']",
                "//div[contains(@class, 'overlay')]",
                "//div[contains(@class, 'popup')]",
                "//button[contains(@class, 'close')]",
                "//button[contains(@class, 'dismiss')]",
            ]
            for selector in overlay_selectors:
                try:
                    elements = driver.find_elements(By.XPATH, selector)
                    for elem in elements:
                        try:
                            driver.execute_script("arguments[0].style.display = 'none';", elem)
                        except:
                            pass
                except:
                    pass
        except:
            pass
        
        # Try to find and click the export button
        button_clicked = False
        try:
            # Wait for button to be present (not necessarily clickable)
            wait = WebDriverWait(driver, 20)
            button = wait.until(
                EC.presence_of_element_located((By.XPATH, button_xpath))
            )
            print(f"   ✓ Export button found (XPath)")
            
            # Scroll to button
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", button)
            time.sleep(2)
            
            # Try JavaScript click to bypass overlays
            try:
                driver.execute_script("arguments[0].click();", button)
                button_clicked = True
                print(f"   ✓ Export button clicked (JavaScript)")
            except:
                # Fallback to regular click
                try:
                    button.click()
                    button_clicked = True
                    print(f"   ✓ Export button clicked (regular)")
                except:
                    print(f"   ⚠ Regular click failed, trying JavaScript again...")
                    driver.execute_script("arguments[0].click();", button)
                    button_clicked = True
                    print(f"   ✓ Export button clicked (JavaScript retry)")
            
        except TimeoutException:
            print(f"   ⚠ Export button not found with XPath, trying ID selector...")
            # Try alternative selector
            try:
                button = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID, "export_btn"))
                )
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", button)
                time.sleep(2)
                
                # Use JavaScript click
                driver.execute_script("arguments[0].click();", button)
                button_clicked = True
                print(f"   ✓ Export button clicked (using ID selector + JavaScript)")
            except Exception as e:
                print(f"   ✗ Export button not found or not clickable: {e}")
                return False
        
        if not button_clicked:
            return False
        
        # Wait for download to complete
        max_wait = 30
        wait_time = 0
        downloaded_file = None
        
        while wait_time < max_wait:
            # Check for the expected file name
            if os.path.exists(csv_path):
                # Check if file is complete (not .crdownload)
                if not csv_path.endswith('.crdownload'):
                    file_size = os.path.getsize(csv_path)
                    if file_size > 0:
                        print(f"   ✓ CSV downloaded: {csv_path} ({file_size} bytes)")
                        return True
            
            # Check for any new CSV files
            if os.path.exists(download_dir):
                current_files = set()
                for file in os.listdir(download_dir):
                    if file.endswith('.csv') and not file.startswith('.'):
                        current_files.add(file)
                
                new_files = current_files - existing_files
                if new_files:
                    # Found new CSV file(s)
                    for new_file in new_files:
                        new_file_path = os.path.join(download_dir, new_file)
                        # Wait a bit to ensure download is complete
                        time.sleep(2)
                        if os.path.exists(new_file_path) and not new_file_path.endswith('.crdownload'):
                            file_size = os.path.getsize(new_file_path)
                            if file_size > 0:
                                # Rename to expected name
                                if new_file_path != csv_path:
                                    if os.path.exists(csv_path):
                                        os.remove(csv_path)  # Remove old file if exists
                                    os.rename(new_file_path, csv_path)
                                    print(f"   ✓ CSV downloaded and renamed: {csv_path} ({file_size} bytes)")
                                else:
                                    print(f"   ✓ CSV downloaded: {csv_path} ({file_size} bytes)")
                                return True
            
            time.sleep(1)
            wait_time += 1
        
        print(f"   ⚠ CSV download timeout after {max_wait} seconds")
        # Try to find any CSV file as fallback
        found_csv = find_downloaded_csv(download_dir)
        if found_csv and found_csv != csv_path:
            if os.path.exists(csv_path):
                os.remove(csv_path)
            os.rename(found_csv, csv_path)
            print(f"   ✓ Found and renamed CSV: {csv_path}")
            return True
        
        return False
                
    except Exception as e:
        print(f"   ✗ Error downloading CSV: {e}")
        import traceback
        traceback.print_exc()
        return False


def csv_to_json(csv_path, json_path, file_type="Mainboard"):
    """Convert CSV file to JSON format"""
    print(f"\n🔄 Converting {file_type} CSV to JSON...")
    print(f"   CSV: {csv_path}")
    print(f"   JSON: {json_path}")
    
    if not os.path.exists(csv_path):
        print(f"   ✗ CSV file not found: {csv_path}")
        return False
    
    try:
        data = []
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Try to detect delimiter
            sample = csvfile.read(1024)
            csvfile.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(csvfile, delimiter=delimiter)
            
            for row in reader:
                # Clean up the row data
                cleaned_row = {}
                for key, value in row.items():
                    # Remove extra whitespace
                    cleaned_key = key.strip() if key else ""
                    cleaned_value = value.strip() if value else ""
                    cleaned_row[cleaned_key] = cleaned_value
                
                if cleaned_row:  # Only add non-empty rows
                    data.append(cleaned_row)
        
        # Create JSON structure
        json_data = {
            "file_type": file_type,
            "scraped_at": datetime.now().isoformat(),
            "total_records": len(data),
            "data": data
        }
        
        # Save JSON file
        with open(json_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(json_data, jsonfile, indent=2, ensure_ascii=False)
        
        print(f"   ✓ JSON created: {json_path}")
        print(f"   ✓ Total records: {len(data)}")
        return True
        
    except Exception as e:
        print(f"   ✗ Error converting CSV to JSON: {e}")
        import traceback
        traceback.print_exc()
        return False


def cleanup_old_files():
    """Remove old CSV and JSON files if they exist"""
    files_to_remove = [MAINBOARD_CSV, SME_CSV, MAINBOARD_JSON, SME_JSON]
    for file_path in files_to_remove:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"   ✓ Removed old file: {os.path.basename(file_path)}")
            except Exception as e:
                print(f"   ⚠ Could not remove old file {file_path}: {e}")


def cleanup_csv_files():
    """Remove CSV files after successful conversion to JSON"""
    csv_files_to_remove = []
    for csv_file in [MAINBOARD_CSV, SME_CSV]:
        if os.path.exists(csv_file):
            csv_files_to_remove.append(csv_file)
    
    if csv_files_to_remove:
        print("\n🧹 Cleaning up CSV files...")
        for csv_file in csv_files_to_remove:
            try:
                os.remove(csv_file)
                print(f"   ✓ Removed CSV file: {os.path.basename(csv_file)}")
            except Exception as e:
                print(f"   ⚠ Could not remove CSV file {csv_file}: {e}")


def main():
    """Main function to scrape both IPO types"""
    print("=" * 60)
    print("IPO Scraper - Mainboard & SME IPOs")
    print("=" * 60)
    
    driver = None
    try:
        # Clean up old CSV files
        print("\n🧹 Cleaning up old files...")
        cleanup_old_files()
        
        # Setup driver with download directory
        # Set headless=False if you want to see the browser (useful for debugging)
        driver = setup_driver(SCRAPERS_FILE_DIR, headless=True)
        print(f"\n✓ Chrome driver initialized")
        print(f"  Download directory: {SCRAPERS_FILE_DIR}")
        
        # Download Mainboard IPO CSV
        mainboard_success = download_csv(
            driver, 
            MAINBOARD_URL, 
            MAINBOARD_CSV, 
            EXPORT_BUTTON_XPATH,
            "Mainboard"
        )
        
        # Download SME IPO CSV
        sme_success = download_csv(
            driver, 
            SME_URL, 
            SME_CSV, 
            EXPORT_BUTTON_XPATH,
            "SME"
        )
        
        # Convert CSV to JSON
        mainboard_json_success = False
        sme_json_success = False
        
        if mainboard_success:
            mainboard_json_success = csv_to_json(MAINBOARD_CSV, MAINBOARD_JSON, "Mainboard")
        
        if sme_success:
            sme_json_success = csv_to_json(SME_CSV, SME_JSON, "SME")
        
        # Clean up CSV files after successful JSON conversion
        if mainboard_json_success or sme_json_success:
            cleanup_csv_files()
        
        print("\n" + "=" * 60)
        print("Scraping Summary:")
        print("=" * 60)
        print(f"Mainboard CSV: {'✓' if mainboard_success else '✗'}")
        print(f"SME CSV: {'✓' if sme_success else '✗'}")
        print(f"\nFiles saved:")
        if os.path.exists(MAINBOARD_JSON):
            print(f"  - {MAINBOARD_JSON}")
        if os.path.exists(SME_JSON):
            print(f"  - {SME_JSON}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up CSV files before closing browser (in case conversion failed)
        cleanup_csv_files()
        
        if driver:
            driver.quit()
            print("\n✓ Browser closed")


if __name__ == "__main__":
    main()

