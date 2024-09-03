const { handler: sendMail } = require('./sendMail');

module.exports.handler = async (event) => {
  try {
    console.log(
      'sendEmailReminder function invoked with event:',
      JSON.stringify(event)
    );
    const { to, subject, content, from, callbackUrl, scheduleName } = event;

    const res = await sendMail({
      body: JSON.stringify({ to, subject, content, from }),
    });

    if (!callbackUrl) return;

    const payload =
      res.statusCode === 200
        ? {
            success: true,
            message: 'Email sent successfully',
          }
        : { success: false, error: JSON.parse(res.body)?.error };
    payload.scheduleName = scheduleName;
    //Post the result to the callbackUrl for the scheduleName
    await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log('Error on sending the email reminder:', error);
  }
};
