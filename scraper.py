import urllib.request
import concurrent.futures
import json
import re

# Direct YuppTV & FAST TV Sources
yupp_sources = [
    'https://www.yupptv.com/fast-tv',
    'https://www.yupptv.com/fast-tv/green-gold-tv-india/live'
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

all_streams = []
seen_urls = set()

print("--> Extracting Live Channel Streams directly from YuppTV & FAST TV Sources...")

# Extract M3U8 Stream Manifests for YuppTV CDN origins
for u in yupp_sources:
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            lines = content.splitlines()
            curr_ext = ""
            for line in lines:
                if line.startswith("#EXTINF:"):
                    curr_ext = line
                elif line.startswith("http"):
                    # Only filter YuppTV / Akamai / VGCDN / YuppCDN live streams
                    if any(d in line.lower() for d in ['yupp', 'vgcdn', 'akamaized.net', 'n18syndication', 'liveabr', 'janya-digimix']):
                        if line not in seen_urls:
                            seen_urls.add(line)
                            all_streams.append((curr_ext, line))
    except Exception as e:
        print(f"Notice: {u} -> {e}")

print(f"--> Found {len(all_streams)} YuppTV live stream candidates. Verifying live playback...")

working_streams = []

def verify_stream(pair):
    ext, link = pair
    try:
        req = urllib.request.Request(link, headers={'User-Agent': headers['User-Agent']})
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                if 'tvg-logo=' not in ext:
                    ext = ext.replace('#EXTINF:-1', '#EXTINF:-1 tvg-logo="https://i.imgur.com/OGyeLLR.png"')
                return f"{ext}\n{link}"
    except Exception:
        pass
    return None

with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
    results = executor.map(verify_stream, all_streams)
    for r in results:
        if r:
            working_streams.append(r)

print(f"--> Successfully verified {len(working_streams)} YuppTV active live channels!")

playlist_content = "#EXTM3U\n\n" + "\n\n".join(working_streams) + "\n"

with open("yupptv_playlist.m3u", "w", encoding="utf-8") as f:
    f.write(playlist_content)

print("--> Successfully saved updated yupptv_playlist.m3u!")
