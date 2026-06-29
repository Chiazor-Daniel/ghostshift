# Free Services Setup Guide

## 🆓 Free AI Options (Choose ONE)

### **1. Groq (RECOMMENDED - Best Free Option)**
- **Website**: https://console.groq.com/
- **Free Tier**: Yes, 10,000 tokens/minute
- **Models**: Llama 3 70B, Mixtral, Phi-3
- **Speed**: Extremely fast (inference on dedicated hardware)
- **API Key**: Get from https://console.groq.com/keys

```bash
# In your .env file:
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama3-70b-8192
```

### **2. OpenAI (Paid but High Quality)**
- **Website**: https://platform.openai.com/api-keys
- **Free Tier**: No (pay per use)
- **Models**: GPT-4o, GPT-3.5 Turbo
- **Cost**: ~$0.01 per 1M tokens
- **API Key**: Get from https://platform.openai.com/api-keys

```bash
# In your .env file:
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o
```

### **3. Ollama Cloud (Free Tier)**
- **Website**: https://ollama.com/cloud
- **Free Tier**: Yes, limited hours
- **Models**: Llama 3, Mistral, Phi
- **API Key**: Get from https://ollama.com/cloud

```bash
# In your .env file:
OLLAMA_API_KEY=your-ollama-api-key-here
OLLAMA_MODEL=llama3:70b
```

---

## 🆓 Free SMTP Options (Choose ONE)

### **1. Mailtrap (BEST FOR TESTING)**
- **Website**: https://mailtrap.io
- **Free Tier**: Yes, 1,000 emails/month
- **Features**: 
  - Inbox to view emails (no real emails sent)
  - Perfect for development/testing
  - No spam complaints
- **Setup**:
  1. Go to https://mailtrap.io
  2. Sign up (free)
  3. Create inbox
  4. Copy SMTP credentials to `.env`

```bash
# In your .env file:
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@ghostshift.com
```

### **2. Resend (BEST FOR PRODUCTION)**
- **Website**: https://resend.com
- **Free Tier**: Yes, 3,000 emails/month
- **Features**:
  - Real emails sent
  - 99.9% delivery rate
  - Great for production
- **Setup**:
  1. Go to https://resend.com
  2. Sign up (free)
  3. Create API key
  4. Add domain verification
  5. Copy credentials to `.env`

```bash
# In your .env file:
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your-resend-api-key
SMTP_FROM=noreply@ghostshift.com
```

### **3. Gmail (QUICK TESTING)**
- **Free Tier**: Yes, 500 emails/day
- **Features**:
  - Real emails sent
  - Limited to 500/day
  - Requires App Password
- **Setup**:
  1. Go to Google Account settings
  2. Enable 2-Step Verification
  3. Generate App Password: https://support.google.com/accounts/answer/185833
  4. Use App Password in `.env`

```bash
# In your .env file:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ghostshift.com
```

---

## 🚀 Quick Setup Commands

### **Get Groq API Key (Recommended)**
```bash
# 1. Visit: https://console.groq.com/
# 2. Sign up and get API key
# 3. Copy the key and paste in .env:
# GROQ_API_KEY=your-key-here
```

### **Get Mailtrap SMTP (Recommended for Testing)**
```bash
# 1. Visit: https://mailtrap.io
# 2. Sign up (free)
# 3. Create inbox
# 4. Copy credentials to .env:
# SMTP_USER=your-username
# SMTP_PASSWORD=your-password
```

### **Set Up PostgreSQL Database**
```bash
# Install PostgreSQL (if not installed)
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres createdb ghostshift

# Create user and password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your-password';"
```

### **Set Up Redis (Required for caching)**
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test Redis
redis-cli ping
# Should return: PONG
```

---

## 📝 Complete .env Setup (Example)

```env
# AI/ML - Groq (Free)
GROQ_API_KEY=gsk_1234567890abcdef
GROQ_MODEL=llama3-70b-8192

# Email - Mailtrap (Free testing)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=123456
SMTP_PASSWORD=abcdef123456
SMTP_FROM=noreply@ghostshift.com

# Database
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/ghostshift

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secure-jwt-secret-here
```

---

## 🎯 Recommended Free Stack

| Service | Provider | Free Tier | Use Case |
|---------|----------|-----------|----------|
| **AI** | Groq | 10K tokens/min | Production AI features |
| **Email** | Mailtrap | 1K emails/month | Development/testing |
| **Database** | PostgreSQL | Free | Production |
| **Redis** | Redis | Free | Production |

---

## 🚀 Next Steps

1. **Get Groq API Key**: https://console.groq.com/
2. **Get Mailtrap SMTP**: https://mailtrap.io
3. **Update `.env`** with your credentials
4. **Run migrations**: `alembic upgrade head`
5. **Start server**: `uvicorn main:app --reload`

That's it! You now have a fully functional backend with free services.
