import asyncio
from pathlib import Path

from playwright.async_api import async_playwright


APP_URL = "https://riffbase.vercel.app"
OUTPUT = Path("outputs/video")
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"


async def settle(page):
    await page.wait_for_load_state("domcontentloaded")
    await page.wait_for_timeout(2600)


async def capture_desktop(browser):
    page = await browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    await page.goto(APP_URL)
    await settle(page)
    await page.screenshot(path=OUTPUT / "01-discover-desktop.png")

    await page.get_by_role("heading", name="AI EATS ENERGY", exact=True).first.click()
    await page.wait_for_timeout(900)
    await page.screenshot(path=OUTPUT / "02-idea-desktop.png")

    await page.get_by_role("button", name="Discover", exact=True).click()
    await page.wait_for_timeout(500)
    await page.get_by_role("heading", name="THE AI STACK", exact=True).first.click()
    await page.wait_for_timeout(700)
    await page.screenshot(path=OUTPUT / "03-stack-desktop.png")

    await page.get_by_role("button", name="Buy", exact=True).click()
    await page.wait_for_timeout(500)
    await page.screenshot(path=OUTPUT / "04-buy-desktop.png")
    await page.keyboard.press("Escape")

    await page.get_by_role("button", name="Remix", exact=True).click()
    await page.wait_for_timeout(500)
    await page.screenshot(path=OUTPUT / "05-signin-desktop.png")
    await page.close()


async def capture_mobile(browser):
    page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    await page.goto(APP_URL)
    await settle(page)
    await page.screenshot(path=OUTPUT / "06-discover-mobile.png")

    await page.get_by_role("heading", name="AI EATS ENERGY", exact=True).first.click()
    await page.wait_for_timeout(800)
    await page.screenshot(path=OUTPUT / "07-idea-mobile.png")

    await page.get_by_role("button", name="Discover", exact=True).click()
    await page.wait_for_timeout(500)
    await page.get_by_role("heading", name="THE AI STACK", exact=True).first.click()
    await page.wait_for_timeout(700)
    await page.get_by_role("button", name="Buy", exact=True).click()
    await page.wait_for_timeout(500)
    await page.screenshot(path=OUTPUT / "08-buy-mobile.png")
    await page.close()


async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=EDGE, headless=True)
        await capture_desktop(browser)
        await capture_mobile(browser)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
