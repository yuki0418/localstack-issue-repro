# Problem
When use `HttpUserPoolAuthorizer` from `aws-cdk-lib/aws-apigatewayv2-authorizers`, API authorizer always returns `Unauthorized` message and 401 status.

# Requirements
- pnpm
- Docker
- LocalStack Pro

# Setup
1. Run LocalStack Pro
```bash
$ export LOCALSTACK_AUTH_TOKEN="<your_localstack_pro_auth_token>"
$ docker compose up
```

# Reproduction Steps
1. Install packages
```bash
$ pnpm install
```

2. Bootstrap adn deploy the CDK environment
```bash
$ cdklocal bootstrap
$ cdklocal deploy --all --require-approval never
```

3. Sign up a user
```bash
curl -X POST 'https://test.execute-api.localhost.localstack.cloud:4566/user/signup' \
-H "Content-Type: application/json" \
-d '{"email": "test@example.com", "password": "P@ss1234", "firstName": "Yuki", "lastName": "Ishii"}'
```

4. Confirm the user
You can get the confirmation code from the docker logs
```bash
curl -X POST 'https://test.execute-api.localhost.localstack.cloud:4566/user/confirm' \
-H "Content-Type: application/json" \
-d '{"email": "test@example.com", "confirmationCode": "<confirmation_code>"}'
```

5. Forget password
```bash
curl -X POST 'https://test.execute-api.localhost.localstack.cloud:4566/user/forgotPassword' \
-H "Content-Type: application/json" \
-d '{"email": "test@example.com"}'
```

You will get with 
```
HTTP/2 500 
server: TwistedWeb/24.3.0
date: Wed, 27 Aug 2025 00:31:20 GMT
content-type: text/plain; charset=utf-8
content-length: 228
apigw-requestid: 9ec8986a
x-localstack: true

{"error":{"name":"UserLambdaValidationException","$fault":"client","$metadata":{"httpStatusCode":400,"requestId":"4511e906-3a40-4f6c-b0a8-baff876f2cb3","attempts":1,"totalRetryDelay":0},"__type":"UserLambdaValidationException"}}%
```

If you check logs of the `/aws/lambda/test-user-pool-stack-custommessage{random_suffix}`, you will see
```
ERROR Invoke Error {"errorType":"Error","errorMessage":"userAttributes is required for forgot password","stack":["Error: userAttributes is required for forgot password"," at Runtime.handler (/var/task/index.js:884514:11)"," at Runtime.handleOnceNonStreaming (file:///var/runtime/index.mjs:1206:29)"]}
```

Because `event.request` does not have `userAttributes` for `CustomMessage_ForgotPassword` trigger.
```
event.request response
{ codeParameter: '827851', usernameParameter: 'test@example.com' }
```

This should have `userAttributes` according to [AWS Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html#cognito-user-pools-lambda-trigger-syntax-custom-message).
