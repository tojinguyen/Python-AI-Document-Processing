#!/bin/sh
echo "Starting Ollama service..."
/bin/ollama serve &
OLLAMA_PID=$!

echo "Waiting for Ollama to be ready..."
sleep 5

echo "Pulling Vinallama model... This may take a while."
ollama pull vinallama/vinallama-7b-chat

echo "Model pulled successfully. Ollama is running."
wait $OLLAMA_PID