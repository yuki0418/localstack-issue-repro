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

5. Sign in the user to get the access token
```bash
curl -X POST 'https://test.execute-api.localhost.localstack.cloud:4566/user/signin' \
-H "Content-Type: application/json" \
-d '{"email": "test@example.com", "password": "P@ss1234"}'
```
You will get the access token and IdToken in the response.

6. Change the email address
```bash
curl -X POST 'https://test.execute-api.localhost.localstack.cloud:4566/user/email' \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <Access Token>" \
-d '{"email": "test+1@example.com"}'
```

You will get with 
```
HTTP/2 401 
server: TwistedWeb/24.3.0
date: Sat, 26 Jul 2025 02:44:36 GMT
content-type: application/json
apigw-requestid: 18e4f871
content-length: 26

{"message":"Unauthorized"}% 
```