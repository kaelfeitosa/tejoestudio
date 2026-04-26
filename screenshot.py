import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop
        context_desktop = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page_desktop = await context_desktop.new_page()
        await page_desktop.goto("http://localhost:3000/")
        await page_desktop.screenshot(path="screenshot_desktop.png", full_page=True)
        # Mobile
        context_mobile = await browser.new_context(viewport={'width': 375, 'height': 812})
        page_mobile = await context_mobile.new_page()
        await page_mobile.goto("http://localhost:3000/")
        await page_mobile.screenshot(path="screenshot_mobile.png", full_page=True)
        await browser.close()

asyncio.run(main())
