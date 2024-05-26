#!/usr/bin/env bash

GROUP_CHAT_ID=$(echo $CREATE_GROUP_CHAT_RESULT | jq -r .data.createGroupChat.groupChatId)
USER_ACCOUNT_ID=${USER_ACCOUNT_ID:-UserAccount-01H7C6DWMK1BKS1JYH1XZE529M}
WRITE_API_SERVER_BASE_URL=${WRITE_API_SERVER_BASE_URL:-http://localhost:38080}

# 勤怠打刻
echo -e "\nCreate Attendance(${GROUP_CHAT_ID}, ${USER_ACCOUNT_ID}):"
POST_MESSAGE_RESULT=$(curl -s -X POST -H "Content-Type: application/json" \
	${WRITE_API_SERVER_BASE_URL}/query \
	-d @- <<EOS
{
  "query": "mutation CreateAttendance(\$input: CreateAttendanceInput!) { createAttendance(input: \$input) { executorId } }",
  "variables": {
    "input": {
      "executorId": "${USER_ACCOUNT_ID}",
      "stampingAt": 1716094542604
    }
  }
}
EOS
)