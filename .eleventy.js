module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/.well-known");
  eleventyConfig.addPassthroughCopy({"src/brand-facts.json": "brand-facts.json"});
  eleventyConfig.addPassthroughCopy({"src/llms.txt": "llms.txt"});

  // Collections
  eleventyConfig.addCollection("blog", function(collection) {
    return collection.getFilteredByTag("blog").sort((a, b) => {
      return new Date(b.data.date) - new Date(a.data.date);
    });
  });

  // Nunjucks filters
  eleventyConfig.addFilter("date", function(value, format) {
    const d = (value === "now") ? new Date() : new Date(value);
    if (format === "%Y") return d.getFullYear().toString();
    if (format === "iso") return d.toISOString();
    return d.toLocaleDateString();
  });

  eleventyConfig.addFilter("slice", function(arr, start, end) {
    if (!arr) return [];
    return arr.slice(start, end);
  });

  // Set input/output directories
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};