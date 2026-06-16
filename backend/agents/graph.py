from typing import Optional, Dict, Any, List
from langgraph.graph import StateGraph, MessagesState, START, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from services.llm_service import llm_service
from database.mongo import get_database
import uuid
import json
from datetime import datetime

class AgentState(MessagesState):
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    subscription_plan: Optional[str] = None
    intent: Optional[str] = None
    booking_data: Optional[dict] = None
    response: Optional[str] = None

class TravelAssistantGraph:
    def __init__(self):
        self.graph = self._build_graph()
    
    def _build_graph(self):
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("intent_classifier", self.classify_intent)
        workflow.add_node("general_chat", self.general_chat)
        workflow.add_node("hotel_agent", self.hotel_agent)
        workflow.add_node("flight_agent", self.flight_agent)
        workflow.add_node("booking_agent", self.booking_agent)
        
        # Add edges
        workflow.add_edge(START, "intent_classifier")
        workflow.add_conditional_edges(
            "intent_classifier",
            self.route_intent,
            {
                "general": "general_chat",
                "hotel": "hotel_agent",
                "flight": "flight_agent",
                "booking": "booking_agent"
            }
        )
        
        workflow.add_edge("general_chat", END)
        workflow.add_edge("hotel_agent", END)
        workflow.add_edge("flight_agent", END)
        workflow.add_edge("booking_agent", END)
        
        return workflow.compile()
    
    async def classify_intent(self, state: AgentState) -> AgentState:
        try:
            last_message = state["messages"][-1].content
            
            system_prompt = """
            Classify the user's intent into one of these categories:
            - general: General travel questions, greetings, or conversations
            - hotel: Hotel search, recommendations, or information
            - flight: Flight search, recommendations, or information  
            - booking: Making actual bookings for hotels or flights
            
            Respond with only the category name.
            """
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": last_message}
            ]
            
            response = await llm_service.chat_completion(messages, temperature=0.1)
            intent = response["choices"][0]["message"]["content"].strip().lower()
            
            state["intent"] = intent
            return state
        except Exception as e:
            print(f"Error in classify_intent: {e}")
            # Default to general chat on error
            state["intent"] = "general"
            return state
    
    def route_intent(self, state: AgentState) -> str:
        intent = state.get("intent", "general")
        return intent if intent in ["general", "hotel", "flight", "booking"] else "general"
    
    async def general_chat(self, state: AgentState) -> AgentState:
        try:
            messages = self._prepare_messages(state, "general")
            
            response = await llm_service.chat_completion(messages)
            content = response["choices"][0]["message"]["content"]
            
            state["response"] = content
            state["messages"].append(AIMessage(content=content))
            
            return state
        except Exception as e:
            print(f"Error in general_chat: {e}")
            error_message = "I'm having trouble connecting to my AI service. Please try again in a moment."
            state["response"] = error_message
            state["messages"].append(AIMessage(content=error_message))
            return state
    
    async def hotel_agent(self, state: AgentState) -> AgentState:
        messages = self._prepare_messages(state, "hotel")
        
        response = await llm_service.chat_completion(messages)
        content = response["choices"][0]["message"]["content"]
        
        state["response"] = content
        state["messages"].append(AIMessage(content=content))
        
        return state
    
    async def flight_agent(self, state: AgentState) -> AgentState:
        messages = self._prepare_messages(state, "flight")
        
        response = await llm_service.chat_completion(messages)
        content = response["choices"][0]["message"]["content"]
        
        state["response"] = content
        state["messages"].append(AIMessage(content=content))
        
        return state
    
    async def booking_agent(self, state: AgentState) -> AgentState:
        messages = self._prepare_messages(state, "booking")
        
        response = await llm_service.chat_completion(messages)
        content = response["choices"][0]["message"]["content"]
        
        state["response"] = content
        state["messages"].append(AIMessage(content=content))
        
        return state
    
    def _prepare_messages(self, state: AgentState, agent_type: str) -> List[Dict[str, str]]:
        system_prompts = {
            "general": """You are a helpful travel assistant. Answer general travel questions and provide friendly conversation.

RESPONSE FORMAT:
- Keep responses concise and well-structured
- Use short paragraphs (2-3 sentences max)
- Add blank lines between sections for readability
- Use bullet points for lists (one item per line)
- Avoid long walls of text""",
            
            "hotel": """You are a hotel booking specialist. Help users find and compare hotels.

RESPONSE FORMAT:
- Start with a brief, friendly greeting
- Ask 2-3 key questions (one per line with blank line between)
- Present hotel options in clean sections:
  
  Hotel Name (Area)
  Price range and key features
  
- Keep each hotel description to 1-2 lines
- Maximum 3-4 hotel suggestions per response
- End with a simple question to continue the conversation""",
            
            "flight": """You are a flight booking specialist. Help users find flights and compare options.

RESPONSE FORMAT:
- Start with a brief acknowledgment
- Ask essential questions (one per line)
- Present flight options clearly:
  
  Route: Origin → Destination
  Airline | Duration | Price
  
- Keep descriptions concise (1-2 lines per flight)
- Maximum 3-4 flight options per response
- End with next steps""",
            
            "booking": """You are a booking specialist. Help users complete bookings efficiently.

RESPONSE FORMAT:
- Confirm what they want to book
- List required information clearly (one item per line)
- Show booking summary in simple format:
  
  Item: Details
  Price: Amount
  
- Keep confirmations brief and clear
- End with clear next action"""
        }
        
        messages = [{"role": "system", "content": system_prompts[agent_type]}]
        
        # Convert LangChain messages to dict format
        for msg in state["messages"]:
            if isinstance(msg, HumanMessage):
                messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                messages.append({"role": "assistant", "content": msg.content})
            elif isinstance(msg, SystemMessage):
                messages.append({"role": "system", "content": msg.content})
        
        return messages
    
    async def run(self, state: AgentState) -> AgentState:
        try:
            result = await self.graph.ainvoke(state)
            return result
        except Exception as e:
            print(f"Error in travel graph: {e}")
            # Return a fallback response
            state["response"] = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
            return state

# Global instance
travel_graph = TravelAssistantGraph()

async def load_conversation_history(user_id: str, session_id: str) -> List:
    """Load last 10 messages from MongoDB"""
    db = get_database()
    
    messages = await db.messages.find({
        "session_id": session_id,
        "user_id": user_id
    }).sort("timestamp", -1).limit(10).to_list(length=10)
    
    # Reverse to get chronological order
    messages.reverse()
    
    langchain_messages = []
    for msg in messages:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            langchain_messages.append(AIMessage(content=msg["content"]))
        elif msg["role"] == "system":
            langchain_messages.append(SystemMessage(content=msg["content"]))
    
    return langchain_messages

async def save_message(user_id: str, session_id: str, role: str, content: str):
    """Save message to MongoDB"""
    db = get_database()
    
    message = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow()
    }
    
    await db.messages.insert_one(message)

async def create_or_get_session(user_id: str, session_id: Optional[str] = None) -> str:
    """Create new session or get existing one"""
    db = get_database()
    
    if session_id:
        session = await db.sessions.find_one({"session_id": session_id, "user_id": user_id})
        if session:
            return session_id
    
    # Create new session
    new_session_id = str(uuid.uuid4())
    session = {
        "session_id": new_session_id,
        "user_id": user_id,
        "title": "New Conversation",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.sessions.insert_one(session)
    return new_session_id