from rest_framework import serializers
from .models import Conversation, ChatMessage, DocumentChunk

class AskQuestionSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=1000)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    
    
class DocumentChunkSourceSerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(source='document.file_name', read_only=True)
    
    class Meta:
        model = DocumentChunk
        fields = ['id', 'content', 'document_name', 'page_number']


class ChatMessageSerializer(serializers.ModelSerializer):
    sources = DocumentChunkSourceSerializer(many=True, read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'sources', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'user', 'title', 'created_at', 'updated_at']