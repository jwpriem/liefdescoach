from playwright.sync_api import sync_playwright

def test_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3000")
        page.screenshot(path="screenshot.png")
        browser.close()

if __name__ == "__main__":
    test_frontend()
