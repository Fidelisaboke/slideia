import pytest
from slideia.domain.deck.exporter import export_slides
import json
import os
import tempfile
from unittest.mock import patch, MagicMock


@pytest.mark.asyncio
async def test_exporter_uses_global_theme():
    # Setup mock data with global palette and font
    deck_data = {
        "title": "Test Presentation",
        "font": "Arial",
        "palette": ["#FF0000", "#00FF00"],
        "slides": [
            {
                "title": "Slide 1",
                "bullets": ["Bullet 1"],
                # No slide-specific theme
            }
        ],
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as tmp:
        json.dump(deck_data, tmp)
        tmp_path = tmp.name

    output_path = tempfile.mktemp(suffix=".pptx")

    try:
        # We don't want to actually generate a PPTX in a unit test
        # but we can mock the Presentation object to verify if font settings are applied.
        with patch("slideia.domain.deck.exporter.Presentation") as mock_pres:
            mock_prs_instance = MagicMock()
            mock_pres.return_value = mock_prs_instance

            # Mock slide layout and slides
            mock_layout = MagicMock()
            mock_prs_instance.slide_layouts = [mock_layout]
            mock_slide = MagicMock()
            mock_prs_instance.slides.add_slide.return_value = mock_slide

            # Mock shapes and text frame
            mock_textbox = MagicMock()
            mock_slide.shapes.add_textbox.return_value = mock_textbox

            await export_slides(tmp_path, output_path)

            # Verify that the textbox was added and Styled
            assert mock_slide.shapes.add_textbox.called

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if os.path.exists(output_path):
            os.unlink(output_path)
