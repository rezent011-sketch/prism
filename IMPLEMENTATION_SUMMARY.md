# Prism v0.2 - Agent Memory & Relationship Tracking

## ✅ Implementation Complete

### Overview
Added long-term memory and relationship dynamics to the Prism agent simulator, enabling agents to remember past interactions and develop evolving relationships based on agreement/disagreement patterns.

### Changes Made

#### 1. Database Schema Extensions (`prism/database.py`)
**New Tables:**
- `agent_relations`: Tracks trust scores and influence counts between agent pairs
  - `trust_score`: -1.0 to +1.0 (agreement: +0.1, disagreement: -0.15)
  - `influence_count`: Number of interactions recorded
  - `last_updated`: Timestamp of last update

- `agent_memories`: Stores significant events from each turn
  - `turn`: Turn number when memory was created
  - `memory_text`: Description of event (e.g., "ターン3でAliceから反論を受けた")

**New Functions:**
- `save_agent_memory(agent_id, sim_id, turn, memory_text)`: Save event
- `get_agent_memories(agent_id, limit=3)`: Retrieve recent memories
- `update_relation(sim_id, from_id, to_id, delta)`: Update/create relationship
- `get_relations(sim_id)`: Get all relationships in simulation
- `get_agent_relations(agent_id, sim_id)`: Get agent's relationships

#### 2. Simulator Enhancement (`prism/simulator.py`)
**New Analysis Function:**
- `_analyze_and_record()`: Parses agent utterances using Claude Haiku to detect:
  - Agreement statements → +0.1 trust score
  - Disagreement statements → -0.15 trust score
  - Creates memories for both speaker and target agent

**Enhanced Agent Prompts:**
Agents now receive:
- **【過去の記憶】**: Last 3 memories (e.g., "ターン2でBobから賛同を受けた")
- **【主要な関係性】**: Top 2 trusted and distrusted agents with trust scores

#### 3. API Enhancement (`api/server.py`)
**New Endpoint:**
```
GET /api/simulations/{sim_id}/relations
```
Returns all agent relationships with:
- Agent IDs and names
- Trust scores
- Influence counts

#### 4. Design Decisions
- **Cost Optimization**: Relationship analysis uses Claude Haiku at 100 tokens max
- **Backward Compatibility**: Existing simulations unaffected; memory/relations optional
- **Data Integrity**: Bidirectional relationships prevent duplicate entries
- **Bounded Scores**: Trust scores clamped to [-1.0, 1.0] to prevent infinity
- **Recent Context**: Only 3 most recent memories loaded per turn (token efficiency)

### Testing & Validation
✅ Database functions verified  
✅ Memory storage/retrieval working  
✅ Relationship tracking working  
✅ Analysis logic validated  
✅ API endpoint structure confirmed  
✅ No breaking changes to existing code  

### Files Modified
- `prism/database.py`: +140 lines
- `prism/simulator.py`: +85 lines
- `api/server.py`: +6 lines

### Git Commit
```
feat: add agent memory & relationship tracking (v0.2)
Commit: 23472e4
```

## Usage Example

### CLI Usage
```bash
python3 main.py simulate --file examples/pr_crisis_seed.txt
```

### API Usage
```bash
# Get relationships after simulation completes
curl http://localhost:8000/api/simulations/1/relations
```

Response:
```json
{
  "relations": [
    {
      "from_id": 1,
      "to_id": 2,
      "from_name": "CEO_Tanaka",
      "to_name": "PR_Manager",
      "trust_score": 0.2,
      "influence_count": 2
    },
    ...
  ]
}
```

## Next Steps (Optional Enhancements)
- [ ] Persist relationship evolution visualization
- [ ] Add emotion decay over time
- [ ] Implement alliance/conflict clusters
- [ ] Add relationship repair mechanisms
- [ ] Track relationship change trends

---
**Implementation Date**: 2026-03-10  
**Status**: Production Ready
