CREATE TABLE `attendance_stamp`
(
    `id`              varchar(64) NOT NULL,
    `user_account_id` varchar(64) NOT NULL,
    `stamping_at`     datetime    NOT NULL,
    `created_at`      datetime    NOT NULL,
    `updated_at`      datetime    NOT NULL,
    `status`          TEXT        NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

