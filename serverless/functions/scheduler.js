const AWS = require('aws-sdk');
const scheduler = new AWS.Scheduler();

const EMAIL_SENDER_ARN = process.env.EMAIL_SENDER_ARN;

module.exports.createSchedules = async (event) => {
  try {
    const { schedules } = JSON.parse(event.body);
    if (!schedules?.length)
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'No Schedules found',
        }),
      };
    console.log('Create Schedules');
    const results = await Promise.all(schedules.map(createSchedule));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Schedules created successfully',
        results,
      }),
    };
  } catch (error) {
    console.error('Error creating schedules:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

async function createSchedule({
  scheduleName,
  scheduleTime,
  to,
  from,
  subject,
  scheduleGroupName,
  scheduleTimezone,
  content,
}) {
  const scheduleParams = {
    Name: scheduleName,
    ScheduleExpression: `at(${scheduleTime})`,
    ScheduleExpressionTimezone: scheduleTimezone,
    GroupName: scheduleGroupName,
    State: 'ENABLED',
    ActionAfterCompletion: 'DELETE',
    Target: {
      Arn: EMAIL_SENDER_ARN,
      RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
      Input: JSON.stringify({ to, subject, content, from }),
      RetryPolicy: {
        MaximumRetryAttempts: 0,
      },
    },
    FlexibleTimeWindow: {
      Mode: 'OFF',
    },
  };
  console.log('Create Schedule', scheduleName);
  const result = await scheduler.createSchedule(scheduleParams).promise();
  return result;
}

module.exports.updateSchedule = async (event) => {
  try {
    const {
      scheduleName,
      scheduleTime,
      scheduleTimezone,
      to,
      from,
      subject,
      content,
    } = JSON.parse(event.body);
    console.log('Update Schedule', scheduleName);
    const updateParams = {
      Name: scheduleName,
      ScheduleExpression: `at(${scheduleTime})`,
      ScheduleExpressionTimezone: scheduleTimezone,
      State: 'ENABLED',
      ActionAfterCompletion: 'DELETE',
      Target: {
        Arn: EMAIL_SENDER_ARN,
        RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
        Input: JSON.stringify({ to, subject, content, from }),
        RetryPolicy: {
          MaximumRetryAttempts: 0,
        },
      },
      FlexibleTimeWindow: {
        Mode: 'OFF',
      },
    };

    const result = await scheduler.updateSchedule(updateParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Schedule updated successfully',
        result,
      }),
    };
  } catch (error) {
    console.error('Error updating schedule:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

module.exports.listSchedules = async (event) => {
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

module.exports.deleteSchedule = async (event) => {
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
