from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential
from config import AZURE_VISION_ENDPOINT, AZURE_VISION_KEY

DEFECT_KEYWORDS = [
    "broken","damaged","cracked","torn","leaked","dented",
    "scratched","defective","crushed","spilled","dirty","stained"
]

def analyse_image(image_url: str) -> dict:
    try:
        client = ImageAnalysisClient(
            endpoint=AZURE_VISION_ENDPOINT,
            credential=AzureKeyCredential(AZURE_VISION_KEY)
        )
        result = client.analyze_from_url(
            image_url=image_url,
            visual_features=[VisualFeatures.CAPTION, VisualFeatures.TAGS, VisualFeatures.OBJECTS]
        )
        tags = [t.name.lower() for t in (result.tags.list if result.tags else [])]
        caption = result.caption.text.lower() if result.caption else ""
        defect_found = any(k in tags or k in caption for k in DEFECT_KEYWORDS)
        return {
            "visual_defect_detected": defect_found,
            "visual_defect_description": caption,
            "tags": tags
        }
    except Exception as e:
        print(f"Vision error: {e}")
        return {"visual_defect_detected": False, "visual_defect_description": None, "tags": []}