"""
Test for exporter tool.
"""
import os
from slideia.tools import exporter


def test_generate_pptx(tmp_path):
    topic = "Test Presentation"
    slides = 3
    
    # Change working directory to tmp_path to avoid clutter
    old_cwd = os.getcwd()
    os.chdir(tmp_path)
    try:
        filename = exporter.generate_pptx(topic, slides)
        assert filename.endswith('.pptx')
        assert os.path.exists(filename)
    finally:
        os.chdir(old_cwd)
