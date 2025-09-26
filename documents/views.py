from django.shortcuts import render
from rest_framework import generics
from .models import Document
from .serializers import DocumentUploadSerializer, DocumentSerializer
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status

class DocumentUploadView(generics.CreateAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        file_obj = self.request.data.get('file')
        document = serializer.save(
            user =self.request.user,
            file_name = file_obj.name,
            file_size = file_obj.size,
            mime_type = file_obj.content_type
        )
        
        # TODO: Bước 4 - Gọi Celery task để xử lý nền
        # process_document.delay(document.id)
        
        return Response(
            {"message": "Document uploaded successfully and processing started.", "document_id": document.id},
            status=status.HTTP_201_CREATED
        )
        
        
class DocumentListView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user).order_by('-created_at')