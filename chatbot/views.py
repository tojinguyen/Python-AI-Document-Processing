from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from pgvector.django import CosineDistance

from .serializers import AskQuestionSerializer, ChatMessageSerializer
from .models import Conversation, ChatMessage
from documents.models import DocumentChunk
from documents.tasks import embedding_model 
from openai import OpenAI
import logging
import time

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
        ).order_by('distance')[:3] # Giảm xuống 3 chunks để giảm context length

        if not relevant_chunks:
            answer_content = "Xin lỗi, tôi không tìm thấy thông tin liên quan trong tài liệu của bạn để trả lời câu hỏi này."
            assistant_message = ChatMessage.objects.create(
                conversation=conversation, 
                role='assistant', 
                content=answer_content
            )
            return Response(ChatMessageSerializer(assistant_message).data, status=status.HTTP_200_OK)

        # --- BƯỚC 2: AUGMENTATION ---
        # Giới hạn độ dài context để tránh quá tải model
        context_parts = []
        total_length = 0
        max_context_length = 2000  # Giới hạn context length
        
        for chunk in relevant_chunks:
            if total_length + len(chunk.content) > max_context_length:
                break
            context_parts.append(chunk.content)
            total_length += len(chunk.content)
            
        context = "\n\n".join(context_parts)

        # --- BƯỚC 3: GENERATION ---
        # Sử dụng prompt ngắn gọn ngay từ đầu để giảm thời gian xử lý
        prompt = f"Trả lời ngắn gọn: {question}"
        
        final_answer = ""
        start_time = time.time()
        try:
            logger.info(f"Starting AI request for question: {question[:50]}...")
            
            # Tăng timeout và config connection
            client = OpenAI(
                base_url='http://ollama:11434/v1', 
                api_key='ollama',
                timeout=180.0,  # Tăng timeout lên 180 giây (3 phút)
                max_retries=0   # Tắt retry để tránh double timeout
            )
            
            # Warm-up model nếu là request đầu tiên (tùy chọn)
            logger.info("Sending request to phi3:mini model...")
            
            response = client.chat.completions.create(
                model="phi3:mini", 
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Giảm temperature để response nhanh hơn
                max_tokens=300,   # Giảm response length
                stream=False
            )
            final_answer = response.choices[0].message.content.strip()
            
            processing_time = time.time() - start_time
            logger.info(f"AI response received in {processing_time:.2f} seconds")

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Error calling OpenAI API after {processing_time:.2f}s: {e}", exc_info=True)
            
            if "timeout" in str(e).lower():
                final_answer = "Xin lỗi, hệ thống AI hiện đang quá tải. Vui lòng thử lại sau ít phút."
            else:
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

    
    