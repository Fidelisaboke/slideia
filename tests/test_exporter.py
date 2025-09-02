"""
Test placeholder for exporter tool.
"""
from slideia.tools import exporter


def test_export_slides():
    # Placeholder test
    assert hasattr(exporter, 'export_slides')


def test_generate_pptx(tmp_path):
    topic = "Test Presentation"
    slides = 3
    # Change working directory to tmp_path to avoid clutter
    import os
    old_cwd = os.getcwd()
    os.chdir(tmp_path)
    try:
        filename = exporter.generate_pptx(topic, slides)
        assert filename.endswith('.pptx')
        assert os.path.exists(filename)
    finally:
        os.chdir(old_cwd)
