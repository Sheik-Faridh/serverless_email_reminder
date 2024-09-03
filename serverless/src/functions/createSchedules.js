const AWS = require('aws-sdk');
const scheduler = new AWS.Scheduler();

const EMAIL_SENDER_ARN = process.env.EMAIL_SENDER_ARN;

async function createSchedule({
  scheduleName,
  scheduleTime,
  to,
  from,
  subject,
  scheduleGroupName,
  scheduleTimezone,
  content,
  callbackUrl = null,
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
      Input: JSON.stringify({
        to,
        subject,
        content,
        from,
        callbackUrl,
        scheduleName,
      }),
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

module.exports.handler = async (event) => {
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
