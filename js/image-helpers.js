/**
 * Image Helpers
 * Utility functions for image handling and placeholder management
 */

var ImageHelpers = {
    // Empty image SVG placeholder
    EMPTY_IMAGE_SVG: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E',

    /**
     * Apply placeholder to an image element
     * @param {HTMLImageElement} imgElement - The image element to apply placeholder to
     */
    applyPlaceholder: function(imgElement) {
        if (!imgElement) return;
        imgElement.src = ImageHelpers.EMPTY_IMAGE_SVG;
        imgElement.alt = 'No Image Available';
        imgElement.classList.add('empty-image-placeholder');
    }
};

// Ensure ImageHelpers is available globally
window.ImageHelpers = ImageHelpers;
