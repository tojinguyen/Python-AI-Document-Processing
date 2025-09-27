from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from pgvector.django import CosineDistance

from .serializers import AskQuestionSerializer, ChatMessageSerializer, ConversationSerializer
from .models import Conversation, ChatMessage
from documents.models import Document, DocumentChunk
from documents.tasks import embedding_model 


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = AskQuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data['question']
        conversation_id = serializer.validated_data.get('conversation_id')
        user = request.user

        # Lấy hoặc tạo mới cuộc trò chuyện
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=user)
            except Conversation.DoesNotExist:
                return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            conversation = Conversation.objects.create(user=user, title=question[:50])

        # Lưu tin nhắn của người dùng
        ChatMessage.objects.create(conversation=conversation, role='user', content=question)

        # --- BƯỚC 1: RETRIEVAL ---
        # Vector hóa câu hỏi
        if not embedding_model:
            return Response({"error": "Embedding model not available."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        question_embedding = embedding_model.encode(question)

        # Tìm kiếm các chunks liên quan nhất trong tài liệu của user
        # Chỉ tìm trong các tài liệu đã xử lý xong ('completed')
        relevant_chunks = DocumentChunk.objects.filter(
            document__user=user, 
            document__status='completed'
        ).annotate(
            distance=CosineDistance('embedding', question_embedding)
        ).order_by('distance')[:5] # Lấy 5 chunks gần nhất

        if not relevant_chunks:
            answer_content = "I'm sorry, I couldn't find any relevant information in your documents to answer that question."
            assistant_message = ChatMessage.objects.create(
                conversation=conversation, 
                role='assistant', 
                content=answer_content
            )
            return Response(ChatMessageSerializer(assistant_message).data, status=status.HTTP_200_OK)

        # --- BƯỚC 2: AUGMENTATION ---
        context = "\n\n".join([chunk.content for chunk in relevant_chunks])

        # --- BƯỚC 3: GENERATION ---
        # TODO: Thay thế bằng lời gọi đến một LLM thực sự (ví dụ: OpenAI, Llama)
        # Hiện tại, chúng ta sẽ giả lập câu trả lời để kiểm tra luồng hoạt động
        
        # PROMPT TEMPLATE (để dùng với LLM thật)
        prompt = f"""
        You are a helpful AI assistant. Answer the user's question based ONLY on the following context provided from their documents.
        If the context does not contain the answer, say "I'm sorry, I couldn't find an answer in your documents."
        
        Context:
        ---
        {context}
        ---
        
        Question: {question}
        
        Answer:
        """
        
        # DUMMY RESPONSE (for testing without an LLM API key)
        dummy_answer = f"Based on your documents, here is the relevant information for '{question}':\n\n{context}"
        
        # Tạo và lưu tin nhắn của assistant
        assistant_message = ChatMessage.objects.create(
            conversation=conversation,
            role='assistant',
            content=dummy_answer  # Thay 'dummy_answer' bằng 'response_from_llm' khi tích hợp
        )
        # Gắn các sources vào tin nhắn
        assistant_message.sources.set(relevant_chunks)

        response_serializer = ChatMessageSerializer(assistant_message)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    