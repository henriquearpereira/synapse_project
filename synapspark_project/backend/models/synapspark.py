import spacy
import random
from pymongo import MongoClient
from transformers import pipeline
import requests
from anthropic import Anthropic
from openai import OpenAI
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter('synapspark_requests_total', 'Total number of requests', ['model'])
REQUEST_LATENCY = Histogram('synapspark_request_latency_seconds', 'Request latency', ['model'])

class SynapSpark:
    def __init__(self):
        self.client = MongoClient("mongodb://mongodb:27017/")
        self.db = self.client["synapspark_db"]
        self.memory_collection = self.db["user_memory"]
        self.feedback_collection = self.db["feedback"]

        self.intent_classifier = pipeline("zero-shot-classification", model="facebook/xlm-roberta-base")
        self.intents = ["narrative", "poem", "humor", "desconhecido"]

        self.cultural_context = {
            "narrative": ["épico", "sombrio", "onírico", "futurista", "histórico"],
            "poem": ["lírico", "modernista", "haiku", "soneto", "surrealista"],
            "humor": ["sarcástico", "absurdo", "trocadilho", "satírico", "leve"]
        }
        self.emotional_tones = ["melancólico", "esperançoso", "tenso", "leve", "intenso"]
        self.styles = ["clássico", "moderno", "descolado", "poético", "minimalista"]

        self.anthropic_client = Anthropic(api_key="sua-chave-anthropic") if "sua-chave-anthropic" else None
        self.openai_client = OpenAI(api_key="sua-chave-openai") if "sua-chave-openai" else None

    def parse_intent(self, prompt):
        result = self.intent_classifier(prompt, candidate_labels=self.intents)
        intent = result["labels"][0]
        main_topic = None
        if " about " in prompt.lower():
            main_topic = prompt.lower().split(" about ")[-1]
        elif " sobre " in prompt.lower():
            main_topic = prompt.lower().split(" sobre ")[-1]
        return intent, main_topic

    def add_context(self, intent, user_id):
        user_memory = self.memory_collection.find_one({"user_id": user_id}) or {}
        preferred_context = user_memory.get("preferred_context", {}).get(intent, self.cultural_context.get(intent, ["genérico"]))
        preferred_emotion = user_memory.get("preferred_emotion", {}).get(intent, self.emotional_tones)
        
        context = random.choice(preferred_context)
        emotion = random.choice(preferred_emotion)
        return context, emotion

    def expand_semantics(self, prompt, intent, context, emotion, main_topic, model="deepseek", params=None):
        REQUEST_COUNT.labels(model).inc()
        with REQUEST_LATENCY.labels(model).time():
            ollama_prompt = f"Expand this prompt semantically: '{prompt}'. Add a {context} and {emotion} tone."
            if main_topic:
                ollama_prompt += f" Focus on the topic: {main_topic}."

            params = params or {"temperature": 0.7, "top_p": 0.9, "max_tokens": 150}

            if model in ["deepseek", "llama", "gemma"]:
                ollama_model = {
                    "deepseek": "deepseek-coder-v2",
                    "llama": "llama3.1",  # Assume que tu tem LLaMA configurado no Ollama
                    "gemma": "gemma2"     # Assume que tu tem Gemma configurado no Ollama
                }.get(model, "deepseek-coder-v2")
                response = requests.post("http://ollama:11434/api/generate", json={
                    "model": ollama_model,
                    "prompt": ollama_prompt,
                    "stream": False,
                    "temperature": params["temperature"],
                    "top_p": params["top_p"],
                    "max_tokens": params["max_tokens"]
                }).json()
                return response.get("response", f"Expanded: {prompt} with a {context} and {emotion} tone")

            elif model == "claude" and self.anthropic_client:
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=params["max_tokens"],
                    temperature=params["temperature"],
                    messages=[{"role": "user", "content": ollama_prompt}]
                )
                return response.content[0].text

            elif model == "openai" and self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": ollama_prompt}],
                    temperature=params["temperature"],
                    top_p=params["top_p"],
                    max_tokens=params["max_tokens"]
                )
                return response.choices[0].message.content

            elif model == "o1-mini":
                return f"[Simulated o1-mini] Expanded: {prompt} with a {context} and {emotion} tone, in a highly reasoning-focused way"

            return f"Model {model} not supported or API key missing."

    def adjust_style(self, expanded_prompt, user_id):
        user_memory = self.memory_collection.find_one({"user_id": user_id}) or {}
        preferred_style = user_memory.get("preferred_style", self.styles)
        style = random.choice(preferred_style)
        return f"{expanded_prompt}, in a {style} style"

    def update_memory(self, user_id, intent, context, emotion, style):
        self.memory_collection.update_one(
            {"user_id": user_id},
            {
                "$push": {
                    f"preferred_context.{intent}": context,
                    f"preferred_emotion.{intent}": emotion,
                    "preferred_style": style
                }
            },
            upsert=True
        )

    def save_feedback(self, user_id, prompt, final_prompt, score):
        self.feedback_collection.insert_one({
            "user_id": user_id,
            "prompt": prompt,
            "final_prompt": final_prompt,
            "score": score
        })

    def reformulate_prompt(self, user_id, prompt, model="deepseek", params=None):
        intent, main_topic = self.parse_intent(prompt)
        context, emotion = self.add_context(intent, user_id)
        expanded = self.expand_semantics(prompt, intent, context, emotion, main_topic, model, params)
        final_prompt = self.adjust_style(expanded, user_id)
        self.update_memory(user_id, intent, context, emotion, final_prompt.split("in a ")[-1].split(" style")[0])
        return {
            "intent": intent,
            "context": context,
            "emotion": emotion,
            "expanded": expanded,
            "final_prompt": final_prompt
        }