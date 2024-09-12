const API_KEY = process.env.API_KEY;

const generatePolicy = (principalId, effect, resource, errorMsg = '') => {
  const authResponse = { principalId };

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    };
  }

  authResponse.context = {
    error: errorMsg,
  };

  return authResponse;
};

exports.handler = async (event) => {
  try {
    const authorizationHeader = event.headers.Authorization;

    if (!authorizationHeader) {
      console.log('Missing Authorization header');
      return generatePolicy(
        'user',
        'Deny',
        event.methodArn,
        'Missing Authorization header'
      );
    }

    const [authType, encodedCreds] = authorizationHeader.split(' ');

    if (authType !== 'Basic' || !encodedCreds) {
      console.log('Invalid Authorization header format');
      return generatePolicy(
        'user',
        'Deny',
        event.methodArn,
        'Invalid Authorization header format'
      );
    }

    const apiKey = Buffer.from(encodedCreds, 'base64')
      .toString('utf-8')
      .split(':')[0];

    if (apiKey !== API_KEY) {
      console.log('Invalid API key');
      return generatePolicy('user', 'Deny', event.methodArn, 'Invalid API key');
    }

    console.log('Authorization successful');
    return generatePolicy('admin', 'Allow', event.methodArn);
  } catch (error) {
    console.error('Unexpected error:', error);
    return generatePolicy(
      'user',
      'Deny',
      event.methodArn,
      'Internal server error'
    );
  }
};
