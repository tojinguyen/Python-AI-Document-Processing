from django.urls import path
from .views import DocumentUploadView, DocumentListView, DocumentDeleteView


urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('<uuid:pk>/', DocumentDeleteView.as_view(), name='document-delete'),
    path('', DocumentListView.as_view(), name='document-list'),
]
