"""
Test for exporter: verifies .pptx generation and slide count.
"""
import os
from pptx import Presentation
from slideia.tools.exporter import export_slides

def test_exporter_creates_pptx(sample_deck_json, tmp_export_dir):
    output_path = os.path.join(tmp_export_dir, "test_deck.pptx")
    export_slides(sample_deck_json, output_path)
    assert os.path.exists(output_path)
    prs = Presentation(output_path)
    # 1 title + 2 content slides
    assert len(prs.slides) == 3

def test_exporter_handles_missing_image(tmp_export_dir, sample_deck_json):
    # Remove image_path from sample, but keep image_prompt
    import json
    with open(sample_deck_json, "r", encoding="utf-8") as f:
        deck = json.load(f)
    deck["slides"][0]["image_path"] = "/nonexistent/path.png"
    new_json = os.path.join(tmp_export_dir, "deck_missing_img.json")
    with open(new_json, "w", encoding="utf-8") as f:
        json.dump(deck, f)
    output_path = os.path.join(tmp_export_dir, "test_missing_img.pptx")
    export_slides(new_json, output_path)
    assert os.path.exists(output_path)
    prs = Presentation(output_path)
    assert len(prs.slides) == 3
