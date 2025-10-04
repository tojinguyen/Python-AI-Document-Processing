import logging
import io
import fitz  # PyMuPDF
import docx
from celery import shared_task
from django.db import transaction
from datetime import timedelta
from django.utils import timezone
from .models import Document, DocumentChunk
from sentence_transformers import SentenceTransformer

# Khởi tạo logger
logger = logging.getLogger(__name__)

try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("SentenceTransformer model 'all-MiniLM-L6-v2' loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load SentenceTransformer model: {e}")
    embedding_model = None
    
    
def extract_text_from_pdf(file_bytes):
    """Trích xuất văn bản từ file PDF."""
    text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_text_from_docx(file_bytes):
    """Trích xuất văn bản từ file DOCX."""
    text = ""
    doc = docx.Document(io.BytesIO(file_bytes))
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text


def chunk_text(text, chunk_size=500, chunk_overlap=50):
    """Chia văn bản thành các đoạn nhỏ (chunks)."""
    # Một phương pháp chia đơn giản, có thể cải tiến sau
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - chunk_overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


@shared_task(name="process_document")
def process_document(document_id):
    """
    Task xử lý tài liệu: Tải file, trích xuất text, chia chunks, tạo embedding và lưu vào DB.
    """
    if not embedding_model:
        logger.error("Embedding model is not available. Aborting task.")
        # Cập nhật trạng thái lỗi cho document
        Document.objects.filter(id=document_id).update(
            status='failed',
            processing_error="Embedding model could not be loaded."
        )
        return

    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        logger.error(f"Document with id {document_id} not found.")
        return

    logger.info(f"Starting processing for document: {document.file_name} (ID: {document_id})")

    try:
        # Cập nhật trạng thái sang 'processing'
        document.status = 'processing'
        document.save()

        # Tải nội dung file từ MinIO
        file_content = document.file.read()

        # 1. Trích xuất văn bản (Text Extraction)
        text = ""
        if document.mime_type == 'application/pdf':
            text = extract_text_from_pdf(file_content)
        elif document.mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            text = extract_text_from_docx(file_content)
        elif document.mime_type == 'text/plain':
            text = file_content.decode('utf-8')
        else:
            raise ValueError(f"Unsupported mime type: {document.mime_type}")

        if not text.strip():
            raise ValueError("No text could be extracted from the document.")

        # 2. Chia thành các đoạn nhỏ (Chunking)
        text_chunks = chunk_text(text)
        logger.info(f"Document chunked into {len(text_chunks)} pieces.")

        # 3. Tạo Embeddings
        embeddings = embedding_model.encode(text_chunks, show_progress_bar=False)

        # 4. Lưu Chunks và Embeddings vào DB
        # Sử dụng transaction để đảm bảo toàn vẹn dữ liệu
        with transaction.atomic():
            # Xóa các chunk cũ nếu có (trường hợp re-process)
            DocumentChunk.objects.filter(document=document).delete()
            
            chunks_to_create = []
            for i, chunk_content in enumerate(text_chunks):
                chunk_embedding = embeddings[i]
                chunks_to_create.append(
                    DocumentChunk(
                        document=document,
                        content=chunk_content,
                        embedding=chunk_embedding
                    )
                )
            
            DocumentChunk.objects.bulk_create(chunks_to_create, batch_size=500)
            logger.info(f"Successfully created {len(chunks_to_create)} chunks for document {document.id}")

        # Cập nhật trạng thái 'completed'
        document.status = 'completed'
        document.processing_error = None
        document.save()
        logger.info(f"Successfully processed document: {document.file_name}")

    except Exception as e:
        logger.error(f"Error processing document {document.id}: {e}", exc_info=True)
        # Cập nhật trạng thái 'failed' và lưu lỗi
        document.status = 'failed'
        document.processing_error = str(e)
        document.save()
        
        
@shared_task(name="documents.tasks.cleanup_old_failed_documents")
def cleanup_old_failed_documents(days_old = 30):
    logger.info(f"Starting cleanup task for failed documents older than {days_old} days.")
    
    time_threshold = timezone.now() - timedelta(days=days_old)
    old_failed_docs = Document.objects.filter(
        status='failed',
        updated_at__lt=time_threshold
    )
    count = old_failed_docs.count()
    
    if count > 0:
        for doc in old_failed_docs:
            try:
                doc.file.delete(save=False)
                logger.info(f"Deleted file {doc.file_name} from storage.")
            except Exception as e:
                logger.error(f"Could not delete file for document {doc.id}: {e}")

        # Xóa bản ghi trong database
        old_failed_docs.delete()
        logger.info(f"Successfully cleaned up {count} old failed document records.")
    else:
        logger.info("No old failed documents to clean up.")
    
    logger.info(f"Cleaned up {count} old failed documents.")
    return f"Cleaned up {count} documents."