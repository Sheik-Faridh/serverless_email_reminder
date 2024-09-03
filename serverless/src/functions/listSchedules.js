const AWS = require('aws-sdk');
const scheduler = new AWS.Scheduler();

module.exports.handler = async (event) => {
  try {
    const queryParams = event?.queryStringParameters;
    if (!queryParams)
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid ScheduleGroupName',
        }),
      };
    console.log('Query Parameters: ', JSON.stringify(queryParams));

    const { scheduleGroupName } = queryParams;

    console.log('scheduleGroupName: ', scheduleGroupName);

    const params = {
      GroupName: scheduleGroupName,
      MaxResults: 100, // Adjust this based on your needs
    };

    let allSchedules = [];
    let nextToken = null;

    do {
      if (nextToken) {
        params.NextToken = nextToken;
      }

      const response = await scheduler.listSchedules(params).promise();
      allSchedules = allSchedules.concat(response.Schedules);
      nextToken = response.NextToken;
    } while (nextToken);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Schedules retrieved successfully',
        schedules: allSchedules,
      }),
    };
  } catch (error) {
    console.error('Error listing schedules:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to list schedules',
        error: error.message,
      }),
    };
  }
};
