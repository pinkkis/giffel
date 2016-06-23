"use strict";

/*
    1. Get list of images to display
    2. Feed image list to image loader
    3. Loader loads images, and emits them
    4. Cycler receives new images, and adds them to its queue
    5. Cycler repeatedly displays images from its queue
*/

class Giffel {
    constructor(imagesUrl, interval, duration) {
        if (!imagesUrl || typeof imagesUrl !== "string") { throw new Error(`No image url provided.`); }

        this.INTERVAL_SECONDS = interval || 8;
        this.ANIMATION_DURATION = duration || 3;
        this.queue = [];
        this.interval = null;

        fetch(imagesUrl)
            .then(response => response.json()
                                      .then(body => this.extractGifUrls(body.data.children)))
            .then(urls => this.loadImages(urls, this.cycleImages()))
            .catch(err => document.body.innerHTML = "Couldn't get list of images to show, sorry! " + err.message);
    }

    extractGifUrls(res) {
        return res
            .map(c => c.data.url)
            .filter(url => url.match(/gifv?$/))
            .map(url => url.replace(/gifv?$/, "gif"));
    }

    showImage(url) {
        let oldImage = document.querySelector(".current-image");
        let newImage = document.createElement("div");

        // Wait for new image to animate in, then remove old
        if (oldImage) {
            setTimeout(() => oldImage.parentNode.removeChild(oldImage), this.ANIMATION_DURATION * 1000);
        }
        newImage.innerHTML = `<div class="current-image fullscreen fade-in" style="background-image: url(${url})"></div>`;
        document.body.appendChild(newImage.firstChild);
    }

    // Starts cycling images and returns a function used to add new images into queue
    cycleImages() {
        let currentIndex = -1;
        let nextImage = () => {
            currentIndex = (currentIndex + 1) % (this.queue.length || 1);
            this.showImage(this.queue[currentIndex].src);
        };

        return img => {
            this.queue.push(img);

            if (!this.interval) {
                nextImage();
                this.interval = setInterval(nextImage, this.INTERVAL_SECONDS * 1000);
            }
        };
    }

    loadImages(urls, callback) {
        if (!urls.length) {
            console.log(`All ${this.queue.length} images loaded!`);
            return;
        }

        let loadImage = (url, callback) => {
            let img = document.createElement("img");
            img.onload = () => callback(img);
            img.onerror = e => console.error(`Error loading image: ${e.message}`);
            img.src = url;
        };

        loadImage(urls.shift(), img => {
            callback(img);
            this.loadImages(urls, callback);
        });
    }
}

let giffel = new Giffel("https://www.reddit.com/r/perfectloops/.json");
