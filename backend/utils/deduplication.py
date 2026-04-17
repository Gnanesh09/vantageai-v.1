from datasketch import MinHash, MinHashLSH
import hashlib

lsh = MinHashLSH(threshold=0.8, num_perm=128)
seen_reviews = {}

def get_minhash(text: str) -> MinHash:
    m = MinHash(num_perm=128)
    for word in text.lower().split():
        m.update(word.encode("utf8"))
    return m

def is_duplicate(review_id: str, text: str) -> bool:
    try:
        m = get_minhash(text)
        result = lsh.query(m)
        if result:
            return True
        lsh.insert(review_id, m)
        seen_reviews[review_id] = text
        return False
    except Exception:
        return False

def get_text_hash(text: str) -> str:
    return hashlib.md5(text.lower().strip().encode()).hexdigest()