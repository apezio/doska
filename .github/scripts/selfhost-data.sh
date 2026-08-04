#!/usr/bin/env bash
# Seeds a board/column/card into the bundled Postgres and reads it back, so the
# upgrade and restore tests can assert data survived.
#
# Straight SQL rather than the sync API: this has to run against a released
# image whose wire format we do not control, and the columns used here are the
# ones present since the first migration.
#
#   COMPOSE="docker compose -f docker-compose.selfhost.yml" ./selfhost-data.sh seed
#   ./selfhost-data.sh verify
set -euo pipefail

COMPOSE=${COMPOSE:-docker compose -f docker-compose.selfhost.yml}
BOARD_ID=board-selfhost-ci
COLUMN_ID=col-selfhost-ci
CARD_ID=card-selfhost-ci
BOARD_TITLE="CI board"
CARD_TITLE="survives the upgrade"

pass() { printf '  ✓ %s\n' "$1"; }
fail() { printf '  ✗ %s\n' "$1" >&2; exit 1; }

psql() { $COMPOSE exec -T db psql -U doska -d doska -v ON_ERROR_STOP=1 "$@"; }

seed() {
  psql --quiet > /dev/null <<SQL
insert into counters (id, value) values ('dashboards', 1)
  on conflict (id) do update set value = greatest(counters.value, 1);
insert into counters (id, value) values ('board:$BOARD_ID', 2)
  on conflict (id) do update set value = greatest(counters.value, 2);
insert into dashboards (id, title, position, updated_at, seq)
  values ('$BOARD_ID', '$BOARD_TITLE', 'a0', 1, 1);
insert into columns (id, board_id, title, position, updated_at, seq)
  values ('$COLUMN_ID', '$BOARD_ID', 'Todo', 'a0', 1, 1);
insert into cards (id, board_id, column_id, title, body, position, updated_at, seq)
  values ('$CARD_ID', '$BOARD_ID', '$COLUMN_ID', '$CARD_TITLE', 'hello', 'a0', 1, 2);
SQL
  pass "seeded $BOARD_ID"
}

verify() {
  local got
  got=$(psql -tAc "select title from dashboards where id = '$BOARD_ID' and deleted_at is null")
  [ "$got" = "$BOARD_TITLE" ] || fail "board title is '$got', want '$BOARD_TITLE'"

  got=$(psql -tAc "select title from cards where id = '$CARD_ID' and deleted_at is null")
  [ "$got" = "$CARD_TITLE" ] || fail "card title is '$got', want '$CARD_TITLE'"

  # The card's join to its column and board is what a migration is most likely
  # to break, so assert the shape rather than three isolated rows.
  got=$(psql -tAc "select count(*) from cards c
    join columns o on o.id = c.column_id
    join dashboards d on d.id = c.board_id
    where c.id = '$CARD_ID' and o.id = '$COLUMN_ID' and d.id = '$BOARD_ID'")
  [ "$got" = "1" ] || fail "card is no longer joined to its column and board"

  pass "board, column and card all survived"
}

case ${1:-} in
  seed) seed ;;
  verify) verify ;;
  *) fail "usage: $0 seed|verify" ;;
esac
