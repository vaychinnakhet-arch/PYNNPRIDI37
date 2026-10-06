# -*- coding: utf-8 -*-
"""
Python builder for Web Progress: Rebuilds index.html from build_webprogress.rb template,
embedding model.glb as base64 and piles_metadata.json.
"""
import base64
import os
import sys

def build():
    dir_path = os.path.dirname(os.path.abspath(__file__))
    glb_path = os.path.join(dir_path, "model.glb")
    meta_path = os.path.join(dir_path, "piles_metadata.json")
    rb_path = os.path.join(dir_path, "build_webprogress.rb")
    out_html = os.path.join(dir_path, "index.html")

    if not os.path.exists(glb_path):
        print(f"ERROR: {glb_path} not found")
        sys.exit(1)

    print("Reading model.glb...")
    with open(glb_path, "rb") as f:
        b64_glb = base64.b64encode(f.read()).decode("ascii")

    print("Reading piles_metadata.json...")
    piles_json = "[]"
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            piles_json = f.read()

    print("Reading template from build_webprogress.rb...")
    with open(rb_path, "r", encoding="utf-8") as f:
        rb_content = f.read()

    start_token = "<<~'HTML_PAGE'\n"
    end_token = "\nHTML_PAGE"
    start_pos = rb_content.find(start_token)
    if start_pos == -1:
        print("ERROR: Start token <<~'HTML_PAGE' not found in build_webprogress.rb")
        sys.exit(1)
    start_pos += len(start_token)

    end_pos = rb_content.find(end_token, start_pos)
    if end_pos == -1:
        print("ERROR: End token HTML_PAGE not found in build_webprogress.rb")
        sys.exit(1)

    html = rb_content[start_pos:end_pos]
    html = html.replace('/*%%EMBEDDED_GLB_BASE64%%*/', b64_glb)
    html = html.replace('/*%%EMBEDDED_PILES_DB%%*/', piles_json)

    with open(out_html, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"SUCCESS: Generated {out_html} ({os.path.getsize(out_html)} bytes)")

if __name__ == "__main__":
    build()
