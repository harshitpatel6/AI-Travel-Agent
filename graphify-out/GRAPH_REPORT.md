# Graph Report - travel_agent-development  (2026-04-25)

## Corpus Check
- 26 files · ~12,988 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 177 nodes · 323 edges · 9 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `get_database()` - 36 edges
2. `chat()` - 11 edges
3. `TravelAssistantGraph` - 11 edges
4. `log_activity()` - 9 edges
5. `register()` - 8 edges
6. `get_user_subscription()` - 8 edges
7. `create_hotel_booking()` - 8 edges
8. `create_flight_booking()` - 8 edges
9. `SystemRole` - 8 edges
10. `ActivityType` - 8 edges

## Surprising Connections (you probably didn't know these)
- `verify_otp()` --calls--> `get_database()`  [INFERRED]
  backend/auth/auth.py → backend/database/mongo.py
- `register()` --calls--> `User`  [INFERRED]
  backend/main.py → backend/models/models.py
- `register()` --calls--> `Subscription`  [INFERRED]
  backend/main.py → backend/models/models.py
- `login()` --calls--> `create_access_token()`  [INFERRED]
  backend/main.py → backend/auth/auth.py
- `send_otp()` --calls--> `send_otp_email()`  [INFERRED]
  backend/main.py → backend/auth/auth.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (30): create_access_token(), hash_password(), log_activity(), send_otp_email(), verify_password(), admin_dashboard(), change_password(), delete_user() (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (25): BaseModel, ActivityLog, AnalyticsData, ChangePasswordRequest, ChatRequest, ChatResponse, DashboardStats, Flight (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (20): AuthService, get_current_user(), Decorator to require specific roles, Require admin role or higher, Require super admin role or higher, Require system admin role, require_admin(), require_role() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (19): FlightBooking, HotelBooking, create_flight_booking(), create_hotel_booking(), get_flight_info(), get_hotel_info(), mcp_chat(), mcp_tools() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (2): TravelAssistantGraph, GrokLLMService

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (13): get_user_subscription(), AgentState, create_or_get_session(), load_conversation_history(), Load last 10 messages from MongoDB, Save message to MongoDB, Create new session or get existing one, save_message() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (5): lifespan(), close_mongo_connection(), connect_to_mongo(), create_indexes(), MongoDB

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (3): BaseSettings, Config, Settings

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (2): Create indexes for all collections, setup_indexes()

## Knowledge Gaps
- **7 isolated node(s):** `Config`, `Basic rate limiting middleware`, `MongoDB`, `Create indexes for all collections`, `Load last 10 messages from MongoDB` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 4`** (15 nodes): `llm_service.py`, `TravelAssistantGraph`, `.booking_agent()`, `._build_graph()`, `.classify_intent()`, `.flight_agent()`, `.general_chat()`, `.hotel_agent()`, `.__init__()`, `._prepare_messages()`, `.route_intent()`, `GrokLLMService`, `.chat_completion()`, `.__init__()`, `._stream_response()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (3 nodes): `setup_indexes.py`, `Create indexes for all collections`, `setup_indexes()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_database()` connect `Community 0` to `Community 2`, `Community 3`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `TravelAssistantGraph` connect `Community 4` to `Community 5`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `chat()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 35 inferred relationships involving `get_database()` (e.g. with `register()` and `verify_otp()`) actually correct?**
  _`get_database()` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `str` (e.g. with `register()` and `chat()`) actually correct?**
  _`str` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `chat()` (e.g. with `get_user_subscription()` and `check_usage_limits()`) actually correct?**
  _`chat()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `Basic rate limiting middleware`, `MongoDB` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._