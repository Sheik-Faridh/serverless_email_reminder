const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports.sendEmail = async (event) => {
  try {
    console.log(
      'EmailSender function invoked with event:',
      JSON.stringify(event)
    );
    const { to, subject, content, from } = event;

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
