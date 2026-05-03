# 多阶段构建
FROM python:3.12-slim AS builder

WORKDIR /app

# 安装依赖到临时目录
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# 生产镜像
FROM python:3.12-slim

WORKDIR /app

# 从 builder 复制依赖
COPY --from=builder /install /usr/local

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
