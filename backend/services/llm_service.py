import httpx
import json
from typing import AsyncGenerator, Dict, Any, List
from config import settings

class GrokLLMService:
    def __init__(self):
        self.api_key = settings.xai_api_key
        self.base_url = "https://api.groq.com/openai/v1"  # Using Groq API
        self.model = "llama-3.3-70b-versatile"  # Using Llama 3.3 70B model
        
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any] | AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            if stream:
                return self._stream_response(client, headers, payload)
            else:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                return response.json()
    
    async def _stream_response(
        self, 
        client: httpx.AsyncClient, 
        headers: Dict[str, str], 
        payload: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        async with client.stream(
            "POST",
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        if chunk["choices"][0]["delta"].get("content"):
                            yield chunk["choices"][0]["delta"]["content"]
                    except (json.JSONDecodeError, KeyError):
                        continue

llm_service = GrokLLMService()