const fs = require('fs');
const path = require('path');

const sessionFilePath = path.join(__dirname, '..', 'instagram_session.json');

// Load the session from file
const loadSession = async (igApiClient) => {
  try {
    if (fs.existsSync(sessionFilePath)) {
      console.log('Previous session found.');

      const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
      await igApiClient.state.deserialize(sessionData);

      console.log('Previous session successfully loaded.');
    } else {
      console.log('Previous session not found.');
    }
  } catch (error) {
    console.error('Error loading session:', error);
    throw new Error('Failed to load session');
  }
};

// Save the session to file
const saveSession = async (igApiClient) => {
  try {
    const sessionData = await igApiClient.state.serialize();
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
    console.log('Session has been saved for reusability');
  } catch (error) {
    console.error('Error saving session:', error);
    throw new Error('Failed to save session');
  }
};

// Check if the session is valid by performing an action like fetching the current user's profile
const checkSessionValid = async (igApiClient) => {
  try {
    // Try to fetch the logged-in user's details
    await igApiClient.account.currentUser();
    return true; // Session is valid
  } catch (error) {
    console.log('Session is invalid or expired');
    return false; // Session is invalid
  }
};

module.exports = { loadSession, saveSession, checkSessionValid };
