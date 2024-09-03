const AWS = require('aws-sdk');
const scheduler = new AWS.Scheduler();

module.exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters;
    if (!queryParams)
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid ScheduleGroupName',
        }),
      };
    console.log('Query Parameters: ', JSON.stringify(queryParams));

    const { scheduleGroupName, scheduleName } = queryParams;

    const deleteParams = {
      Name: scheduleName,
      GroupName: scheduleGroupName,
    };

    await scheduler.deleteSchedule(deleteParams).promise();
    return {
      statusCode: 204,
      body: JSON.stringify({
        message: 'Schedule deleted successfully',
        scheduleName,
      }),
    };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to delete the schedule',
        error: error.message,
      }),
    };
  }
};
