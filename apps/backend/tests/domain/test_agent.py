from langgraph.graph import END
import pytest
from slideia.domain.agent.graph import route_intent, decide_validation, compile_workflow
from slideia.domain.agent.nodes import validate_node
from slideia.domain.agent.state import AgentState


def test_route_intent():
    # Test CREATE_DECK routing
    state_create: AgentState = {
        "messages": [],
        "topic": "AI",
        "audience": "Developers",
        "tone": "professional",
        "slide_count": 3,
        "theme_preset": "purple_mint",
        "deck": None,
        "prompt": "Create a deck",
        "file_context": "",
        "intent": "CREATE_DECK",
        "instruction": None,
        "error": None,
        "retry_count": 0,
    }
    assert route_intent(state_create) == "propose_outline"

    # Test EDIT_DECK routing
    state_edit: AgentState = {**state_create, "intent": "EDIT_DECK"}
    assert route_intent(state_edit) == "refine_deck"

    # Test CHAT routing
    state_chat: AgentState = {**state_create, "intent": "CHAT"}
    assert route_intent(state_chat) == "general_chat"

    # Test UNKNOWN/other routing fallback
    state_unknown: AgentState = {**state_create, "intent": "UNKNOWN"}
    assert route_intent(state_unknown) == "general_chat"


def test_decide_validation():
    state: AgentState = {
        "messages": [],
        "topic": "AI",
        "audience": "Developers",
        "tone": "professional",
        "slide_count": 3,
        "theme_preset": "purple_mint",
        "deck": None,
        "prompt": "Create a deck",
        "file_context": "",
        "intent": "CREATE_DECK",
        "instruction": None,
        "error": None,
        "retry_count": 0,
    }

    # No error -> END
    assert decide_validation(state) == END

    # Error present, retry count < 3, intent is CREATE_DECK -> draft_slides
    state_err_create = {**state, "error": "Some schema error", "retry_count": 0}
    assert decide_validation(state_err_create) == "draft_slides"

    # Error present, retry count < 3, intent is EDIT_DECK -> refine_deck
    state_err_edit = {**state, "error": "Some schema error", "retry_count": 1, "intent": "EDIT_DECK"}
    assert decide_validation(state_err_edit) == "refine_deck"

    # Error present, retry count >= 3 -> END
    state_max_retry = {**state, "error": "Some schema error", "retry_count": 3}
    assert decide_validation(state_max_retry) == END


def test_graph_compilation():
    workflow = compile_workflow()
    assert workflow is not None
    # Verify nodes exist in compiled graph
    node_names = [node for node in workflow.nodes.keys()]
    assert "classify_intent" in node_names
    assert "propose_outline" in node_names
    assert "draft_slides" in node_names
    assert "refine_deck" in node_names
    assert "validate" in node_names
    assert "general_chat" in node_names


@pytest.mark.asyncio
async def test_validate_node():
    # 1. State with no deck
    state_no_deck: AgentState = {
        "messages": [],
        "topic": "AI",
        "audience": "Developers",
        "tone": "professional",
        "slide_count": 3,
        "theme_preset": "purple_mint",
        "deck": None,
        "prompt": "Create a deck",
        "file_context": "",
        "intent": "CREATE_DECK",
        "instruction": None,
        "error": None,
        "retry_count": 0,
    }
    res = await validate_node(state_no_deck, None)
    assert res["error"] == "No slides found in the generated deck."
    assert res["retry_count"] == 1

    # 2. State with valid deck
    state_valid_deck: AgentState = {
        **state_no_deck,
        "deck": {
            "slides": [
                {
                    "title": "Slide 1",
                    "layout": "bullets",
                    "bullets": ["Bullet 1", "Bullet 2"],
                }
            ]
        },
        "retry_count": 1,
    }
    res = await validate_node(state_valid_deck, None)
    assert res["error"] is None
    assert "retry_count" not in res

    # 3. State with invalid slide (missing title)
    state_invalid_deck: AgentState = {
        **state_no_deck,
        "deck": {
            "slides": [
                {
                    "layout": "bullets",
                    "bullets": ["Bullet 1"],
                }
            ]
        },
        "retry_count": 2,
    }
    res = await validate_node(state_invalid_deck, None)
    assert "missing a title" in res["error"]
    assert res["retry_count"] == 3
