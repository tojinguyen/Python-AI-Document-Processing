from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from pgvector.django import CosineDistance

from .serializers import AskQuestionSerializer, ChatMessageSerializer
from .models import Conversation, ChatMessage
from documents.models import DocumentChunk
from documents.tasks import embedding_model 
from openai import OpenAI
from django.conf import settings 
import logging

logger = logging.getLogger(__name__)

    
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
        prompt = f"""
        Bạn là một trợ lý AI hữu ích. Hãy trả lời câu hỏi của người dùng CHỈ DỰA VÀO ngữ cảnh được cung cấp từ tài liệu của họ.
        Câu trả lời của bạn phải bằng tiếng Việt.
        Nếu ngữ cảnh không chứa câu trả lời, hãy nói: "Xin lỗi, tôi không tìm thấy thông tin để trả lời câu hỏi này trong tài liệu của bạn."
        
        Ngữ cảnh:
        ---
        {context}
        ---
        
        Câu hỏi: {question}
        
        Câu trả lời (bằng tiếng Việt):
        """
        
        final_answer = ""
        try:
            if not settings.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY is not configured.")
                raise ValueError("OPENAI_API_KEY is not configured.")

            logger.debug(f"Prompt sent to OpenAI: {prompt}")
            
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo", 
                messages=[
                    {"role": "system", "content": "Bạn là một trợ lý AI hữu ích chuyên trả lời câu hỏi dựa trên ngữ cảnh được cung cấp bằng tiếng Việt."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
            )
            final_answer = response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}", exc_info=True)
            final_answer = "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn với mô hình AI."
        
        # Tạo và lưu tin nhắn của assistant
        assistant_message = ChatMessage.objects.create(
            conversation=conversation,
            role='assistant',
            content=final_answer  
        )
        # Gắn các sources vào tin nhắn
        assistant_message.sources.set(relevant_chunks)

        response_serializer = ChatMessageSerializer(assistant_message)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    