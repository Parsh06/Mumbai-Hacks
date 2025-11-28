# Company Data Scraper

This scraper fetches financial data from Screener.in for Indian companies and saves it to CSV files.

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Edit `scrapper.py` and change the `company_code` variable to the company you want to scrape:
```python
company_code = 'NESTLEIND'  # Change this to any company code
```

2. Run the scraper:
```bash
python scrapper.py
```

## Output

The scraper will create the following CSV files in the `scraper/` folder:

- `{COMPANY_CODE}_company_info.csv` - Company name, about, pros, cons
- `{COMPANY_CODE}_key_ratios.csv` - Key financial ratios
- `{COMPANY_CODE}_quarterly_results.csv` - Quarterly financial results
- `{COMPANY_CODE}_profit_and_loss.csv` - Annual P&L statements
- `{COMPANY_CODE}_cash_flow.csv` - Cash flow statements
- `{COMPANY_CODE}_balance_sheet.csv` - Balance sheet data
- `{COMPANY_CODE}_ratios.csv` - Detailed ratios
- `{COMPANY_CODE}_summary.csv` - Combined summary of all data

## Example Company Codes

- NESTLEIND - Nestle India
- RELIANCE - Reliance Industries
- TCS - Tata Consultancy Services
- INFY - Infosys
- HDFCBANK - HDFC Bank

## Notes

- The scraper includes proper error handling and data cleaning
- All CSV files are saved with UTF-8 encoding to support Indian Rupee symbols (₹)
- The scraper respects rate limiting with appropriate delays




