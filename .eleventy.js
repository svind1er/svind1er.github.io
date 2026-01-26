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

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
