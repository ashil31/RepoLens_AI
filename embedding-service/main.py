from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from FlagEmbedding import FlagModel
import typing
import uvicorn
import time

app = FastAPI()

# Load model once at startup
print("Loading model BAAI/bge-base-en-v1.5...")

model = FlagModel(
    "BAAI/bge-base-en-v1.5",
    use_fp16=False  # set True if using GPU
)

print("Model loaded successfully.")

# Request schema
class EmbedRequest(BaseModel):
    text: typing.Union[str, typing.List[str]]

# Response schema
class EmbedResponse(BaseModel):
    embedding: typing.Union[
        typing.List[float],
        typing.List[typing.List[float]]
    ]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest):

    start_time = time.time()

    try:
        # Single text
        if isinstance(request.text, str):
            print("Embedding single text")

            embedding = model.encode(
                [request.text],
                batch_size=32
            )[0]

            print(f"Done in {time.time() - start_time:.2f}s")

            return EmbedResponse(
                embedding=embedding.tolist()
            )

        # Batch texts
        else:
            print(f"Embedding batch of {len(request.text)} texts")

            embeddings = model.encode(
                request.text,
                batch_size=32
            )

            print(f"Done in {time.time() - start_time:.2f}s")

            return EmbedResponse(
                embedding=embeddings.tolist()
            )

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        workers=1
    )