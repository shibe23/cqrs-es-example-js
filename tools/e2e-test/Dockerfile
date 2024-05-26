FROM bash:devel-alpine3.19

RUN apk add --no-cache curl jq

ADD ./verify-group-chat.sh ./
ADD ./verify-attendance-stamp ./

ENTRYPOINT ["./verify-group-chat.sh", "./verify-attendance-stamp.sh"]