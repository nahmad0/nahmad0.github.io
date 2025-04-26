## 🌐 Cybersecurity Hub - Dynamic News Proxy Webpage

This project includes a Node.js proxy server deployed on Vercel that fetches cybersecurity-related news from [NewsAPI.org](https://newsapi.org). The goal is to **dynamically display up-to-date cybersecurity news** on the website — without running into browser restrictions like CORS.

### 📌 Problem: Why We Needed a Proxy

Modern web browsers include security features to protect users — one of which is called **CORS (Cross-Origin Resource Sharing)**.

When I try to fetch data directly from `https://newsapi.org` using JavaScript in the browser (i.e., `fetch()`), it fails with a **CORS error** because:

- NewsAPI **does not allow client-side browsers** to fetch data directly.
- This restriction protects the API from misuse and protects users from malicious sites stealing data.
------------
🧠 why blocking Summary

|Why They Block It|	Who It Protects|
|-----------------|----------------|
|Stops API key theft| I (site owner)|
|Prevents bots from spamming NewsAPI	| NewsAPI|
|Blocks malicious sites from tricking users into calling NewsAPI | 	Users|
|Keeps API usage limited to approved applications	| Everyone|



So by using a proxy server on Vercel, I control who calls the API (my  server), and users just receive safe, already-processed news articles.

Would I like a short animation, visual, or infographic to help explain this on my  website too?

### ✅ Solution: Node.js Proxy on Vercel

To solve this, we wrote a lightweight **Node.js server** and deployed it to [Vercel](https://vercel.com), acting as a **trusted middleman** between our frontend and the NewsAPI.

#### How It Works

1. my  website (HTML + JavaScript) runs in a **browser** (like Chrome or Safari).
2. The JavaScript in my  site makes a request to: https://news-api-proxy-six.vercel.app/news
3. This URL is not NewsAPI — it's my  **own server** running on Vercel.
4. The Vercel server safely makes a **server-side request** to NewsAPI using a hidden API key.
5. It then sends the data **back to the browser** without triggering CORS errors.
6. The browser displays the cybersecurity news dynamically using JavaScript.

#### 🔐 Why This Works

- Browsers block cross-origin requests **from the browser** (client-side).
- But servers (like Vercel) **aren’t restricted by CORS** and can fetch from anywhere.
- By placing my  key on the server side, I also **hide the API key** from users — making my  setup more secure.

### 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend Proxy**: Node.js (Express or Serverless Handler)
- **Hosting**:
- Frontend on **GitHub Pages**
- Proxy on **Vercel**

### 🧪 Example

```js
// Frontend JavaScript (runs in browser)
fetch("https://news-api-proxy-six.vercel.app/news")
.then(res => res.json())
.then(data => {
 // Update the news section on my  site
});
```
### How the Sign-Up System Works
#### 🌐 Goal:

The sign-up system allows users to subscribe by providing their Name, Email, Role, and a Message.
Their information is saved in MongoDB Atlas through a secure backend server hosted on Vercel.

🛠 Frontend: How the Sign-Up Button Connects to the Server
When the user fills out the form and clicks the Subscribe button:

JavaScript fetch() is triggered.


It sends a POST request to the server API at:
```js
https://your-vercel-project.vercel.app/api/subscribe
```
The form data (Name, Email, Role, Message) is converted into JSON and sent securely.

The server receives the data, connects to MongoDB Atlas, and saves the user's information in a collection called emails.

#### 💻 Code that Does This:
Frontend Code (script.js):


```js

fetch("https://your-vercel-project.vercel.app/api/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, role, message })
});
```
✅ This fetch() is the heart of the connection — it "talks" to your Vercel server.

🛠 Backend Code (subscribe.js):
javascript
Copy
Edit
const { name, email, role, message } = req.body;
const newEmail = new Email({ name, email, role, message });
await newEmail.save();
✅ This backend code receives the POST request, creates a new record in MongoDB, and saves it securely.

#### 🔒 Why This is Secure:
Passwords are never exposed (only public info is collected)

All connections are over HTTPS

Backend is hidden — only server can talk to the database






