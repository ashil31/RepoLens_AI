from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn
import typing

app = FastAPI()

# Load the model globally so it only loads once
print("Loading model BAAI/bge-base-en-v1.5...")
model = SentenceTransformer('BAAI/bge-base-en-v1.5')
print("Model loaded successfully.")

class EmbedRequest(BaseModel):
    text: typing.Union[str, typing.List[str]]

class EmbedResponse(BaseModel):
    embedding: typing.Union[typing.List[float], typing.List[typing.List[float]]]

@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest):
    import time
    start_time = time.time()
    try:
        if isinstance(request.text, str):
            print(f"Embedding single text...")
            embedding = model.encode(request.text, normalize_embeddings=True)
            print(f"Done in {time.time() - start_time:.2f}s")
            return EmbedResponse(embedding=embedding.tolist())
        else:
            print(f"Embedding batch of {len(request.text)} texts...")
            embeddings = model.encode(request.text, normalize_embeddings=True)
            print(f"Done in {time.time() - start_time:.2f}s")
            return EmbedResponse(embedding=embeddings.tolist())
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
