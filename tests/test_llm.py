"""
Unit tests for draft_slide in slideia.llm.
"""
import pytest
from slideia.llm import draft_slide

def test_draft_slide_raises_and_keys():
    spec = {"title": "Test", "bullets": ["A", "B"]}
    with pytest.raises(NotImplementedError) as excinfo:
        draft_slide(spec)
    # Check that the error message mentions 'image_prompt' and 'theme'
    msg = str(excinfo.value).lower()
    assert 'image_prompt' in msg
    assert 'theme' in msg
