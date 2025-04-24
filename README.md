# 🌐 Cybersecurity Hub - Dynamic News Proxy

This project includes a Node.js proxy server deployed on Vercel that fetches cybersecurity-related news from [NewsAPI.org](https://newsapi.org). The goal is to **dynamically display up-to-date cybersecurity news** on the website — without running into browser restrictions like CORS.

## 📌 Problem: Why We Needed a Proxy

Modern web browsers include security features to protect users — one of which is called **CORS (Cross-Origin Resource Sharing)**.

When you try to fetch data directly from `https://newsapi.org` using JavaScript in the browser (i.e., `fetch()`), it fails with a **CORS error** because:

- NewsAPI **does not allow client-side browsers** to fetch data directly.
- This restriction protects the API from misuse and protects users from malicious sites stealing data.
------------
🧠 why blocking Summary

|Why They Block It|	Who It Protects|
|-----------------|----------------|
|Stops API key theft| You (site owner)|
|Prevents bots from spamming NewsAPI	| NewsAPI|
|Blocks malicious sites from tricking users into calling NewsAPI | 	Users|
|Keeps API usage limited to approved applications	| Everyone|



So by using a proxy server on Vercel, you control who calls the API (your server), and users just receive safe, already-processed news articles.

Would you like a short animation, visual, or infographic to help explain this on your website too?

## ✅ Solution: Node.js Proxy on Vercel

To solve this, we wrote a lightweight **Node.js server** and deployed it to [Vercel](https://vercel.com), acting as a **trusted middleman** between our frontend and the NewsAPI.

### How It Works

1. Your website (HTML + JavaScript) runs in a **browser** (like Chrome or Safari).
2. The JavaScript in your site makes a request to: https://news-api-proxy-six.vercel.app/news
3. This URL is not NewsAPI — it's your **own server** running on Vercel.
4. The Vercel server safely makes a **server-side request** to NewsAPI using a hidden API key.
5. It then sends the data **back to the browser** without triggering CORS errors.
6. The browser displays the cybersecurity news dynamically using JavaScript.

### 🔐 Why This Works

- Browsers block cross-origin requests **from the browser** (client-side).
- But servers (like Vercel) **aren’t restricted by CORS** and can fetch from anywhere.
- By placing your key on the server side, you also **hide the API key** from users — making your setup more secure.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend Proxy**: Node.js (Express or Serverless Handler)
- **Hosting**:
- Frontend on **GitHub Pages**
- Proxy on **Vercel**

## 🧪 Example

```js
// Frontend JavaScript (runs in browser)
fetch("https://news-api-proxy-six.vercel.app/news")
.then(res => res.json())
.then(data => {
 // Update the news section on your site
});


