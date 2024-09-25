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
  content,
  scheduleTimezone = 'America/New_York',
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

exports.handler = async (event) => {
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
    const results = await Promise.allSettled(schedules.map(createSchedule));
    const { created, failed } = results.reduce(
      (acc, result, index) => {
        const scheduleName = schedules[index].scheduleName;
        if (result.status === 'fulfilled') acc.created.push(scheduleName);
        else {
          acc.failed.push(scheduleName);
          console.log(`failed to create the schedule for ${scheduleName}`);
          console.log(result.reason);
        }
        return acc;
      },
      { created: [], failed: [] }
    );
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: created.length
          ? 'Schedules created successfully'
          : 'No schedules created',
        schedules: {
          created,
          failed,
        },
      }),
    };
  } catch (error) {
    console.error('Error creating schedules:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
