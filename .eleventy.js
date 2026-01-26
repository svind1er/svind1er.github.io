const fs = require("fs");
const path = require("path");

module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("date", (value, format) => {
    if (!value) {
      return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    if (format === "%b %d, %Y") {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      }).format(date);
    }

    return date.toISOString();
  });

  eleventyConfig.addFilter("cacheBust", (url, filePath) => {
    if (!filePath) {
      return url;
    }

    const resolvedPath = path.join(__dirname, filePath);
    if (!fs.existsSync(resolvedPath)) {
      return url;
    }

    const version = fs.statSync(resolvedPath).mtimeMs.toString();
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}v=${version}`;
  });

  eleventyConfig.addCollection("writeups", (collectionApi) => {
    return collectionApi.getFilteredByGlob("./src/writeups/*.md").sort((a, b) => {
      return (b.date || 0) - (a.date || 0);
    });
  });

  eleventyConfig.addCollection("categories", (collectionApi) => {
    const categories = new Set();
    collectionApi.getFilteredByGlob("./src/writeups/*.md").forEach((item) => {
      if (item.data && item.data.category) {
        categories.add(item.data.category);
      }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  });

  eleventyConfig.addCollection("tagsList", (collectionApi) => {
    const tags = new Set();
    collectionApi.getFilteredByGlob("./src/writeups/*.md").forEach((item) => {
      const itemTags = item.data && item.data.tags ? item.data.tags : [];
      itemTags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
