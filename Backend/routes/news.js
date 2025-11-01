const express = require("express");
const axios = require("axios");
const Article = require("../models/Article");
const Interaction = require("../models/Interaction");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/news - Fetch news from NewsAPI and store in DB
router.get("/", async (req, res) => {
  try {
    const { category = "general", pageSize = 20, page = 1, since } = req.query;
    const newsApiKey = process.env.NEWS_API_KEY;

    if (!newsApiKey) {
      return res.status(400).json({ message: "NewsAPI key not configured" });
    }

    const pageNum = parseInt(page) || 1;
    const limit = parseInt(pageSize) || 20;
    const skip = (pageNum - 1) * limit;

    console.log(
      `Fetching news for category: ${category}, page: ${pageNum}, pageSize: ${limit}`
    );

    let dbArticles;
    let hasMore = false;
    const query = category === "all" ? {} : { category: { $in: [category] } };

    if (since) {
      // Refresh: Fetch fresh data from NewsAPI and store new articles
      console.log("Refreshing news from NewsAPI");

      const response = await axios.get("https://newsapi.org/v2/top-headlines", {
        params: {
          category: category === "all" ? undefined : category,
          country: "us",
          pageSize: 100, // Fetch more to get latest
          apiKey: newsApiKey,
        },
      });

      const { articles } = response.data;
      console.log(`NewsAPI refresh response: ${articles.length} articles`);

      // Store new articles in DB
      const savedArticles = [];
      for (const articleData of articles) {
        try {
          const article = new Article({
            title: articleData.title,
            description: articleData.description,
            content: articleData.content,
            url: articleData.url,
            urlToImage: articleData.urlToImage,
            publishedAt: new Date(articleData.publishedAt),
            source: articleData.source,
            author: articleData.author,
            category: category === "all" ? ["general"] : [category], // Default to general for all
          });
          await article.save();
          savedArticles.push(article);
        } catch (error) {
          // Skip if article already exists (duplicate URL)
          if (error.code !== 11000) {
            console.error("Error saving article:", error);
          }
        }
      }

      console.log(`Saved ${savedArticles.length} new articles during refresh`);

      // Return the latest articles from DB, properly sorted
      dbArticles = await Article.find(query)
        .sort({ publishedAt: -1 })
        .limit(limit);

      hasMore = false; // Refresh doesn't need pagination

      console.log(
        `Refresh returning ${dbArticles.length} articles, first published: ${dbArticles[0]?.publishedAt}`
      );
    } else {
      // Regular pagination
      dbArticles = await Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit + 1); // +1 to check if there are more

      hasMore = dbArticles.length > limit;
      if (hasMore) {
        dbArticles = dbArticles.slice(0, limit);
      }

      // If no articles in DB or first page, fetch from NewsAPI
      if (dbArticles.length === 0 && pageNum === 1) {
        console.log("No articles in DB, fetching from NewsAPI");

        const response = await axios.get(
          "https://newsapi.org/v2/top-headlines",
          {
            params: {
              category: category === "all" ? undefined : category,
              country: "us",
              pageSize: 100, // Fetch more to store
              apiKey: newsApiKey,
            },
          }
        );

        const { articles } = response.data;

        console.log(`NewsAPI response status: ${response.status}`);
        console.log(`Number of articles received: ${articles.length}`);
        console.log(
          `First article title: ${articles[0]?.title || "No articles"}`
        );
        console.log(`API Key present: ${!!newsApiKey}`);

        // Store articles in DB if they don't exist
        const savedArticles = [];
        for (const articleData of articles) {
          try {
            const article = new Article({
              title: articleData.title,
              description: articleData.description,
              content: articleData.content,
              url: articleData.url,
              urlToImage: articleData.urlToImage,
              publishedAt: new Date(articleData.publishedAt),
              source: articleData.source,
              author: articleData.author,
              category: category === "all" ? ["general"] : [category],
            });
            await article.save();
            savedArticles.push(article);
          } catch (error) {
            // Skip if article already exists (duplicate URL)
            if (error.code !== 11000) {
              console.error("Error saving article:", error);
            }
          }
        }

        console.log(
          `Successfully fetched and stored ${savedArticles.length} articles`
        );

        // Return articles from DB after storing
        dbArticles = await Article.find(query)
          .sort({ publishedAt: -1 })
          .limit(limit + 1);

        hasMore = dbArticles.length > limit;
        if (hasMore) {
          dbArticles = dbArticles.slice(0, limit);
        }
      }
    }

    res.json({ articles: dbArticles, hasMore });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ message: "Failed to fetch news" });
  }
});

// POST /api/news/:articleId/view - Track article view (requires auth)
router.post("/:articleId/view", auth, async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user._id;

    // Check if article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Record interaction
    const interaction = new Interaction({
      user: userId,
      article: articleId,
      type: "view",
    });
    await interaction.save();

    res.json({ message: "View recorded" });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ message: "Failed to record view" });
  }
});

module.exports = router;
