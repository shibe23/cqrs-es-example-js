#!/usr/bin/env bash

GROUP_CHAT_ID=$(echo $CREATE_GROUP_CHAT_RESULT | jq -r .data.createGroupChat.groupChatId)
USER_ACCOUNT_ID=${USER_ACCOUNT_ID:-UserAccount-01H7C6DWMK1BKS1JYH1XZE529M}
WRITE_API_SERVER_BASE_URL=${WRITE_API_SERVER_BASE_URL:-http://localhost:38080}
READ_API_SERVER_BASE_URL=${READ_API_SERVER_BASE_URL:-http://localhost:38082}

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

sleep 1

# 勤怠取得
echo -e "\nGet AttendanceStamps(${USER_ACCOUNT_ID}, ${ADMIN_ID}):"
GET_ATTENDANCE_STAMP_RESULT=$(curl -s -X POST -H "Content-Type: application/json" \
	${READ_API_SERVER_BASE_URL}/query \
	-d @- <<EOS
{ "query": "{ getAttendanceStamps(userAccountId: \"${USER_ACCOUNT_ID}\") { id, userAccountId, stampingAt, createdAt, updatedAt } }" }
EOS
)

if echo $GET_ATTENDANCE_STAMP_RESULT | jq -e .errors > /dev/null; then
  echo "Error: $GET_ATTENDANCE_STAMP_RESULT"
  exit 1
fi

echo "Result: $GET_ATTENDANCE_STAMP_RESULT"