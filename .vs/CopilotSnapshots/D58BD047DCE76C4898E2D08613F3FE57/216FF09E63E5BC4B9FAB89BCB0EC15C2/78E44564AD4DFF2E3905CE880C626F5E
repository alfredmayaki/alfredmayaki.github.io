import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from urllib.parse import urljoin, urlparse
import time

class IBRecruitmentScraper:
    def __init__(self, base_url="https://www.ibrecruitment.com/"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.scraped_data = []
        self.visited_urls = set()

    def scrape_page(self, url, selectors=None):
        """Scrape a single page with specified CSS selectors"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            page_data = {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'title': soup.title.string if soup.title else 'No Title',
                'content': {}
            }

            # Default selectors if none provided
            if not selectors:
                selectors = {
                    'headings': ['h1', 'h2', 'h3'],
                    'paragraphs': ['p'],
                    'links': ['a'],
                    'content': ['.content', '.main', 'article']
                }

            # Scrape based on selectors
            for category, selector_list in selectors.items():
                page_data['content'][category] = []
                for selector in selector_list:
                    elements = soup.select(selector)
                    for element in elements:
                        text = element.get_text(strip=True)
                        if text:
                            page_data['content'][category].append({
                                'text': text,
                                'html': str(element) if category == 'links' else None
                            })

            # Extract all links for crawling
            page_data['links_found'] = []
            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(url, link['href'])
                if self._is_valid_url(absolute_url):
                    page_data['links_found'].append(absolute_url)

            return page_data

        except requests.RequestException as e:
            print(f"Error scraping {url}: {e}")
            return None

    def _is_valid_url(self, url):
        """Check if URL belongs to the target domain"""
        parsed = urlparse(url)
        base_parsed = urlparse(self.base_url)
        return parsed.netloc == base_parsed.netloc

    def crawl(self, max_pages=10, max_depth=2, selectors=None, delay=1):
        """Crawl multiple pages starting from base URL"""
        to_visit = [(self.base_url, 0)]
        pages_scraped = 0

        while to_visit and pages_scraped < max_pages:
            url, depth = to_visit.pop(0)

            if url in self.visited_urls or depth > max_depth:
                continue

            print(f"Scraping: {url} (Depth: {depth})")
            self.visited_urls.add(url)

            page_data = self.scrape_page(url, selectors)
            if page_data:
                self.scraped_data.append(page_data)
                pages_scraped += 1

                # Add new links to visit
                if depth < max_depth:
                    for link in page_data.get('links_found', []):
                        if link not in self.visited_urls:
                            to_visit.append((link, depth + 1))

            # Rate limiting
            time.sleep(delay)

        return self.scraped_data

    def extract_specific_content(self, url, selectors):
        """Extract specific content using custom selectors"""
        page_data = self.scrape_page(url, selectors)
        return page_data

    def save_to_json(self, filename='scraped_data.json'):
        """Save scraped data to JSON file"""
        output = {
            'scraper': 'IBRecruitment Scraper',
            'base_url': self.base_url,
            'scraped_at': datetime.now().isoformat(),
            'total_pages': len(self.scraped_data),
            'data': self.scraped_data
        }

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"Data saved to {filename}")
        return filename

    def search_content(self, keyword):
        """Search for keyword in scraped content"""
        results = []
        for page in self.scraped_data:
            for category, items in page['content'].items():
                for item in items:
                    if keyword.lower() in item['text'].lower():
                        results.append({
                            'url': page['url'],
                            'category': category,
                            'text': item['text']
                        })
        return results


def main():
    # Example usage
    scraper = IBRecruitmentScraper("https://www.ibrecruitment.com/")

    print("=== IBRecruitment Web Scraper ===\n")

    # Option 1: Scrape a single page
    print("Scraping homepage...")
    custom_selectors = {
        'headings': ['h1', 'h2', 'h3'],
        'content': ['p', '.content', 'article'],
        'jobs': ['.job-listing', '.position', '.vacancy'],
        'contact': ['.contact-info', 'footer']
    }
    
    data = scraper.scrape_page(scraper.base_url, custom_selectors)
    if data:
        print(f"✓ Successfully scraped: {data['title']}")
        print(f"  Found {len(data['content'])} content categories")

    # Option 2: Crawl multiple pages
    print("\nCrawling website...")
    scraper.crawl(max_pages=5, max_depth=1, selectors=custom_selectors, delay=1)

    # Save results
    scraper.save_to_json('ibrecruitment_data.json')

    # Example search
    search_results = scraper.search_content('recruitment')
    print(f"\nFound '{search_results}' in {len(search_results)} locations")


if __name__ == "__main__":
    main()