// Import the required modules
const fs = require('fs');
const path = require('path');

const express = require('express');
const { IgApiClient } = require('instagram-private-api');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Express
const app = express();
const port = 3000;

// Create an instance of IgApiClient
const ig = new IgApiClient();

// Set up basic route to serve the app
app.use(express.json());

// Route to authenticate and download media
app.post('/download', async (req, res) => {
  const { targetUsername } = req.body;

  if (!targetUsername) {
    return res.status(400).send('targetUsername are required');
  }

  try {
    const { username, password } = process.env;

    // Log in to Instagram
    ig.state.generateDevice(username);
    await ig.account.login(username, password);
    console.log('Logged in as:', username);

    // Fetch user profile
    const { users } = await ig.user.search(targetUsername);
    const userId = users[0].pk;

    // Get user posts (Feed)
    const posts = await ig.feed.user(userId).items();

    // Get user stories
    const stories = await ig.feed.userStory(userId).items();

    // Get user reels
    // const reels = await ig.feed.userReels(userId).items();

    // Fetch and download the first 5 posts, stories, and reels as an example
    const media = {
      posts: posts.slice(0, 5),
      stories: stories.slice(0, 5),
      //   reels: reels.slice(0, 5),
    };

    // Process media and send back URLs or download them
    const downloadMedia = async (mediaType, mediaArray) => {
      for (const mediaItem of mediaArray) {
        const mediaUrl = mediaItem.image_versions2
          ? mediaItem.image_versions2.candidates[0].url
          : mediaItem.video_versions
          ? mediaItem.video_versions[0].url
          : null;

        if (mediaUrl) {
          const fileName = `${mediaType}-${mediaItem.pk}.${
            mediaItem.image_versions2 ? 'jpg' : 'mp4'
          }`;
          const filePath = path.join(__dirname, 'downloads', fileName);

          // Create the directory if it doesn't exist
          if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
            fs.mkdirSync(path.join(__dirname, 'downloads'));
          }

          // Download media
          const response = await axios.get(mediaUrl, {
            responseType: 'stream',
          });
          response.data.pipe(fs.createWriteStream(filePath));
        }
      }
    };

    // Download posts, stories, and reels
    await downloadMedia('post', media.posts);
    await downloadMedia('story', media.stories);
    // await downloadMedia('reel', media.reels);

    // Respond with success
    res.status(200).send('Media downloaded successfully');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to download media');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
