import asyncio
import base64
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "outputs" / "video"
VOICE = ROOT / "outputs" / "riff-demo-voiceover.mp3"
CAPTIONS = ROOT / "outputs" / "riff-demo-voiceover.vtt"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
FPS = 30


def data_url(path: Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


async def render_stage_assets() -> None:
    mobile_images = [
        data_url(MEDIA / "06-discover-mobile.png"),
        data_url(MEDIA / "07-idea-mobile.png"),
        data_url(MEDIA / "08-buy-mobile.png"),
    ]
    mobile_html = f"""
    <style>
      * {{ box-sizing: border-box }}
      body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #111310; color: #f6f6f2; font-family: Arial, sans-serif; }}
      .eyebrow {{ position: absolute; top: 58px; left: 88px; color: #6d8cff; font-size: 21px; font-weight: 800; letter-spacing: .18em; }}
      h1 {{ position: absolute; top: 80px; left: 84px; margin: 0; font-size: 64px; line-height: 1; letter-spacing: -.055em; }}
      .phones {{ position: absolute; left: 166px; right: 166px; top: 190px; display: flex; justify-content: space-between; align-items: start; }}
      .phone {{ width: 424px; height: 824px; border: 8px solid #2d302b; border-radius: 42px; overflow: hidden; background: #f6f6f2; box-shadow: 0 28px 70px rgba(0,0,0,.36); }}
      .phone img {{ width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }}
      .labels {{ position: absolute; left: 166px; right: 166px; bottom: 24px; display: flex; justify-content: space-between; }}
      .labels span {{ width: 424px; text-align: center; font-size: 15px; font-weight: 800; letter-spacing: .18em; color: #a9ada4; }}
      .rule {{ position: absolute; right: 88px; top: 88px; width: 260px; height: 6px; background: #1747d1; }}
    </style>
    <div class="eyebrow">RIFF ON MOBILE</div>
    <h1>ONE IDEA. EVERY SURFACE.</h1>
    <div class="rule"></div>
    <div class="phones">
      <div class="phone"><img src="{mobile_images[0]}"></div>
      <div class="phone"><img src="{mobile_images[1]}"></div>
      <div class="phone"><img src="{mobile_images[2]}"></div>
    </div>
    <div class="labels"><span>DISCOVER</span><span>UNDERSTAND</span><span>BUY</span></div>
    """

    end_html = """
    <style>
      * { box-sizing: border-box }
      body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #f6f6f2; color: #111310; font-family: Arial, sans-serif; }
      .brand { position: absolute; top: 72px; left: 84px; display: flex; align-items: center; }
      .brand svg { width: 112px; height: 112px; }
      .word { margin-left: -17px; margin-top: 4px; font-size: 82px; font-weight: 700; letter-spacing: -.09em; }
      .network { position: absolute; top: 92px; right: 92px; display: flex; gap: 13px; align-items: center; font-size: 17px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      .dot { width: 12px; height: 12px; border-radius: 50%; background: #009f6b; }
      .eyebrow { position: absolute; left: 91px; top: 340px; color: #1747d1; font-size: 22px; font-weight: 800; letter-spacing: .18em; }
      h1 { position: absolute; left: 83px; top: 375px; width: 1650px; margin: 0; font-size: 132px; line-height: .94; letter-spacing: -.075em; text-transform: uppercase; }
      .footer { position: absolute; left: 92px; bottom: 74px; font-size: 23px; color: #61655f; }
      .url { position: absolute; right: 92px; bottom: 74px; font-size: 23px; font-weight: 800; }
      .blue { color: #1747d1; }
      .line { position: absolute; left: 92px; right: 92px; bottom: 128px; height: 2px; background: #d7d9d3; }
    </style>
    <div class="brand">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M8 34V6h12.2C27.7 6 32 9.8 32 15.8S27.7 25 20.2 25H8" stroke="#111310" stroke-width="4.25" stroke-linecap="square" stroke-linejoin="round"/>
        <path d="m21 25 11 9" stroke="#111310" stroke-width="4.25" stroke-linecap="square"/>
        <path d="M8 15.5h24" stroke="#1747d1" stroke-width="4.25"/>
        <circle cx="32" cy="15.5" r="2.8" fill="#1747d1"/>
      </svg>
      <div class="word">iff</div>
    </div>
    <div class="network"><span class="dot"></span>Built on Base</div>
    <div class="eyebrow">INVESTMENT IDEAS ARE COMPOSABLE</div>
    <h1>FIND AN IDEA.<br>BUY IT. <span class="blue">REMIX IT.</span></h1>
    <div class="line"></div>
    <div class="footer">The thesis is the social object.</div>
    <div class="url">riffbase.vercel.app</div>
    """

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=EDGE, headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
        await page.set_content(mobile_html, wait_until="load")
        await page.screenshot(path=MEDIA / "09-mobile-triptych.png")
        await page.set_content(end_html, wait_until="load")
        await page.screenshot(path=MEDIA / "10-end-card.png")
        await browser.close()


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def make_segment(source: str, output: str, duration: float, pan: str = "center") -> None:
    frames = round(duration * FPS)
    x = "iw-iw/zoom" if pan == "right" else "iw/2-(iw/zoom/2)"
    filters = (
        "scale=1728:1080:force_original_aspect_ratio=decrease,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111310,"
        f"zoompan=z='min(zoom+0.00006,1.025)':x='{x}':y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s=1920x1080:fps={FPS},format=yuv420p"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(MEDIA / source), "-t", f"{duration:.3f}",
        "-vf", filters, "-r", str(FPS), "-an", "-c:v", "libx264",
        "-preset", "slow", "-crf", "17", str(MEDIA / output),
    ])


def make_static_segment(source: str, output: str, duration: float, fade_out: bool = False) -> None:
    filters = "scale=1920:1080,format=yuv420p"
    if fade_out:
        filters += f",fade=t=out:st={duration - 0.6:.3f}:d=0.6"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(MEDIA / source), "-t", f"{duration:.3f}",
        "-vf", filters, "-r", str(FPS), "-an", "-c:v", "libx264",
        "-preset", "slow", "-crf", "17", str(MEDIA / output),
    ])


def render_video() -> None:
    segments = [
        ("01-discover-desktop.png", "segment-01.mp4", 5.068, "center"),
        ("02-idea-desktop.png", "segment-02.mp4", 12.068, "center"),
        ("03-stack-desktop.png", "segment-03.mp4", 3.443, "center"),
        ("04-buy-desktop.png", "segment-04.mp4", 10.091, "center"),
        ("02-idea-desktop.png", "segment-05.mp4", 11.954, "right"),
    ]
    for source, output, duration, pan in segments:
        make_segment(source, output, duration, pan)
    make_static_segment("09-mobile-triptych.png", "segment-06.mp4", 8.989)
    make_static_segment("10-end-card.png", "segment-07.mp4", 6.899, fade_out=True)

    concat = MEDIA / "segments.txt"
    concat.write_text("".join(f"file '{(MEDIA / f'segment-{index:02}.mp4').as_posix()}'\n" for index in range(1, 8)), encoding="utf-8")
    silent = MEDIA / "riff-demo-silent.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(silent),
    ])

    caption_path = str(CAPTIONS).replace("\\", "/").replace(":", r"\:")
    caption_filter = (
        f"subtitles='{caption_path}':"
        "force_style='FontName=Arial,FontSize=10,PrimaryColour=&H00FFFFFF,"
        "BackColour=&H66000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=24,Alignment=2'"
    )
    output = MEDIA / "riff-base-builder-quest-demo.mp4"
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(silent), "-i", str(VOICE), "-vf", caption_filter,
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "slow",
        "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
        "-shortest", "-movflags", "+faststart",
        str(output),
    ])


async def main() -> None:
    MEDIA.mkdir(parents=True, exist_ok=True)
    await render_stage_assets()
    render_video()


if __name__ == "__main__":
    asyncio.run(main())
