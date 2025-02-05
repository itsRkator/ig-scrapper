const filterUserFeed = (
  userMedia,
  start_date_timestamp,
  end_date_timestamp
) => {
  return userMedia.filter((media) => {
    const isAfterStartDate = start_date_timestamp
      ? media.taken_at >= start_date_timestamp
      : true;

    const isBeforeEndDate = end_date_timestamp
      ? media.taken_at <= end_date_timestamp
      : true;

    return isAfterStartDate && isBeforeEndDate;
  });
};

module.exports = { filterUserFeed };
