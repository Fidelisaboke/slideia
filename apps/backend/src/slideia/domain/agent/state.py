from typing import Annotated, Sequence, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """The state of the presentation generation agent.

    This state is updated sequentially by each node in the LangGraph.
    """

    # Multi-turn chat message history
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Presentation parameters
    topic: str
    audience: str
    tone: str
    slide_count: int
    theme_preset: str

    # The current deck data in serializable dict form
    # Matches the structure returned by Deck.to_dict()
    deck: dict | None

    # The user's latest message prompt
    prompt: str

    # Context extracted from uploaded files
    file_context: str

    # Condensed summary of the file_context to fit in prompt limits
    summarized_context: str | None

    # Intent classified by the intent classifier node:
    # "CREATE_DECK" | "EDIT_DECK" | "CHAT" | "UNKNOWN"
    intent: str

    # The parsed edit instruction to apply if intent is EDIT_DECK
    instruction: str | None

    # Schema/count/JSON validation errors, if any
    error: str | None

    # Track validation retries to prevent infinite loops
    retry_count: int
