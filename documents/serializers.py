from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'file_name', 'file_size', 'mime_type', 'status', 'created_at']
        read_only_fields = fields
        
class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['file']

    def validate_file(self, value):
        # Kiểm tra định dạng file (ví dụ: pdf, docx, txt)
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Định dạng file không được hỗ trợ.")
        # Kiểm tra kích thước file (ví dụ: giới hạn 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Kích thước file không được vượt quá 10MB.")
        return value