document.addEventListener('DOMContentLoaded', function () {
    const zoomContainers = document.querySelectorAll('.image-zoom-container');

    if (zoomContainers.length === 0) {
        console.error("No elements found with the class 'image-zoom-container'");
        return;
    }

    zoomContainers.forEach(container => {
        // Check if the event listeners are being added
        console.log("Event listeners added to:", container);

        container.addEventListener('mousemove', (event) => {
            container.style.setProperty('--url', `url(${container.querySelector('img').src})`);
            container.style.setProperty('--zoom-x', (event.offsetX * 100) / container.offsetWidth + '%');
            container.style.setProperty('--zoom-y', (event.offsetY * 100) / container.offsetHeight + '%');
            container.style.setProperty('opacity', '1'); // Show the zoom
        });
        
        container.addEventListener('mouseout', () => {
            container.style.setProperty('opacity', '100'); // Hide the zoom
        });
        
    });
});
