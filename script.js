document.addEventListener("DOMContentLoaded", () => {
    // Handle hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('header nav');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Load news if on news.html
    const newsSection = document.querySelector(".basic-content");
    if (newsSection && document.title.includes("News")) {
        fetch("https://news-api-proxy-six.vercel.app/news")
            .then(res => res.json())
            .then(data => {
                console.log(data);  
                const articles = data.articles;
                let html = '<h1>Latest Cybersecurity News</h1>';

                articles.forEach(article => {
                    html += `
                        <section class="basic-section">
                            <h2>📰 ${article.title}</h2>
                            <p><strong>Source:</strong> ${article.source.name}</p>
                            <p><strong>Published:</strong> ${new Date(article.publishedAt).toLocaleDateString()}</p>
                            <p><strong>Author:</strong> ${article.author || 'Unknown'}</p>
                            ${article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}" style="width:100%; height:auto; max-width:600px; margin: 10px 0;">` : ''}
                            <p>${article.description || 'No description available.'}</p>
                            <p>${article.content || 'No content available.'}</p>
                            <a href="${article.url}" target="_blank">Read more</a>
                        </section>
                    `;
                });

                newsSection.innerHTML = html;
            })
            .catch(err => {
                console.error("Error fetching news:", err);
                newsSection.innerHTML = "<p>Failed to load news. Please try again later.</p>";
            });
    }
});
