const dotenv = require('dotenv');
const express = require('express');
const { IgApiClient } = require('instagram-private-api');

const {
  loadSession,
  checkSessionValid,
  saveSession,
} = require('./utils/ig-session');
const { getUserFeedMediaUrl } = require('./utils/fetch-user-feed-media');
const { filterUserFeed } = require('./utils/filter-feed');

dotenv.config();

// Initialize Express
const app = express();
const port = 3000;

// Create an instance of IgApiClient
const ig = new IgApiClient();

// Set up basic route to serve the app
app.use(express.json());

// Route to authenticate and download media
app.get('/download', async (req, res) => {
  const { targetUsername, start_date, end_date } = req.query;

  const start_date_timestamp = start_date ? new Date(start_date) : null;
  const end_date_timestamp = end_date ? new Date(end_date) : null;

  if (!targetUsername) {
    return res.status(400).send('targetUsername is required');
  }

  try {
    // Load the existing session if previously logged in
    await loadSession(ig);

    // Check if the session is valid
    const isSessionValid = await checkSessionValid(ig);
    if (!isSessionValid) {
      console.log('Session expired or invalid. Logging in again...');

      // If session is invalid, login to Instagram again
      const { INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = process.env;

      if (!INSTAGRAM_USERNAME || !INSTAGRAM_PASSWORD) {
        return res
          .status(500)
          .send(
            'Instagram credentials are missing in the environment variables.'
          );
      }

      ig.state.generateDevice(INSTAGRAM_USERNAME);
      await ig.account.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD);
      console.log('Logged in successfully after session expiration');

      // Save the session again after re-login
      await saveSession(ig);
    }

    // Fetch user profile
    const { users } = await ig.user.search(targetUsername);
    if (!users || users.length === 0) {
      return res.status(404).send('User not found');
    }

    const userId = users[0].pk;

    // Get user posts (Feed)
    const posts = await ig.feed.user(userId).items();

    // Get user stories
    const stories = await ig.feed.userStory(userId).items();

    const media = {
      posts: filterUserFeed(posts, start_date_timestamp, end_date_timestamp),
      stories: filterUserFeed(
        stories,
        start_date_timestamp,
        end_date_timestamp
      ),
    };

    const storyMedia = getUserFeedMediaUrl(media.stories);
    const postMedia = getUserFeedMediaUrl(media.posts);

    // Respond with success
    res.status(200).json({
      message: 'Media downloaded successfully',
      storyMedia,
      postMedia,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send(`Failed to download media: ${error.message}`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
