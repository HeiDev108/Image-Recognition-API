BEGIN TRANSACTION;

INSERT into users (name, email, entries, joined, age, pet ) values ('test', 'test@test.com', '2', '2020-08-01', '23', 'Dog');
INSERT into login (hash, email) values ('$2a$10$ZY5NBH1cyNKKijOwBfQ2T.crsLqkkVW2JsOX1W2xrYs7mObn.R8Qm', 'test@test.com');

COMMIT;
