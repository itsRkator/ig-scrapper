const axios = require('axios');

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

// Process media and send back URLs or download them
const downloadMedia = async (postType, mediaArray) => {
  for (const mediaItem of mediaArray) {
    try {
      const imageMediaItemUrl =
        mediaItem?.image_versions2?.candidates?.length > 0
          ? mediaItem.image_versions2.candidates[0].url
          : null;
      const videoMediaItemUrl =
        mediaItem?.video_versions?.length > 0
          ? mediaItem.video_versions[0].url
          : null;

      if (imageMediaItemUrl) {
        await fetchMedia(postType, 'jpg', imageMediaItemUrl);
      }
      if (videoMediaItemUrl) {
        await fetchMedia(postType, 'mp4', videoMediaItemUrl);
      }
    } catch (error) {
      console.error(`Error downloading media for ${postType}`, error);
    }
  }
};

// Process media and send back URLs or download them
const getUserFeedMediaUrl = (mediaArray) => {
  try {
    if (!Array.isArray(mediaArray)) {
      throw new Error('Provide media array');
    }

    const imageMediaUrls = [];
    const videoMediaUrls = [];

    for (const mediaItem of mediaArray) {
      const imageMediaItemUrl =
        mediaItem?.image_versions2?.candidates?.length > 0
          ? mediaItem.image_versions2.candidates[0].url
          : null;

      const videoMediaItemUrl =
        mediaItem?.video_versions?.length > 0
          ? mediaItem.video_versions[0].url
          : null;

      if (imageMediaItemUrl) {
        imageMediaUrls.push(imageMediaItemUrl);
      }
      if (videoMediaItemUrl) {
        videoMediaUrls.push(videoMediaItemUrl);
      }
    }

    return { imageMediaUrls, videoMediaUrls };
  } catch (error) {
    console.error(`Error fetching media URLs`, error);
  }
};

module.exports = { fetchMedia, downloadMedia, getUserFeedMediaUrl };
