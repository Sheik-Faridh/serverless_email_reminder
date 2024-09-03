const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports.handler = async (event) => {
  try {
    console.log('send mail function invoked with event:', event.body);
    const { to, subject, content, from } = JSON.parse(event.body);

    const params = {
      Source: from,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: content,
          },
        },
      },
    };

    const result = await ses.sendEmail(params).promise();
    console.log('Email sent successfully', result.MessageId);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email sent successfully',
        messageId: result.MessageId,
      }),
    };
  } catch (error) {
    console.log('Error on sending the email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
