import { useEffect } from "react";

/**
 * Custom hook to dynamically update page meta tags for SEO
 * @param {Object} seo - SEO configuration object
 * @param {string} seo.title - Page title
 * @param {string} seo.description - Page description
 * @param {string} seo.keywords - Page keywords (comma-separated)
 * @param {string} seo.canonical - Canonical URL
 * @param {string} seo.ogImage - Open Graph image URL
 */
export const useSEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = "https://www.corippl.com/og-image.jpg",
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      if (!content) return;

      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Update description
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Update Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:url", canonical, true);

    // Update Twitter tags
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", ogImage);
    updateMetaTag("twitter:url", canonical);

    // Update canonical link
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]');
      if (!linkElement) {
        linkElement = document.createElement("link");
        linkElement.setAttribute("rel", "canonical");
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute("href", canonical);
    }

    // Cleanup function to reset to default
    return () => {
      document.title =
        "Audience Growth for Creators Through Content Cross-Promotion | Corippl";
    };
  }, [title, description, keywords, canonical, ogImage]);
};
