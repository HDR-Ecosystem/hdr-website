/**
 * Load Header and Footer Components
 * This script dynamically loads the header and footer from central HTML files.
 * It automatically adjusts relative paths based on the current page's location.
 */

(function() {
    'use strict';

    /**
     * Determine the path prefix based on the current page's location
     * @returns {string} Path prefix to reach the root directory
     */
    function getPathPrefix() {
        const path = window.location.pathname;
        
        // Root level (index.html at root or just /)
        if (path.endsWith('/') || (path.endsWith('/index.html') && !path.includes('/html/'))) {
            return '';
        }
        
        // Count directory depth from html/
        const htmlIndex = path.indexOf('/html/');
        if (htmlIndex !== -1) {
            const afterHtml = path.substring(htmlIndex + 6); // Skip '/html/'
            const depth = (afterHtml.match(/\//g) || []).length;
            // Files directly in /html/ need one level up (..)
            // Files in /html/subdir/ need two levels up (../..)
            return '../'.repeat(depth + 1);
        }
        
        return '../';
    }

    /**
     * Adjust relative paths in HTML content based on current page location
     * @param {string} html - HTML content to adjust
     * @param {string} prefix - Path prefix to prepend
     * @returns {string} Adjusted HTML content
     */
    function adjustPaths(html, prefix) {
        if (!prefix) return html;

        // Match patterns like src="images/...", href="html/...", etc.
        html = html.replace(/src="(images|css|js|html)\//g, `src="${prefix}$1/`);
        html = html.replace(/href="(images|css|js|html)\//g, `href="${prefix}$1/`);
        
        // Also handle index.html references
        html = html.replace(/href="index\.html"/g, `href="${prefix}index.html"`);
        html = html.replace(/href="\.\.\/index\.html"/g, `href="${prefix}index.html"`);
        
        return html;
    }

    /**
     * Load a component from an HTML file
     * @param {string} url - URL of the component file
     * @param {string} targetId - ID of the target element to insert the component
     */
    function loadComponent(url, targetId) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const prefix = getPathPrefix();
                const adjustedHtml = adjustPaths(html, prefix);
                
                const target = document.getElementById(targetId);
                if (target) {
                    target.innerHTML = adjustedHtml;
                    if (targetId === 'header-placeholder') {
                        if (typeof window.initHamburger === 'function') {
                            window.initHamburger();
                        }
                        if (typeof window.initSearchUI === 'function') {
                            window.initSearchUI();
                        }
                    }
                } else {
                    console.error(`Target element #${targetId} not found`);
                }
            })
            .catch(error => {
                console.error(`Error loading component from ${url}:`, error);
            });
    }

    function initComponents() {
        const prefix = getPathPrefix();
        const componentsPath = `${prefix}html/components/`;
        
        // Load header and footer
        loadComponent(`${componentsPath}header.html`, 'header-placeholder');
        loadComponent(`${componentsPath}footer.html`, 'footer-placeholder');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }
})();
