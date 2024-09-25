const AWS = require('aws-sdk');
const scheduler = new AWS.Scheduler();

const EMAIL_SENDER_ARN = process.env.EMAIL_SENDER_ARN;

exports.handler = async (event) => {
  try {
    const {
      scheduleName,
      scheduleTime,
      scheduleGroupName,
      to,
      from,
      subject,
      content,
      scheduleTimezone = 'America/New_York',
      callbackUrl = null,
    } = JSON.parse(event.body);
    console.log('Update Schedule', scheduleName);
    const updateParams = {
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
