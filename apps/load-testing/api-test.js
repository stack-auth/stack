import { check } from "k6";
import http from "k6/http";
import { sleep } from "k6";

export const options = {
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: true }], // http errors should be less than 1%
    http_req_duration: [{ threshold: "p(80)<500", abortOnFail: true }], // 80% of requests should be below 500ms
    http_req_duration: [{ threshold: "p(90)<1000", abortOnFail: true }], // 90% of requests should be below 1s
    http_req_duration: [{ threshold: "p(99)<3000", abortOnFail: true }], // 99% of requests should be below 3s
  },
  scenarios: {
    average_load: {
      executor: "ramping-vus",
      stages: (() => {
        const stages = [];
        for (let i = 1; i <= 50; i++) {
          stages.push({ duration: "30s", target: 20 * i });
        }
        return stages;
      })(),
    },
  },
};

const BASE_URL = __ENV.BASE_URL;
const PROJECT_ID = __ENV.PROJECT_ID;
const PUBLISHABLE_CLIENT_KEY = __ENV.PUBLISHABLE_CLIENT_KEY;

const headers = {
  "x-stack-access-type": "client",
  "x-stack-project-id": PROJECT_ID,
  "x-stack-publishable-client-key": PUBLISHABLE_CLIENT_KEY,
};

const jsonHeaders = {
  "content-type": "application/json",
};

function signUp() {
  const res = http.post(
    `${BASE_URL}/auth/password/sign-up`,
    JSON.stringify({
      email: `${Math.random().toString(36).substring(0, 10)}@test.com`,
      password: "abcd1234",
      verification_callback_url:
        "http://localhost:8101/handler/email-verification",
    }),
    { headers: { ...headers, ...jsonHeaders } }
  );

  check(res, {
    "response code was 200": (res) => res.status == 200,
  });

  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    user_id: userId,
  } = JSON.parse(res.body);
  return { accessToken, refreshToken, userId };
}

function signIn(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/password/sign-in`,
    JSON.stringify({
      email,
      password,
    }),
    { headers: { ...headers, ...jsonHeaders } }
  );

  check(res, {
    "response code was 200": (res) => res.status == 200,
  });

  const { access_token: accessToken, user_id: userId } = JSON.parse(res.body);
  return { accessToken, userId };
}

function getUser(accessToken) {
  const res = http.get(`${BASE_URL}/users/me`, {
    headers: {
      ...headers,
      "x-stack-access-token": accessToken,
    },
  });

  check(res, {
    "response code was 200": (res) => res.status == 200,
  });
}

function updateUser(accessToken) {
  const res = http.patch(
    `${BASE_URL}/users/me`,
    JSON.stringify({
      display_name: "John Doe",
    }),
    {
      headers: {
        ...headers,
        ...jsonHeaders,
        "x-stack-access-token": accessToken,
      },
    }
  );

  check(res, {
    "response code was 200": (res) => res.status == 200,
  });
}

function refreshAccessToken(refreshToken) {
  const res = http.post(
    `${BASE_URL}/auth/sessions/current/refresh`,
    JSON.stringify({}),
    { headers: { ...headers, "x-stack-refresh-token": refreshToken } }
  );

  check(res, {
    "response code was 200": (res) => res.status == 200,
  });

  const { access_token: accessToken } = JSON.parse(res.body);
  return accessToken;
}

export default function () {
  let { accessToken, refreshToken } = signUp();

  for (let i = 0; i < 100; i++) {
    // 20% chance update user
    if (Math.random() < 0.2) {
      updateUser(accessToken);
    }

    // 10% chance refresh token
    if (Math.random() < 0.1) {
      accessToken = refreshAccessToken(refreshToken);
    }

    getUser(accessToken);

    sleep(Math.random() * 5);
  }
}
