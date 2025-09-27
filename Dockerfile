# ---- Stage 1: Build Stage ----
# Sử dụng một image đầy đủ hơn để cài đặt dependencies
FROM python:3.11 as builder

WORKDIR /app

# Cài đặt các gói cần thiết cho việc build
RUN pip install --upgrade pip

# Sao chép requirements.txt và cài đặt gói vào một thư mục riêng
COPY requirements.txt .
RUN pip install --target=/app/packages -r requirements.txt


# ---- Stage 2: Final Stage ----
# Sử dụng một image slim gọn nhẹ cho production
FROM python:3.11-slim

WORKDIR /app

# Sao chép các gói đã được cài đặt từ stage builder
COPY --from=builder /app/packages /usr/local/lib/python3.11/site-packages

# Thêm thư mục bin của các gói vào PATH hệ thống
ENV PATH="/usr/local/lib/python3.11/site-packages/bin:${PATH}"

# Sao chép mã nguồn ứng dụng
COPY . .

# Thêm đường dẫn của các gói vào PYTHONPATH (đôi khi cần thiết)
ENV PYTHONPATH=/usr/local/lib/python3.11/site-packages

# Lệnh chạy ứng dụng
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]