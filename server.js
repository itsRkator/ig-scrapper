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

const sessionFilePath = path.join(__dirname, 'instagram_session.json');

const loadSession = async () => {
  if (fs.existsSync(sessionFilePath)) {
    const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    ig.state.deserialize(sessionData);
    console.log('Logged in using previous session');
  }
};

const saveSession = async () => {
  const sessionData = await ig.state.serialize();

  fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
  console.log('Session has been saved for reusability');
};

// Route to authenticate and download media
app.get('/download', async (req, res) => {
  const { targetUsername } = req.query;

  if (!targetUsername) {
    return res.status(400).send('targetUsername are required');
  }

  try {
    // TO be Removed
    const { INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = process.env;
    ig.state.generateDevice(INSTAGRAM_USERNAME);
    await ig.account.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD);
    console.log('Logged in as:', INSTAGRAM_USERNAME);

    /* To be Added For now the saveSession is now working properly
      // Load the existing session if previously logged in
      await loadSession();
      // If session is not available Log in to Instagram
      if (!ig.state.cookieCsrfToken) {
        const { INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = process.env;

        ig.state.generateDevice(INSTAGRAM_USERNAME);
        await ig.account.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD);
        console.log('Logged in as:', INSTAGRAM_USERNAME);
        await saveSession();
      }
    */

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
    const downloadMedia = async (postType, mediaArray) => {
      for (const mediaItem of mediaArray) {
        const imageMediaItemUrl =
          mediaItem?.image_versions2?.candidates?.length > 0
            ? mediaItem.image_versions2.candidates[0].url
            : null;
        const videoMediaItemUrl =
          mediaItem?.video_versions?.length > 0
            ? mediaItem.video_versions[0].url
            : null;

        const fetchMedia = async (mediaType, mediaMimeType, mediaUrl) => {
          const fileName = `${mediaType}-${mediaItem.pk}.${mediaMimeType}`;
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
        };

        if (imageMediaItemUrl) {
          fetchMedia(postType, 'jpg', imageMediaItemUrl);
        }
        if (videoMediaItemUrl) {
          fetchMedia(postType, 'mp4', videoMediaItemUrl);
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
