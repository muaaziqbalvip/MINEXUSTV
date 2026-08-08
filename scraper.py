import urllib.request
import concurrent.futures
import json
import re

urls = [
    'https://iptv-org.github.io/iptv/index.m3u',
    'https://iptv-org.github.io/iptv/countries/in.m3u',
    'https://iptv-org.github.io/iptv/languages/hin.m3u',
    'https://iptv-org.github.io/iptv/languages/tel.m3u',
    'https://iptv-org.github.io/iptv/languages/tam.m3u',
    'https://iptv-org.github.io/iptv/languages/mal.m3u',
    'https://iptv-org.github.io/iptv/languages/kan.m3u',
    'https://iptv-org.github.io/iptv/languages/pan.m3u',
    'https://iptv-org.github.io/iptv/languages/mar.m3u',
    'https://iptv-org.github.io/iptv/languages/ben.m3u',
    'https://iptv-org.github.io/iptv/languages/guj.m3u'
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

all_streams = []
seen_urls = set()

print("--> Fetching live stream sources...")

for u in urls:
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
                    if line not in seen_urls:
                        # Filter YuppTV / South Asian streams
                        if any(d in line.lower() for d in ['yupp', 'vgcdn', 'akamaized.net', 'n18syndication', 'liveabr', 'janya-digimix']) or \
                           any(lang in curr_ext.lower() for lang in ['.in', 'hindi', 'telugu', 'tamil', 'malayalam', 'kannada', 'marathi', 'punjabi', 'bengali', 'gujarati', 'aaj tak', 'zeenews', 'ndtv', 'dangal', 'etv']):
                            seen_urls.add(line)
                            all_streams.append((curr_ext, line))
    except Exception as e:
        print(f"Notice: {u} -> {e}")

print(f"--> Found {len(all_streams)} candidate stream URLs. Verifying active streams...")

working_streams = []

def verify_stream(pair):
    ext, link = pair
    try:
        req = urllib.request.Request(link, headers=headers)
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

print(f"--> Successfully verified {len(working_streams)} active live streams!")

playlist_content = "#EXTM3U\n\n" + "\n\n".join(working_streams) + "\n"

with open("yupptv_playlist.m3u", "w", encoding="utf-8") as f:
    f.write(playlist_content)

print("--> Successfully updated yupptv_playlist.m3u!")
