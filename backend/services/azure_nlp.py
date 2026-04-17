import json
from openai import AzureOpenAI
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from config import (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
                    AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION,
                    AZURE_LANGUAGE_ENDPOINT, AZURE_LANGUAGE_KEY)

def get_openai_client():
    return AzureOpenAI(
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_key=AZURE_OPENAI_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION
    )

def get_language_client():
    return TextAnalyticsClient(
        endpoint=AZURE_LANGUAGE_ENDPOINT,
        credential=AzureKeyCredential(AZURE_LANGUAGE_KEY)
    )

def analyse_review_with_gpt(review_text: str, system_prompt: str) -> dict:
    client = get_openai_client()
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Review: {review_text}"}
        ],
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)

def analyse_sentiment_azure(texts: list) -> list:
    client = get_language_client()
    try:
        results = client.analyze_sentiment(
            texts,
            show_opinion_mining=True,
            language="en"
        )
        return [r for r in results if not r.is_error]
    except Exception as e:
        print(f"Azure Language error: {e}")
        return []