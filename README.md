# ✍️ Inkwell — Blog Platform

A full-stack blogging platform where users can write, share, and discover stories. Built with a clean magazine-style UI inspired by Medium and BBC.

## 🖼️ Preview
> Magazine-style home feed · Full post reading experience · Comment section · User profiles

## ✨ Features
- 📝 Create, edit, and delete blog posts
- 💬 Comment section for every post
- 👤 User registration, login & profile page
- 🗂️ Category filtering (Technology, Life, Travel, Food, etc.)
- 🔍 Real-time search across all posts
- 📰 Magazine layout — featured post + grid feed
- 🔐 JWT-based authentication
- 📱 Fully responsive (mobile + desktop)

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT + bcryptjs |
| Fonts | Playfair Display + DM Sans |

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/amanraj00454555-design/inkwell-blog.git
cd inkwell-blog
```

### 2. Setup the database
Open MySQL and run:
```sql
CREATE DATABASE blog_db;
USE blog_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  cover_emoji VARCHAR(10) DEFAULT '📝',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Configure environment
Create a `.env` file inside the `backend` folder:
