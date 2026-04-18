#!/usr/bin/env python3
import csv
import json
import sys
from collections import defaultdict
from urllib import request, error

API_URL = "http://localhost:8000"
BRAND_ID = "1c4b5649-47e9-4f99-871e-f53742fd949f"
CSV_PATH = "/home/acer/vantageai1/Reviews_dataset_amazon.csv"

PRODUCT_SLUG_TO_ID = {
    "lays-classic-salted": "57e787b0-7666-4f75-b887-f5a0391ad3d2",
    "haldirams-aloo-bhujia": "2478eac8-d117-4702-969e-2037395f0229",
    "amul-taaza-toned-milk": "84ef4b9e-91de-420b-b5ca-59b0763c4040",
    "epigamia-greek-yogurt": "fc7455ee-3e41-421b-86dd-b5d403cbec58",
    "real-fruit-juice-mango": "9417e035-fc5c-4784-a2ce-fa7a7a57be16",
    "maggi-2-minute-noodles": "6b5564ed-b5b5-4f54-b99d-6ae5e07e4f8c",
    "dove-body-wash": "3b2ae675-b01c-481d-b5d1-b6d858a5b62c",
    "dairy-milk-silk": "6ad804e9-2a8a-42bc-9a21-57e0d0f369e3",
}


def to_int(v, default=0):
    try:
        return int(float(v))
    except Exception:
        return default


def post_json(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with request.urlopen(req, timeout=45) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def chunks(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def main():
    grouped = defaultdict(list)
    total = 0
    skipped = 0

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            slug = (row.get("product_slug") or "").strip()
            product_id = PRODUCT_SLUG_TO_ID.get(slug)
            text = (row.get("raw_text") or "").strip()
            if not product_id or not text:
                skipped += 1
                continue

            grouped[product_id].append(
                {
                    "text": text,
                    "rating": max(1, min(5, to_int(row.get("star_rating"), 5))),
                    "reviewer_id": (row.get("reviewer_id") or "").strip() or None,
                    "image_url": (row.get("image_url") or "").strip() or None,
                }
            )

    print(f"Read {total} rows. Skipped {skipped}. Upload groups: {len(grouped)}")

    grand_count = 0
    batch_size = 10
    for product_id, reviews in grouped.items():
        part = 0
        for batch in chunks(reviews, batch_size):
            part += 1
            payload = {
                "brand_id": BRAND_ID,
                "product_id": product_id,
                "reviews": batch,
            }
            try:
                status, body = post_json(f"{API_URL}/ingest/bulk", payload)
                count = body.get("ingested_count", 0)
                grand_count += count
                print(
                    f"product_id={product_id} part={part} size={len(batch)} status={status} ingested_count={count}"
                )
            except error.HTTPError as e:
                detail = e.read().decode("utf-8", errors="ignore")
                print(f"ERROR product_id={product_id} part={part} status={e.code} body={detail}")
            except Exception as e:
                print(f"ERROR product_id={product_id} part={part} err={e}")

    print(f"Done. Total ingested_count reported by API: {grand_count}")


if __name__ == "__main__":
    sys.exit(main())
