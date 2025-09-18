# Python AI Document Processing System

A comprehensive AI-powered document processing system that allows users to upload, process, and interact with their documents through an intelligent chatbot interface.

## 🎯 Project Overview

This system enables users to upload documents (PDF, DOCX, TXT), automatically processes them using AI to extract and vectorize content, and provides an intelligent chatbot interface for document querying and information retrieval.

## 🏗️ System Architecture

### Tech Stack
- **Backend**: Django REST Framework
- **Database**: PostgreSQL with pgvector extension
- **File Storage**: MinIO (S3-compatible)
- **Message Queue**: RabbitMQ + Celery
- **AI/ML**: HuggingFace Transformers / OpenAI API
- **Authentication**: JWT tokens
- **Vector Database**: pgvector for similarity search

### Key Components
1. **User Management Module** - Registration, authentication, and access control
2. **Document Management Module** - Upload, storage, and processing pipeline
3. **Chatbot Module** - AI-powered document querying
4. **Admin Module** - System monitoring and management (optional)

---

## 📋 Module Details

## **1. Module User (Đăng ký / Quản lý tài khoản)**

> **Mục tiêu**: Quản lý user và bảo mật quyền truy cập dữ liệu tài liệu.

### **Tính năng:**

#### **Đăng ký tài khoản**
- Đăng ký với email và mật khẩu
- Xác thực cơ bản với Django authentication
- Hash password bằng Django's built-in security

#### **Đăng nhập**
- Xác thực user credentials
- Trả về JWT token cho session management
- Token refresh mechanism

#### **Profile cá nhân**
- Xem thông tin cá nhân (email, tên, ngày tạo tài khoản)
- Chỉnh sửa thông tin cá nhân
- Đổi mật khẩu

#### **Phân quyền cơ bản**
- Mỗi user chỉ có thể:
  - Xem tài liệu của chính mình
  - Chat với tài liệu của chính mình
  - Không thể truy cập dữ liệu của user khác

### **API Endpoints:**
```
POST /api/auth/register/     # Đăng ký tài khoản
POST /api/auth/login/        # Đăng nhập
POST /api/auth/refresh/      # Refresh token
GET  /api/auth/profile/      # Xem profile
PUT  /api/auth/profile/      # Cập nhật profile
POST /api/auth/change-password/  # Đổi mật khẩu
```

---

## **2. Module Document (Quản lý tài liệu)**

> **Mục tiêu**: Upload, lưu trữ, và xử lý tài liệu để tra cứu.

### **2.1. Upload & Storage**

#### **File Upload Process**
- User upload tài liệu qua web interface
- Hỗ trợ định dạng: PDF, DOCX, TXT
- Kiểm tra định dạng và kích thước file
- Lưu file gốc vào **MinIO** storage

#### **Database Schema**
Lưu metadata vào **PostgreSQL**:

```sql
-- Documents table
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Status values: pending, processing, ready, failed
```

### **2.2. Xử lý tài liệu (Background Task với Celery + RabbitMQ)**

> **Khi upload xong, hệ thống sẽ chạy job nền để phân tích dữ liệu.**

#### **Processing Pipeline:**

1. **Extract Text**
   - Sử dụng `PyMuPDF` cho PDF files
   - Sử dụng `python-docx` cho DOCX files
   - Đọc trực tiếp cho TXT files
   - Lưu extracted text vào database

2. **Text Chunking**
   - Cắt tài liệu thành các đoạn nhỏ (~500 từ)
   - Overlap giữa các chunks để đảm bảo context
   - Lưu chunks vào bảng `document_chunks`

3. **Embedding Generation**
   - Convert từng chunk thành vector embedding
   - Sử dụng HuggingFace Sentence Transformers hoặc OpenAI API
   - Vector dimension: 768 hoặc 1536 (tùy model)

4. **Vector Storage**
   - Lưu vectors vào PostgreSQL với pgvector extension
   - Tạo index cho similarity search
   - Link chunks với document gốc

5. **Status Update**
   - Cập nhật `status = 'ready'` khi hoàn thành
   - `status = 'failed'` nếu có lỗi trong quá trình xử lý

#### **Database Schema cho Chunks:**

```sql
-- Document chunks table
CREATE TABLE document_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(document_id),
    chunk_index INTEGER,
    content TEXT NOT NULL,
    embedding VECTOR(768), -- pgvector type
    page_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

#### **Celery Task Benefits:**
- Job chạy background, không block UI
- Có thể scale workers khi traffic cao
- Retry mechanism khi task fail
- Task monitoring và logging

### **API Endpoints:**
```
POST /api/documents/upload/           # Upload tài liệu
GET  /api/documents/                  # List tài liệu của user
GET  /api/documents/{id}/            # Chi tiết tài liệu
DELETE /api/documents/{id}/          # Xóa tài liệu
GET  /api/documents/{id}/status/     # Check processing status
```

---

## **3. Module Chatbot (Tra cứu tài liệu)**

> **Mục tiêu**: Cho phép user chat với hệ thống để tìm thông tin từ tài liệu đã upload.

### **3.1. Chat Flow**

#### **Query Processing Pipeline:**

1. **User Input**: User nhập câu hỏi trong chat interface
2. **Query Embedding**: Convert câu hỏi thành vector embedding
3. **Similarity Search**: 
   - Tìm top N chunks có embedding gần nhất
   - Chỉ search trong documents của user hiện tại
   - Sử dụng cosine similarity
4. **Context Preparation**: Chuẩn bị context từ relevant chunks
5. **LLM Processing**: Gửi context + question tới LLM
6. **Response Generation**: AI tạo câu trả lời dựa trên context
7. **Source Attribution**: Attach thông tin nguồn tài liệu

#### **Similarity Search Query:**
```sql
SELECT 
    dc.chunk_id,
    dc.content,
    dc.page_number,
    d.file_name,
    1 - (dc.embedding <=> %s) as similarity_score
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.document_id
WHERE d.user_id = %s 
  AND d.status = 'ready'
ORDER BY dc.embedding <=> %s
LIMIT %s;
```

### **3.2. Chat API Response**

#### **Response Format:**

```json
{
  "conversation_id": "uuid-string",
  "question": "Điều khoản về nghỉ việc trong hợp đồng là gì?",
  "answer": "Theo Điều 12 trong hợp đồng lao động, nhân viên có quyền nghỉ việc với điều kiện thông báo trước ít nhất 30 ngày làm việc. Nhân viên cần nộp đơn xin nghỉ việc theo mẫu quy định và hoàn thành bàn giao công việc.",
  "sources": [
    {
      "chunk_id": "uuid-15",
      "document_id": "uuid-doc-1",
      "document_name": "HopDongLaoDong2025.pdf",
      "page_number": 3,
      "content_preview": "Điều 12: Quy định về nghỉ việc. Nhân viên có quyền đơn phương chấm dứt hợp đồng lao động với điều kiện thông báo trước...",
      "similarity_score": 0.89
    },
    {
      "chunk_id": "uuid-27",
      "document_id": "uuid-doc-1", 
      "document_name": "HopDongLaoDong2025.pdf",
      "page_number": 4,
      "content_preview": "Quy trình bàn giao: Nhân viên nghỉ việc phải hoàn thành việc bàn giao tài liệu, dự án và tài sản công ty...",
      "similarity_score": 0.76
    }
  ],
  "timestamp": "2025-09-18T10:30:00Z"
}
```

### **3.3. UI Chatbot Features**

#### **Chat Interface:**
- **Modern chat UI** giống ChatGPT/Claude
- **Real-time messaging** với WebSocket hoặc polling
- **Message history** lưu conversation
- **Typing indicators** khi AI đang process

#### **Source Citations:**
- Mỗi response có **trích dẫn nguồn rõ ràng**
- Click vào citation để xem **full context** của chunk
- Highlight text tương ứng trong document gốc
- **Page number reference** để dễ tìm trong file gốc

#### **Enhanced Features:**
- **Conversation threads** - group related questions
- **Quick suggestions** based on document content
- **Export chat history** to PDF/text
- **Search in chat history**

### **API Endpoints:**
```
POST /api/chat/ask/                    # Gửi câu hỏi
GET  /api/chat/conversations/          # List conversations
GET  /api/chat/conversations/{id}/     # Chi tiết conversation
POST /api/chat/conversations/          # Tạo conversation mới
DELETE /api/chat/conversations/{id}/   # Xóa conversation
GET  /api/chat/chunks/{id}/           # Xem full context của chunk
```

---

## **4. Module Admin (Optional)**

> **Giúp quản lý hệ thống nội bộ khi có thời gian phát triển thêm.**

### **4.1. User Management**
- **User List**: Xem danh sách tất cả users
- **User Details**: Thông tin chi tiết và activity logs
- **User Actions**: Block/unblock, reset password
- **User Statistics**: Document count, chat activity

### **4.2. System Analytics**
- **Document Statistics**:
  - Tổng số documents đã upload
  - Documents by status (pending/processing/ready/failed)
  - Storage usage statistics
  - Most active users

- **Chat Analytics**:
  - Top câu hỏi phổ biến
  - Response accuracy metrics
  - User engagement metrics
  - Peak usage times

### **4.3. System Monitoring**
- **Celery Task Monitor**:
  - Active/pending/failed tasks
  - Task execution times
  - Worker status and health
  - Queue depth monitoring

- **System Health**:
  - Database performance metrics
  - MinIO storage status
  - API response times
  - Error rate monitoring

### **Admin API Endpoints:**
```
GET  /api/admin/users/                 # User management
GET  /api/admin/stats/documents/       # Document statistics  
GET  /api/admin/stats/chat/           # Chat analytics
GET  /api/admin/system/health/        # System health check
GET  /api/admin/celery/tasks/         # Celery task monitoring
```

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.9+
- PostgreSQL 13+ with pgvector extension
- Redis (for Celery)
- RabbitMQ (message broker)
- MinIO or AWS S3 access

### **Installation**

1. **Clone repository**
```bash
git clone https://github.com/tojinguyen/Python-AI-Document-Processing.git
cd Python-AI-Document-Processing
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Setup PostgreSQL with pgvector**
```sql
CREATE EXTENSION vector;
```

5. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your configurations
```

6. **Database migration**
```bash
python manage.py migrate
```

7. **Start services**
```bash
# Start Celery worker
celery -A config worker -l info

# Start Django development server  
python manage.py runserver
```

### **Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/doc_processing

# MinIO/S3
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key

# AI/ML
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_hf_key

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your_jwt_secret
```

---

## 📊 Database Schema

### **Core Tables**
```sql
-- Users table (Django default extended)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks with vectors
CREATE TABLE document_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    page_number INTEGER,
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    sources JSONB, -- Referenced chunks and documents
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 API Documentation

### **Authentication Flow**
```python
# Register
POST /api/auth/register/
{
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
}

# Login Response
{
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John"
    }
}
```

### **Document Upload Flow**
```python
# Upload document
POST /api/documents/upload/
Content-Type: multipart/form-data
Authorization: Bearer {access_token}

{
    "file": file_object,
    "title": "Optional custom title"
}

# Response
{
    "document_id": "uuid",
    "file_name": "document.pdf", 
    "status": "pending",
    "message": "Document uploaded successfully. Processing will begin shortly."
}
```

### **Chat Flow**
```python
# Start conversation
POST /api/chat/ask/
Authorization: Bearer {access_token}

{
    "question": "What are the vacation policies?",
    "conversation_id": "optional_uuid" // omit to start new conversation
}

# Response format shown in section 3.2 above
```

---

## 🏃‍♂️ Development Workflow

### **Adding New Features**
1. Create feature branch from `main`
2. Implement backend API endpoints
3. Add database migrations if needed  
4. Write unit tests
5. Update API documentation
6. Create pull request

### **Testing**
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.documents.tests

# Coverage report
coverage run manage.py test
coverage report
```

### **Code Quality**
```bash
# Format code
black .
isort .

# Lint code  
flake8 .
pylint apps/
```

---

## 📈 Performance Considerations

### **Optimization Strategies**
- **Database Indexing**: Proper indexes on user_id, document_id, embedding vectors
- **Caching**: Redis cache for frequent queries and user sessions
- **Async Processing**: All heavy operations via Celery background tasks
- **Pagination**: All list endpoints support pagination
- **File Compression**: Compress stored files when possible

### **Scaling Recommendations**
- **Horizontal Scaling**: Multiple Celery workers for document processing
- **Database Replication**: Read replicas for analytics queries
- **CDN Integration**: Serve static files via CDN
- **Load Balancing**: Multiple Django app instances behind load balancer

---

## 🔒 Security Features

### **Authentication & Authorization**
- JWT token-based authentication
- User isolation - can only access own documents
- Password hashing with Django's PBKDF2
- Token expiration and refresh mechanism

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention with ORM
- File type validation for uploads
- Rate limiting on API endpoints

### **Infrastructure Security**
- Environment variable configuration
- Secrets management for API keys
- HTTPS enforcement in production
- Database connection encryption

---

## 🚀 Deployment Guide

### **Production Environment**
```yaml
# docker-compose.yml example
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
    depends_on:
      - db
      - redis
      
  worker:
    build: .
    command: celery -A config worker -l info
    depends_on:
      - db
      - redis
      
  db:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: doc_processing
      
  redis:
    image: redis:7-alpine
```

### **Environment Setup**
1. Set up PostgreSQL with pgvector
2. Configure MinIO or S3 bucket
3. Set up monitoring (optional: Sentry, DataDog)
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`) 
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support and questions:
- Create an issue in this repository
- Email: support@example.com
- Documentation: [Wiki](https://github.com/tojinguyen/Python-AI-Document-Processing/wiki)

---

## 🗺️ Roadmap

### **Phase 1 (Current)**
- ✅ User authentication system
- ✅ Document upload and storage
- ✅ Basic text extraction and chunking
- ✅ Simple chat interface

### **Phase 2 (Next)**
- 🔄 Advanced embedding models
- 🔄 Improved chat UI/UX
- 🔄 Admin dashboard
- 🔄 Performance optimizations

### **Phase 3 (Future)**
- 📋 Multi-language support
- 📋 Advanced analytics
- 📋 API rate limiting
- 📋 Mobile app integration

---

*Last updated: September 18, 2025*